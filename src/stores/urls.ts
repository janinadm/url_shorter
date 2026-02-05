import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuthStore } from './auth'
import type { ShortUrl } from '@/types'
import {
    SHORT_CODE_LENGTH,
    SHORT_CODE_CHARS,
    CUSTOM_ALIAS_MIN_LENGTH,
    CUSTOM_ALIAS_MAX_LENGTH,
    CUSTOM_ALIAS_PATTERN,
    FREE_LINK_EXPIRATION_DAYS,
    REQUEST_TIMEOUT_MS
} from '@/constants'

// =============================================================================
// Mock Data (Development Only)
// =============================================================================

const MOCK_URLS: ShortUrl[] = [
    {
        id: '1',
        userId: 'demo',
        shortCode: 'abc123',
        originalUrl: 'https://example.com/very-long-article-about-something',
        title: 'Example Article',
        createdAt: new Date().toISOString(),
        clicks: 142
    },
    {
        id: '2',
        userId: 'demo',
        shortCode: 'xyz789',
        originalUrl: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
        title: 'My Video',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        clicks: 58
    }
]

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Generate a random short code
 */
function generateShortCode(): string {
    return Array.from(
        { length: SHORT_CODE_LENGTH },
        () => SHORT_CODE_CHARS.charAt(Math.floor(Math.random() * SHORT_CODE_CHARS.length))
    ).join('')
}

/**
 * Validate a custom alias format
 * @throws Error if alias is invalid
 */
function validateCustomAlias(alias: string): void {
    if (alias.length < CUSTOM_ALIAS_MIN_LENGTH || alias.length > CUSTOM_ALIAS_MAX_LENGTH) {
        throw new Error(
            `Custom alias debe tener entre ${CUSTOM_ALIAS_MIN_LENGTH} y ${CUSTOM_ALIAS_MAX_LENGTH} caracteres.`
        )
    }
    if (!CUSTOM_ALIAS_PATTERN.test(alias)) {
        throw new Error('Custom alias solo puede contener letras, números y guiones.')
    }
}

/**
 * Calculate expiration date for free users
 */
function calculateExpiration(userPlan: string): string | null {
    if (userPlan === 'free') {
        const date = new Date()
        date.setDate(date.getDate() + FREE_LINK_EXPIRATION_DAYS)
        return date.toISOString()
    }
    return null
}

/**
 * Map database row to ShortUrl type
 */
function mapToShortUrl(row: any, clicks = 0): ShortUrl {
    return {
        id: row.id,
        userId: row.user_id,
        shortCode: row.short_code,
        originalUrl: row.original_url,
        title: row.title,
        createdAt: row.created_at,
        clicks,
        expiresAt: row.expires_at
    }
}

/**
 * Get access token from current session
 * @throws Error if no valid session
 */
async function getAccessToken(): Promise<string> {
    const { data: session } = await supabase.auth.getSession()
    const token = session?.session?.access_token

    if (!token) {
        throw new Error('Session expired. Please sign in again.')
    }

    return token
}

// =============================================================================
// Store Definition
// =============================================================================

