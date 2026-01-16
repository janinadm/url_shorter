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

        // Generate short code
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
        let shortCode = ''
        for (let i = 0; i < 6; i++) {
            shortCode += chars.charAt(Math.floor(Math.random() * chars.length))
        }

        if (!isSupabaseConfigured) {
            // Mock create in dev mode
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

        const { data, error } = await supabase
            .from('urls')
            .insert({
                user_id: authStore.user.id,
                short_code: shortCode,
                original_url: originalUrl,
                title
            })
            .select()
            .single()

        if (error) throw error

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
                urls.value[idx] = { ...urls.value[idx], ...updates }
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
            urls.value[idx] = { ...urls.value[idx], ...updates }
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
