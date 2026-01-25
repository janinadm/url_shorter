import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuthStore } from './auth'
import type { ShortUrl } from '@/types'

// Mock data for development without Supabase
const mockUrls: ShortUrl[] = [
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

export const useUrlStore = defineStore('urls', () => {
    const urls = ref<ShortUrl[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)

    const totalUrls = computed(() => urls.value.length)
    const totalClicks = computed(() =>
        urls.value.reduce((sum, url) => sum + (url.clicks || 0), 0)
    )

    async function fetchUrls() {
        const authStore = useAuthStore()
        if (!authStore.user) return

        loading.value = true
        try {
            if (!isSupabaseConfigured) {
                // Use mock data in dev mode
                urls.value = mockUrls
                return
            }

            const { data, error: err } = await supabase
                .from('urls')
                .select('*, clicks:clicks(count)')
                .eq('user_id', authStore.user.id)
                .order('created_at', { ascending: false })

            if (err) throw err

            urls.value = (data || []).map(row => ({
                id: row.id,
                userId: row.user_id,
                shortCode: row.short_code,
                originalUrl: row.original_url,
                title: row.title,
                createdAt: row.created_at,
                clicks: row.clicks?.[0]?.count || 0,
                expiresAt: row.expires_at
            }))
        } catch (e) {
            console.error('Error fetching URLs:', e)
            // Reset to empty on error to clear loading state issues
            urls.value = []
            error.value = 'Failed to load URLs'
        } finally {
            loading.value = false
        }
    }

    async function createUrl(originalUrl: string, title?: string, customAlias?: string): Promise<ShortUrl | null> {
        const authStore = useAuthStore()
        if (!authStore.user) return null

        let shortCode = customAlias

        // Validate custom alias format (alphanumeric, hyphens, 3-20 chars)
        if (shortCode) {
            const valid = /^[a-zA-Z0-9-]{3,20}$/.test(shortCode)
            if (!valid) {
                throw new Error('Custom alias must be 3-20 characters, alphanumeric or hyphens.')
            }
        } else {
            // Generate random 6-character short code
            const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
            shortCode = Array.from({ length: 6 }, () =>
                chars.charAt(Math.floor(Math.random() * chars.length))
            ).join('')
        }

        // Calculate expiration for Free users
        let expiresAt: string | null = null
        if (authStore.user.plan === 'free') {
            const date = new Date()
            date.setDate(date.getDate() + 3)
            expiresAt = date.toISOString()
        }

        // Use mock data in dev mode
        if (!isSupabaseConfigured) {
            // Check for duplicate in mock data
            if (urls.value.some(u => u.shortCode === shortCode)) {
                throw new Error('Custom alias already exists')
            }

            const newUrl: ShortUrl = {
                id: Date.now().toString(),
                userId: authStore.user.id,
                shortCode: shortCode!, // valid here
                originalUrl,
                title,
                expiresAt: expiresAt || undefined,
                createdAt: new Date().toISOString(),
                clicks: 0
            }
            urls.value.unshift(newUrl)
            return newUrl
        }

        // Check if user already shortened this Exact URL (to prevent duplicates)
        if (isSupabaseConfigured) {
            const { data: existingUrl } = await supabase
                .from('urls')
                .select('*')
                .eq('user_id', authStore.user.id)
                .eq('original_url', originalUrl)
                .maybeSingle()

            if (existingUrl) {
                // Return existing link instead of creating duplicate
                const mappedUrl: ShortUrl = {
                    id: existingUrl.id,
                    userId: existingUrl.user_id,
                    shortCode: existingUrl.short_code,
                    originalUrl: existingUrl.original_url,
                    title: existingUrl.title,
                    createdAt: existingUrl.created_at,
                    clicks: 0, // We'd need to fetch clicks separate or assume 0/reload, but for creation return it's fine
                    expiresAt: existingUrl.expires_at
                }

                // Move to top of list if locally present
                const localIdx = urls.value.findIndex(u => u.id === mappedUrl.id)
                if (localIdx !== -1) {
                    urls.value.splice(localIdx, 1)
                    urls.value.unshift(mappedUrl)
                } else {
                    urls.value.unshift(mappedUrl)
                }

                return mappedUrl
            }
        }

        // Check if alias exists and handle expiration reclamation
        if (isSupabaseConfigured) {
            console.log('Checking availability for:', shortCode)
            const { data: existing } = await supabase
                .from('urls')
                .select('id, expires_at')
                .eq('short_code', shortCode)
                .maybeSingle()

            if (existing) {
                const isExpired = existing.expires_at && new Date(existing.expires_at) < new Date()
                console.log('Alias exists. Expired?', isExpired)

                if (isExpired) {
                    console.log('Attempting to reclaim expired alias...')
                    // Reclamation: Call secure RPC to delete expired link
                    const { data: claimed, error: claimError } = await supabase
                        .rpc('claim_expired_alias', { target_short_code: shortCode })

                    if (claimError) {
                        console.error('RPC Error:', claimError)
                        throw new Error('Failed to claim expired alias. Database error.')
                    }

                    if (!claimed) {
                        console.warn('RPC returned false (could not claim)')
                        throw new Error(`Could not claim alias '${shortCode}'. It may have been renewed or taken.`)
                    }
                    console.log('Alias successfully reclaimed.')
                } else {
                    // Active link - cannot take it
                    throw new Error(`Custom alias '${shortCode}' is already taken. Please choose another one.`)
                }
            }
        }

        // Get access token from localStorage (bypasses Supabase client blocking issues)
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
        const projectRef = supabaseUrl.split('//')[1]?.split('.')[0] || ''
        const storageKey = `sb-${projectRef}-auth-token`
        const storedSession = localStorage.getItem(storageKey)

        if (!storedSession) {
            throw new Error('Session not found. Please sign in again.')
        }

        const { access_token: accessToken } = JSON.parse(storedSession)

        console.log('Inserting new link...')
        // Insert URL using raw fetch (bypasses Supabase client blocking issues)
        const insertResponse = await fetch(`${supabaseUrl}/rest/v1/urls`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${accessToken}`,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                user_id: authStore.user.id,
                short_code: shortCode,
                original_url: originalUrl,
                title: title || null,
                expires_at: expiresAt
            })
        })

        if (!insertResponse.ok) {
            const error = await insertResponse.json()
            console.error('Insert error:', error)
            // Handle duplicate key error (code 23505)
            if (error.code === '23505' || error.message?.includes('duplicate')) {
                throw new Error(`Custom alias '${shortCode}' is already taken. Please choose another one.`)
            }
            throw new Error(error.message || 'Failed to create URL')
        }

        console.log('Link created successfully')
        const [data] = await insertResponse.json()

        const newUrl: ShortUrl = {
            id: data.id,
            userId: data.user_id,
            shortCode: data.short_code,
            originalUrl: data.original_url,
            title: data.title,
            expiresAt: data.expires_at,
            createdAt: data.created_at,
            clicks: 0
        }
        urls.value.unshift(newUrl)
        return newUrl
    }

    async function deleteUrl(id: string) {
        if (!isSupabaseConfigured) {
            urls.value = urls.value.filter(u => u.id !== id)
            return
        }

        const { error: err } = await supabase
            .from('urls')
            .delete()
            .eq('id', id)

        if (err) throw err
        urls.value = urls.value.filter(u => u.id !== id)
    }

    function reset() {
        urls.value = []
        loading.value = false
        error.value = null
    }

    return {
        urls,
        loading,
        error,
        totalUrls,
        totalClicks,
        fetchUrls,
        createUrl,
        deleteUrl,
        reset
    }
})
