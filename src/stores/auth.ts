import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { User } from '@/types'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
    const user = ref<User | null>(null)
    const loading = ref(false)
    const initialized = ref(false)

    const isAuthenticated = computed(() => !!user.value)

    async function initialize() {
        if (initialized.value) return

        loading.value = true
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user) {
                await fetchProfile(session.user.id)
            }
        } finally {
            loading.value = false
            initialized.value = true
        }

        // Listen for auth changes
        supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
            if (event === 'SIGNED_IN' && session?.user) {
                await fetchProfile(session.user.id)
            } else if (event === 'SIGNED_OUT') {
                user.value = null
            }
        })
    }

    async function fetchProfile(userId: string) {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

        if (data) {
            user.value = {
                id: data.id,
                email: data.email || '',
                name: data.name,
                plan: data.plan || 'free',
                stripeCustomerId: data.stripe_customer_id,
                createdAt: data.created_at
            }
        }
    }

    async function signUp(email: string, password: string, name?: string) {
        loading.value = true
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { name } }
            })
            if (error) throw error
            return data
        } finally {
            loading.value = false
        }
    }

    async function signIn(email: string, password: string) {
        loading.value = true
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            })
            if (error) throw error
            return data
        } finally {
            loading.value = false
        }
    }

    async function signOut() {
        await supabase.auth.signOut()
        user.value = null
    }

    async function resetPassword(email: string) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/recovery`
        })
        if (error) throw error
    }

    async function updateProfile(updates: Partial<Pick<User, 'name'>>) {
        if (!user.value) return

        const { error } = await supabase
            .from('profiles')
            .update({ name: updates.name })
            .eq('id', user.value.id)

        if (error) throw error
        if (updates.name) user.value.name = updates.name
    }

    async function deleteAccount() {
        if (!user.value) throw new Error('No user logged in')

        // Call server-side API to fully delete user (including from auth.users)
        const response = await fetch('/api/account/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId: user.value.id })
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.details || 'Failed to delete account')
        }

        // Clear local state and sign out
        user.value = null
    }

    return {
        user,
        loading,
        initialized,
        isAuthenticated,
        initialize,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updateProfile,
        deleteAccount,
        fetchProfile
    }
})
