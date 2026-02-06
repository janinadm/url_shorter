import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        name: 'landing',
        component: () => import('@/views/LandingView.vue')
    },
    {
        path: '/login',
        name: 'login',
        component: () => import('@/views/auth/LoginView.vue'),
        meta: { guest: true }
    },
    {
        path: '/signup',
        name: 'signup',
        component: () => import('@/views/auth/SignupView.vue'),
        meta: { guest: true }
    },
    {
        path: '/recovery',
        name: 'recovery',
        component: () => import('@/views/auth/RecoveryView.vue'),
        meta: { guest: true }
    },
    {
        path: '/auth/callback',
        name: 'auth-callback',
        component: () => import('@/views/auth/AuthCallbackView.vue')
    },
    {
        path: '/dashboard',
        name: 'dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/dashboard/analytics/:id',
        name: 'analytics',
        component: () => import('@/views/dashboard/AnalyticsView.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/dashboard/settings',
        name: 'settings',
        component: () => import('@/views/dashboard/SettingsView.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/dashboard/bio',
        name: 'bio-pages',
        component: () => import('@/views/dashboard/BioPagesView.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/dashboard/bio/:id',
        name: 'bio-detail',
        component: () => import('@/views/dashboard/BioDetailView.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/g/:slug',
        name: 'public-bio',
        component: () => import('@/views/PublicBioView.vue')
    },
    {
        path: '/expired',
        name: 'expired',
        component: () => import('@/views/ExpiredView.vue')
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// Navigation guards
router.beforeEach(async (to, _from, next) => {
    const authStore = useAuthStore()

    // Initialize auth state if not done
    if (!authStore.initialized) {
        await authStore.initialize()
    }

    const requiresAuth = to.meta.requiresAuth
    const isGuest = to.meta.guest

    if (requiresAuth && !authStore.user) {
        next({ name: 'login' })
    } else if (isGuest && authStore.user) {
        next({ name: 'dashboard' })
    } else {
        next()
    }
})

export default router