export const useUrlStore = defineStore('urls', () => {
    // State
    const urls = ref<ShortUrl[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)

    // Computed
    const totalUrls = computed(() => urls.value.length)
    const totalClicks = computed(() =>
        urls.value.reduce((sum, url) => sum + (url.clicks || 0), 0)
    )

    // ==========================================================================
    // Fetch URLs
    // ==========================================================================

    /**
     * Fetch all URLs for the authenticated user
     */
    async function fetchUrls(): Promise<void> {
        const authStore = useAuthStore()
        if (!authStore.user) return

        loading.value = true

        try {
            if (!isSupabaseConfigured) {
                urls.value = MOCK_URLS
                return
            }

            const { data, error: fetchError } = await supabase
                .from('urls')
                .select('*, clicks:clicks(count)')
                .eq('user_id', authStore.user.id)
                .order('created_at', { ascending: false })

            if (fetchError) throw fetchError

            urls.value = (data || []).map(row => ({
                ...mapToShortUrl(row),
                clicks: row.clicks?.[0]?.count || 0
            }))
        } catch (e) {
            console.error('Error fetching URLs:', e)
            urls.value = []
            error.value = 'Failed to load URLs'
        } finally {
            loading.value = false
        }
    }

    // ==========================================================================
    // Create URL - Helper Functions
    // ==========================================================================

    /**
     * Check if user already has a shortened version of this URL
     */
    async function findExistingUrlForUser(
        originalUrl: string,
        userId: string
    ): Promise<ShortUrl | null> {
        const { data } = await supabase
            .from('urls')
            .select('*')
            .eq('user_id', userId)
            .eq('original_url', originalUrl)
            .maybeSingle()

        return data ? mapToShortUrl(data) : null
    }

    /**
     * Check if a short code is available (or can be reclaimed if expired)
     * @throws Error if code is taken and not expired
     */
    async function ensureShortCodeAvailable(shortCode: string): Promise<void> {
        const { data: existing } = await supabase
            .from('urls')
            .select('id, expires_at, user_id')
            .eq('short_code', shortCode)
            .maybeSingle()

        if (!existing) return // Available

        const now = new Date()
        const expiresAt = existing.expires_at ? new Date(existing.expires_at) : null
        const isExpired = expiresAt && expiresAt < now

        if (isExpired) {
            // Anti-Squatting: Free users cannot reclaim their OWN expired aliases
            // This prevents them from just deleting/recreating to extend the 3 days indefinitely
            const authStore = useAuthStore()
            if (authStore.user?.plan === 'free' && existing.user_id === authStore.user.id) {
                throw new Error(`Los usuarios Free no pueden "renovar" un alias expirado ('${shortCode}'). Actualiza a Pro para mantener tus links para siempre o usa un alias nuevo.`)
            }

            // Try to reclaim expired alias
            const { data: claimed, error: claimError } = await supabase
                .rpc('claim_expired_alias', { target_short_code: shortCode })

            if (claimError) {
                throw new Error('Failed to claim expired alias.')
            }
            if (!claimed) {
                throw new Error(`Could not claim alias '${shortCode}'. It may have been renewed.`)
            }
        } else {
            // Alias is taken. Check if it will expire.
            if (expiresAt) {
                const diffMs = expiresAt.getTime() - now.getTime()
                const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
                const diffHours = Math.ceil(diffMs / (1000 * 60 * 60))

                let timeMsg = `${diffDays} días`
                if (diffDays <= 1) timeMsg = `${diffHours} horas`

                throw new Error(`El alias '${shortCode}' está ocupado. Estará disponible en aprox. ${timeMsg}.`)
            }

            throw new Error(`El alias '${shortCode}' ya está en uso por un usuario Pro (Permanente).`)
        }
    }

    /**
     * Insert a new URL into the database
     */
    async function insertUrl(
        shortCode: string,
        originalUrl: string,
        title: string | undefined,
        expiresAt: string | null,
        userId: string
    ): Promise<ShortUrl> {
        const accessToken = await getAccessToken()
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''

        // Create request with timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

        try {
            const response = await fetch(`${supabaseUrl}/rest/v1/urls`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${accessToken}`,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    user_id: userId,
                    short_code: shortCode,
                    original_url: originalUrl,
                    title: title || null,
                    expires_at: expiresAt
                }),
                signal: controller.signal
            })

            clearTimeout(timeoutId)

            if (!response.ok) {
                const errorData = await response.json()

                // Handle duplicate key error
                if (errorData.code === '23505' || errorData.message?.includes('duplicate')) {
                    throw new Error(`Custom alias '${shortCode}' is already taken.`)
                }

                throw new Error(errorData.message || 'Failed to create URL')
            }

            const [data] = await response.json()
            return mapToShortUrl(data)

        } catch (e: any) {
            clearTimeout(timeoutId)

            if (e.name === 'AbortError') {
                throw new Error('Request timed out. Please try again.')
            }
            throw e
        }
    }

    // ==========================================================================
    // Create URL - Main Function
    // ==========================================================================

    /**
     * Create a new shortened URL
     *
     * @param originalUrl - The URL to shorten
     * @param title - Optional title for the link
     * @param customAlias - Optional custom short code
     * @returns The created ShortUrl or null if user not authenticated
     */
    async function createUrl(
        originalUrl: string,
        title?: string,
        customAlias?: string
    ): Promise<ShortUrl | null> {
        const authStore = useAuthStore()
        const user = authStore.user

        if (!user) {
            throw new Error('Please sign in to create links.')
        }

        // Determine short code
        const shortCode = customAlias || generateShortCode()

        // Validate custom alias if provided
        if (customAlias) {
            validateCustomAlias(customAlias)
        }

        // Calculate expiration
        const expiresAt = calculateExpiration(user.plan)

        // Handle mock mode
        if (!isSupabaseConfigured) {
            if (urls.value.some(u => u.shortCode === shortCode)) {
                throw new Error('Custom alias already exists')
            }

            const newUrl: ShortUrl = {
                id: Date.now().toString(),
                userId: user.id,
                shortCode,
                originalUrl,
                title,
                expiresAt: expiresAt || undefined,
                createdAt: new Date().toISOString(),
                clicks: 0
            }

            urls.value.unshift(newUrl)
            return newUrl
        }

        // Check for duplicate URL (return existing if found)
        // CASE 3: Only check for existing URL if NO custom alias is provided.
        // If custom alias IS provided, we ignore existing URLs and try to create a new one (unless that specific alias exists).
        // Check for duplicate URL (return existing if found)

        // --- PRIORITY 1: Handle Custom Alias Specifics (Anti-Squatting & Ownership) ---
        if (customAlias) {
            const existingWithAlias = urls.value.find(u => u.shortCode === customAlias)

            // If we found it in local state, it means we own it
            if (existingWithAlias) {
                const isExpired = existingWithAlias.expiresAt && new Date(existingWithAlias.expiresAt) < new Date()

                // CRITICAL: Block Free users from reclaiming OWN expired alias (Anti-Squatting)
                if (isExpired && user.plan === 'free') {
                    throw new Error(`Los usuarios Free no pueden "renovar" un alias expirado ('${customAlias}'). Actualiza a Pro para mantener tus links para siempre o usa un alias nuevo.`)
                }

                // If active and matches original URL -> It's B2.1 or B2.2 (Return/Update Title)
                if (existingWithAlias.originalUrl === originalUrl) {
                    // CASE 2: Update title if changed (consistency)
                    if (title && existingWithAlias.title !== title) {
                        const { error: updateError } = await supabase
                            .from('urls')
                            .update({ title })
                            .eq('id', existingWithAlias.id)

                        if (!updateError) {
                            existingWithAlias.title = title
                        }
                    }
                    return existingWithAlias
                }

                // If active but DIFFERENT URL -> B2.3 (Future Bio Page)
                // For now, fall through to 'ensureShortCodeAvailable' which will throw "Alias Taken"
                // Or explicit error here if not expired:
                if (!isExpired) {
                    throw new Error(`Ya utilizas el alias '${customAlias}' para otra URL.`)
                }
            }
        }

        // --- PRIORITY 2: General Availability Check ---
        // This handles "Taken by other", "Expired & Reclaimable (if not mine)", etc.
        await ensureShortCodeAvailable(shortCode)

        // --- PRIORITY 3: Duplicate URL Check (Only if NO custom alias) ---
        if (!customAlias) {
            const existingUrl = await findExistingUrlForUser(originalUrl, user.id)

            if (existingUrl) {
                const isExpired = existingUrl.expiresAt && new Date(existingUrl.expiresAt) < new Date()

                // Only reuse if NOT expired. If expired, we treat as new (A3)
                if (!isExpired) {
                    // CASE 2: Update title if changed
                    if (title && existingUrl.title !== title) {
                        const { error: updateError } = await supabase
                            .from('urls')
                            .update({ title })
                            .eq('id', existingUrl.id)

                        if (!updateError) {
                            existingUrl.title = title

                            // Update local state and PRESERVE clicks
                            const idx = urls.value.findIndex(u => u.id === existingUrl.id)
                            if (idx !== -1 && urls.value[idx]) {
                                urls.value[idx].title = title
                                existingUrl.clicks = urls.value[idx].clicks
                            }
                        }
                    } else {
                        // Preserve clicks if returning existing
                        const existingInStore = urls.value.find(u => u.id === existingUrl.id)
                        if (existingInStore) existingUrl.clicks = existingInStore.clicks
                    }

                    // Move to top
                    const idx = urls.value.findIndex(u => u.id === existingUrl.id)
                    if (idx !== -1) urls.value.splice(idx, 1)
                    urls.value.unshift(existingUrl)
                    return existingUrl
                }
                // If expired, we ignore `existingUrl` and proceed to create NEW one (A3)
            }
        }

        // Ensure short code is available
        await ensureShortCodeAvailable(shortCode)

        // Insert new URL
        const newUrl = await insertUrl(shortCode, originalUrl, title, expiresAt, user.id)

        urls.value.unshift(newUrl)
        return newUrl
    }

    // ==========================================================================
    // Delete URL
    // ==========================================================================

    /**
     * Delete a URL by ID
     */
    async function deleteUrl(id: string): Promise<void> {
        if (!isSupabaseConfigured) {
            urls.value = urls.value.filter(u => u.id !== id)
            return
        }

        const { error: deleteError } = await supabase
            .from('urls')
            .delete()
            .eq('id', id)

        if (deleteError) throw deleteError

        urls.value = urls.value.filter(u => u.id !== id)
    }

    // ==========================================================================
    // Reset
    // ==========================================================================

    /**
     * Reset store to initial state
     */
    function reset(): void {
        urls.value = []
        loading.value = false
        error.value = null
    }

    // ==========================================================================
    // Return Public API
    // ==========================================================================

    return {
        // State
        urls,
        loading,
        error,

        // Computed
        totalUrls,
        totalClicks,

        // Actions
        fetchUrls,
        createUrl,
        deleteUrl,
        reset
    }
})
