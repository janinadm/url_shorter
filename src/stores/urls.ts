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

            const { data, error } = await supabase
                .from('urls')
                .select('*, clicks:clicks(count)')
                .eq('user_id', authStore.user.id)
                .order('created_at', { ascending: false })

            if (error) throw error

            urls.value = (data || []).map(row => ({
                id: row.id,
                userId: row.user_id,
                shortCode: row.short_code,
                originalUrl: row.original_url,
                title: row.title,
                createdAt: row.created_at,
                clicks: row.clicks?.[0]?.count || 0
            }))
        } finally {
            loading.value = false
        }
    }

    async function createUrl(originalUrl: string, title?: string): Promise<ShortUrl | null> {
        const authStore = useAuthStore()
        if (!authStore.user) return null

        // Generate random 6-character short code
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
        const shortCode = Array.from({ length: 6 }, () =>
            chars.charAt(Math.floor(Math.random() * chars.length))
        ).join('')

        // Use mock data in dev mode
        if (!isSupabaseConfigured) {
            const newUrl: ShortUrl = {
                id: Date.now().toString(),
                userId: authStore.user.id,
                shortCode,
                originalUrl,
                title,
                createdAt: new Date().toISOString(),
                clicks: 0
            }
            urls.value.unshift(newUrl)
            return newUrl
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
        if (!accessToken) {
            throw new Error('No access token. Please sign in again.')
        }

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
                title: title || null
            })
        })

        if (!insertResponse.ok) {
            const error = await insertResponse.json()
            throw new Error(error.message || 'Failed to create URL')
        }

        const [data] = await insertResponse.json()

        const newUrl: ShortUrl = {
            id: data.id,
            userId: data.user_id,
            shortCode: data.short_code,
            originalUrl: data.original_url,
            title: data.title,
            createdAt: data.created_at,
            clicks: 0
        }
        urls.value.unshift(newUrl)
        return newUrl
    }

    async function updateUrl(id: string, updates: { title?: string; originalUrl?: string }) {
        if (!isSupabaseConfigured) {
            const idx = urls.value.findIndex(u => u.id === id)
            if (idx !== -1) {
                const current = urls.value[idx]
                if (current) {
                    urls.value[idx] = {
                        ...current,
                        title: updates.title ?? current.title,
                        originalUrl: updates.originalUrl ?? current.originalUrl
                    }
                }
            }
            return
        }

        const { error } = await supabase
            .from('urls')
            .update({
                title: updates.title,
                original_url: updates.originalUrl
            })
            .eq('id', id)

        if (error) throw error

        const idx = urls.value.findIndex(u => u.id === id)
        if (idx !== -1) {
            const current = urls.value[idx]
            if (current) {
                urls.value[idx] = {
                    ...current,
                    title: updates.title ?? current.title,
                    originalUrl: updates.originalUrl ?? current.originalUrl
                }
            }
        }
    }

    async function deleteUrl(id: string) {
        if (!isSupabaseConfigured) {
            urls.value = urls.value.filter(u => u.id !== id)
            return
        }

        const { error } = await supabase
            .from('urls')
            .delete()
            .eq('id', id)

        if (error) throw error
        urls.value = urls.value.filter(u => u.id !== id)
    }

    return {
        urls,
        loading,
        totalUrls,
        totalClicks,
        fetchUrls,
        createUrl,
        updateUrl,
        deleteUrl
    }
})
