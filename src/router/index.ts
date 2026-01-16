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
