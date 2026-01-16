import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useAuthStore } from './auth'
import type { Plan } from '@/types'

export const PLANS: Plan[] = [
    {
        id: 'free',
        name: 'Free',
        price: 0,
        urlLimit: 10,
        features: ['Up to 10 short links', 'Basic analytics', '7-day history']
    },
    {
        id: 'pro',
        name: 'Pro',
        price: 9,
        urlLimit: 500,
        features: ['Up to 500 short links', 'Advanced analytics', 'Unlimited history', 'Priority support']
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: -1, // Custom
        urlLimit: Infinity,
        features: ['Unlimited links', 'Team access', 'API access', 'Custom domains']
    }
]

export const usePlansStore = defineStore('plans', () => {
    const authStore = useAuthStore()

    const currentPlan = computed(() => {
        const planId = authStore.user?.plan || 'free'
        return PLANS.find(p => p.id === planId) || PLANS[0]
    })

    const urlLimit = computed(() => currentPlan.value.urlLimit)

    function canCreateUrl(currentCount: number): boolean {
        return currentCount < urlLimit.value
    }

    function getUpgradePlan(): Plan | null {
        const current = currentPlan.value
        if (current.id === 'free') return PLANS[1] // Pro
        if (current.id === 'pro') return PLANS[2] // Enterprise
        return null
    }

    return {
        plans: PLANS,
        currentPlan,
        urlLimit,
        canCreateUrl,
        getUpgradePlan
    }
})
