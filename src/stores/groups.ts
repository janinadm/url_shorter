import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuthStore } from './auth'
import type { LinkGroup, ShortUrl } from '@/types'

export const useGroupStore = defineStore('groups', () => {
    const groups = ref<LinkGroup[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)

    const totalGroups = computed(() => groups.value.length)

    /**
     * Map DB row to LinkGroup
     */
    function mapToLinkGroup(row: any): LinkGroup {
        return {
            id: row.id,
            userId: row.user_id,
            slug: row.slug,
            title: row.title,
            description: row.description,
            theme: row.theme || 'default',
            expiresAt: row.expires_at,
            createdAt: row.created_at,
            links: row.urls?.map(mapToShortUrl) || []
        }
    }

    /**
     * Map DB row to ShortUrl (for nested links)
     */
    function mapToShortUrl(row: any): ShortUrl {
        return {
            id: row.id,
            userId: row.user_id,
            shortCode: row.short_code,
            originalUrl: row.original_url,
            title: row.title,
            expiresAt: row.expires_at,
            createdAt: row.created_at,
            clicks: row.clicks || 0,
            groupId: row.group_id
        }
    }

    /**
     * Fetch all groups for current user
     */
    async function fetchGroups(): Promise<void> {
        if (!isSupabaseConfigured) return

        const authStore = useAuthStore()
        if (!authStore.user) return

        loading.value = true
        error.value = null

        try {
            const { data, error: fetchError } = await supabase
                .from('link_groups')
                .select('*, urls(*)')
                .eq('user_id', authStore.user.id)
                .order('created_at', { ascending: false })

            if (fetchError) throw fetchError

            groups.value = (data || []).map(mapToLinkGroup)
        } catch (e: any) {
            error.value = e.message
            console.error('Failed to fetch groups:', e)
        } finally {
            loading.value = false
        }
    }

    /**
     * Fetch a single group by ID (with links)
     */
    async function fetchGroupById(id: string): Promise<LinkGroup | null> {
        if (!isSupabaseConfigured) return null

        try {
            const { data, error: fetchError } = await supabase
                .from('link_groups')
                .select('*, urls(*)')
                .eq('id', id)
                .single()

            if (fetchError) throw fetchError
            return mapToLinkGroup(data)
        } catch (e: any) {
            console.error('Failed to fetch group:', e)
            return null
        }
    }

    /**
     * Fetch a group by slug (for public bio page)
     */
    async function fetchGroupBySlug(slug: string): Promise<LinkGroup | null> {
        if (!isSupabaseConfigured) return null

        try {
            const { data, error: fetchError } = await supabase
                .from('link_groups')
                .select('*, urls(*)')
                .eq('slug', slug)
                .single()

            if (fetchError) throw fetchError
            return mapToLinkGroup(data)
        } catch (e: any) {
            console.error('Failed to fetch group by slug:', e)
            return null
        }
    }

    /**
     * Create a new group
     */
    async function createGroup(
        slug: string,
        title: string,
        description?: string
    ): Promise<LinkGroup | null> {
        if (!isSupabaseConfigured) return null

        const authStore = useAuthStore()
        if (!authStore.user) throw new Error('Not authenticated')

        // Check group limit for Free users
        if (authStore.user.plan === 'free' && totalGroups.value >= 1) {
            throw new Error('Free users can only create 1 Bio Page. Upgrade to Pro for unlimited!')
        }

        // Validate slug format
        if (slug.length < 3 || slug.length > 20) {
            throw new Error('Slug must be 3-20 characters')
        }
        if (!/^[a-z0-9-]+$/.test(slug)) {
            throw new Error('Slug can only contain lowercase letters, numbers, and hyphens')
        }

        try {
            const { data, error: insertError } = await supabase
                .from('link_groups')
                .insert({
                    user_id: authStore.user.id,
                    slug,
                    title,
                    description,
                    expires_at: authStore.user.plan === 'free'
                        ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
                        : null
                })
                .select()
                .single()

            if (insertError) {
                if (insertError.code === '23505') {
                    throw new Error(`The slug '${slug}' is already taken`)
                }
                throw insertError
            }

            const newGroup = mapToLinkGroup(data)
            groups.value.unshift(newGroup)
            return newGroup
        } catch (e: any) {
            console.error('Failed to create group:', e)
            throw e
        }
    }

    /**
     * Update a group
     */
    async function updateGroup(
        id: string,
        updates: Partial<Pick<LinkGroup, 'title' | 'description' | 'theme'>>
    ): Promise<void> {
        try {
            const { error: updateError } = await supabase
                .from('link_groups')
                .update(updates)
                .eq('id', id)

            if (updateError) throw updateError

            const idx = groups.value.findIndex(g => g.id === id)
            if (idx !== -1) {
                groups.value[idx] = { ...groups.value[idx], ...updates }
            }
        } catch (e: any) {
            console.error('Failed to update group:', e)
            throw e
        }
    }

    /**
     * Delete a group
     */
    async function deleteGroup(id: string): Promise<void> {
        try {
            const { error: deleteError } = await supabase
                .from('link_groups')
                .delete()
                .eq('id', id)

            if (deleteError) throw deleteError

            groups.value = groups.value.filter(g => g.id !== id)
        } catch (e: any) {
            console.error('Failed to delete group:', e)
            throw e
        }
    }

    /**
     * Add a link to a group
     */
    async function addLinkToGroup(groupId: string, urlId: string): Promise<void> {
        try {
            const { error: updateError } = await supabase
                .from('urls')
                .update({ group_id: groupId })
                .eq('id', urlId)

            if (updateError) throw updateError

            // Refresh group data
            const updated = await fetchGroupById(groupId)
            if (updated) {
                const idx = groups.value.findIndex(g => g.id === groupId)
                if (idx !== -1) groups.value[idx] = updated
            }
        } catch (e: any) {
            console.error('Failed to add link to group:', e)
            throw e
        }
    }

    /**
     * Remove a link from a group
     */
    async function removeLinkFromGroup(urlId: string): Promise<void> {
        try {
            const { error: updateError } = await supabase
                .from('urls')
                .update({ group_id: null })
                .eq('id', urlId)

            if (updateError) throw updateError
        } catch (e: any) {
            console.error('Failed to remove link from group:', e)
            throw e
        }
    }

    return {
        groups,
        loading,
        error,
        totalGroups,
        fetchGroups,
        fetchGroupById,
        fetchGroupBySlug,
        createGroup,
        updateGroup,
        deleteGroup,
        addLinkToGroup,
        removeLinkFromGroup
    }
})
