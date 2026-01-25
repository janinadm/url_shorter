<template>
  <div class="dashboard">
    <!-- Mobile overlay -->
    <div v-if="sidebarOpen" class="sidebar-overlay" @click="sidebarOpen = false"></div>
    
    <aside class="sidebar" :class="{ 'sidebar--open': sidebarOpen }">
      <router-link to="/dashboard" class="sidebar__logo">
        <Logo />
      </router-link>

      <nav class="sidebar__nav">
        <router-link to="/dashboard" class="sidebar__link" :class="{ 'sidebar__link--active': isActive('dashboard') }" @click="sidebarOpen = false">
          <span class="sidebar__link-icon"><LayoutDashboard :size="20" /></span>
          Dashboard
        </router-link>
        <router-link to="/dashboard/settings" class="sidebar__link" :class="{ 'sidebar__link--active': isActive('settings') }" @click="sidebarOpen = false">
          <span class="sidebar__link-icon"><Settings :size="20" /></span>
          Settings
        </router-link>
      </nav>

      <div class="sidebar__footer">
        <div class="sidebar__user">
          <div class="sidebar__user-avatar">{{ userInitial }}</div>
          <div class="sidebar__user-info">
            <p class="sidebar__user-name">{{ authStore.user?.name || 'User' }}</p>
            <p class="sidebar__user-plan">{{ plansStore.currentPlan.name }} Plan</p>
          </div>
        </div>
        <button @click="handleLogout" class="sidebar__logout">
          Sign out
        </button>
      </div>
    </aside>

    <main class="main">
      <header class="header">
        <button class="header__menu-btn" @click="sidebarOpen = !sidebarOpen">
          <Menu :size="24" />
        </button>
        <h1 class="header__title">{{ pageTitle }}</h1>
      </header>

      <!-- Dashboard Overview -->
      <div v-if="isActive('dashboard')" class="content">
        <div class="stats">
          <div class="stat-card">
            <div class="stat-card__icon"><Link :size="24" /></div>
            <div class="stat-card__content">
              <p class="stat-card__value">{{ urlStore.totalUrls }}</p>
              <p class="stat-card__label">Total Links</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-card__icon"><MousePointerClick :size="24" /></div>
            <div class="stat-card__content">
              <p class="stat-card__value">{{ urlStore.totalClicks }}</p>
              <p class="stat-card__label">Total Clicks</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-card__icon"><TrendingUp :size="24" /></div>
            <div class="stat-card__content">
              <p class="stat-card__value">{{ remainingLinks }}</p>
              <p class="stat-card__label">Links Remaining</p>
            </div>
          </div>
        </div>

        <!-- Create URL Form -->
        <div class="create-url">
          <h2 class="create-url__title">Create new link</h2>
          <form @submit.prevent="handleCreateUrl" class="create-url__form">
            <input
              v-model="newUrl.url"
              type="url"
              placeholder="Paste your long URL here..."
              class="create-url__input"
              required
            />
            <input
              v-model="newUrl.title"
              type="text"
              placeholder="Title (optional)"
              class="create-url__input create-url__input--title"
            />
            <div class="create-url__row">
              <div class="create-url__prefix">{{ baseUrl }}/r/</div>
              <input
                v-model="newUrl.customAlias"
                type="text"
                placeholder="Custom alias (optional)"
                class="create-url__input create-url__input--alias"
                pattern="[a-zA-Z0-9-]+"
                minlength="3"
                maxlength="20"
                title="3-20 characters, alphanumeric and hyphens only"
              />
            </div>
            <button 
              type="submit" 
              class="btn btn--primary"
              :disabled="!canCreate || creating"
            >
              {{ creating ? 'Creating...' : 'Shorten' }}
            </button>
            <p v-if="error" class="create-url__error">{{ error }}</p>
          </form>
          <p v-if="!canCreate" class="create-url__limit">
            You've reached your plan limit. 
            <router-link to="/dashboard/settings">Upgrade to create more links</router-link>
          </p>
        </div>

        <!-- URL List -->
        <div class="url-list">
          <h2 class="url-list__title">Your links</h2>
          <div v-if="urlStore.loading" class="url-list__loading">
            Loading...
          </div>
          <div v-else-if="urlStore.urls.length === 0" class="url-list__empty">
            <p>No links yet. Create your first one above!</p>
          </div>
          <div v-else class="url-list__items">
            <div v-for="url in urlStore.urls" :key="url.id" class="url-card" :class="{ 'url-card--expired': isExpired(url.expiresAt) }">
              <div class="url-card__main">
                <div class="url-card__short">
                  <span class="url-card__short-link">{{ baseUrl }}/r/{{ url.shortCode }}</span>
                  <button @click="copyUrl(url.shortCode)" class="url-card__copy" :title="copied === url.shortCode ? 'Copied!' : 'Copy'">
                    <Check v-if="copied === url.shortCode" :size="16" />
                    <Copy v-else :size="16" />
                  </button>
                  <span v-if="url.expiresAt" class="url-card__badge" :class="getExpirationClass(url.expiresAt)">
                    {{ getExpirationLabel(url.expiresAt) }}
                    <span v-if="isExpired(url.expiresAt)" class="url-card__expired-info" data-tooltip="Upgrade to Pro to reactivate this link before someone else claims it!">
                      <AlertTriangle :size="16" />
                    </span>
                  </span>
                </div>
                <p class="url-card__title">{{ url.title || 'Untitled' }}</p>
                <p class="url-card__original">{{ url.originalUrl }}</p>
              </div>
              <div class="url-card__stats">
                <span class="url-card__clicks">{{ url.clicks || 0 }} clicks</span>
                <div class="url-card__actions">
                  <button 
                    v-if="!isExpired(url.expiresAt)"
                    @click="router.push(`/dashboard/analytics/${url.id}`)" 
                    class="url-card__action"
                    title="View Analytics"
                  >
                    <BarChart2 :size="18" />
                  </button>
                  <button 
                    v-else
                    class="url-card__action url-card__action--disabled"
                    title="Analytics disabled for expired links. Upgrade to Pro."
                    disabled
                  >
                    <BarChart2 :size="18" />
                  </button>
                  
                  <button @click="confirmDeleteUrl(url.id)" class="url-card__action url-card__action--delete" title="Delete Link">
                    <Trash2 :size="18" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      v-model="deleteDialog.open"
      title="Delete Link"
      message="Are you sure you want to delete this link? This action cannot be undone."
      confirm-text="Delete"
      cancel-text="Cancel"
      variant="danger"
      :loading="deleteDialog.loading"
      @confirm="handleDeleteConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUrlStore } from '@/stores/urls'
import { usePlansStore } from '@/stores/plans'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import Logo from '@/components/Logo.vue'
import { 
  LayoutDashboard, 
  Settings, 
  Menu, 
  Link, 
  MousePointerClick, 
  TrendingUp, 
  BarChart2, 
  Trash2, 
  AlertTriangle, 
  Copy, 
  Check 
} from 'lucide-vue-next'

const baseUrl = import.meta.env.VITE_BASE_URL || window.location.origin

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const urlStore = useUrlStore()
const plansStore = usePlansStore()

const newUrl = reactive({ url: '', title: '', customAlias: '' })
const creating = ref(false)
const copied = ref('')
const error = ref('')
const sidebarOpen = ref(false)

// Delete dialog state
const deleteDialog = reactive({
  open: false,
  loading: false,
  urlId: ''
})

const userInitial = computed(() => 
  (authStore.user?.name?.[0] || authStore.user?.email?.[0] || 'U').toUpperCase()
)

const pageTitle = computed(() => {
  if (route.name === 'settings') return 'Settings'
  return 'Dashboard'
})

const remainingLinks = computed(() => {
  const limit = plansStore.urlLimit
  if (limit === Infinity) return '∞'
  return Math.max(0, limit - urlStore.totalUrls)
})

const canCreate = computed(() => 
  plansStore.canCreateUrl(urlStore.totalUrls)
)

function isActive(page: string): boolean {
  if (page === 'dashboard') return route.name === 'dashboard'
  if (page === 'settings') return route.name === 'settings'
  return false
}

async function handleLogout() {
  await authStore.signOut()
  router.push('/')
}

async function handleCreateUrl() {
  if (!canCreate.value) return
  creating.value = true
  error.value = ''
  
  try {
    await urlStore.createUrl(newUrl.url, newUrl.title || undefined, newUrl.customAlias || undefined)
    newUrl.url = ''
    newUrl.title = ''
    newUrl.customAlias = ''
  } catch (e: any) {
    console.error('Failed to create URL:', e)
    error.value = e.message || 'Failed to create link. Please try again.'
  } finally {
    creating.value = false
  }
}

function isExpired(expiresAt?: string): boolean {
  if (!expiresAt) return false
  return new Date(expiresAt) < new Date()
}

function getExpirationClass(expiresAt: string): string {
  if (isExpired(expiresAt)) return 'url-card__badge--expired'
  
  const daysLeft = Math.ceil((new Date(expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  if (daysLeft <= 1) return 'url-card__badge--warning'
  return 'url-card__badge--info'
}

function getExpirationLabel(expiresAt: string): string {
  if (isExpired(expiresAt)) return 'Expired'
  
  const daysLeft = Math.ceil((new Date(expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  if (daysLeft <= 1) return 'Expires soon'
  return `Expires in ${daysLeft}d`
}

function copyUrl(shortCode: string) {
  navigator.clipboard.writeText(`${baseUrl}/r/${shortCode}`)
  copied.value = shortCode
  setTimeout(() => { copied.value = '' }, 2000)
}

function confirmDeleteUrl(id: string) {
  deleteDialog.urlId = id
  deleteDialog.open = true
}

async function handleDeleteConfirm() {
  deleteDialog.loading = true
  try {
    await urlStore.deleteUrl(deleteDialog.urlId)
    deleteDialog.open = false
  } finally {
    deleteDialog.loading = false
    deleteDialog.urlId = ''
  }
}

// Fetch URLs when auth is ready (handles both initial load and navigation)
watch(
  () => authStore.user,
  (user) => {
    if (user) {
      urlStore.fetchUrls()
    }
  },
  { immediate: true }
)
</script>

<style lang="scss" scoped>
@use '@/assets/scss/variables' as *;
@use '@/assets/scss/mixins' as *;

$sidebar-width: 260px;

.dashboard {
  display: flex;
  min-height: 100vh;
}

// Sidebar
.sidebar {
  background: $white;
  border-right: 1px solid $gray-200;
  padding: $spacing-6;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: $sidebar-width;
  z-index: 100;

  @media (max-width: $breakpoint-md) {
    transform: translateX(-100%);
    transition: transform $transition-base;
  }

  &--open {
    transform: translateX(0);
  }
}

.sidebar-overlay {
  display: none;
  
  @media (max-width: $breakpoint-md) {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 99;
  }
}

.sidebar {
  &__logo {
    display: flex;
    align-items: center;
    gap: $spacing-2;
    font-size: $font-size-xl;
    font-weight: $font-weight-bold;
    color: $gray-900;
    text-decoration: none;
    margin-bottom: $spacing-8;
  }

  &__logo-icon {
    font-size: $font-size-2xl;
  }

  &__nav {
    flex: 1;
  }

  &__link {
    display: flex;
    align-items: center;
    gap: $spacing-3;
    padding: $spacing-3 $spacing-4;
    border-radius: $radius-lg;
    color: $gray-600;
    text-decoration: none;
    font-weight: $font-weight-medium;
    transition: all $transition-fast;
    margin-bottom: $spacing-1;

    &:hover {
      background: $gray-100;
      color: $gray-900;
    }

    &--active {
      background: linear-gradient(135deg, rgba($primary, 0.1) 0%, rgba($secondary, 0.1) 100%);
      color: $primary;
    }
  }

  &__link-icon {
    font-size: $font-size-lg;
  }

  &__footer {
    border-top: 1px solid $gray-200;
    padding-top: $spacing-4;
  }

  &__user {
    display: flex;
    align-items: center;
    gap: $spacing-3;
    margin-bottom: $spacing-4;
  }

  &__user-avatar {
    @include flex-center;
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    background: $gradient-primary;
    color: $white;
    font-weight: $font-weight-bold;
    border-radius: $radius-full;
  }

  &__user-info {
    min-width: 0;
  }

  &__user-name {
    font-weight: $font-weight-medium;
    color: $gray-900;
    font-size: $font-size-sm;
    @include truncate;
  }

  &__user-plan {
    font-size: $font-size-xs;
    color: $gray-500;
  }

  &__logout {
    width: 100%;
    padding: $spacing-2 $spacing-4;
    background: transparent;
    border: 1px solid $gray-300;
    border-radius: $radius-md;
    color: $gray-600;
    font-size: $font-size-sm;
    cursor: pointer;
    transition: all $transition-fast;

    &:hover {
      border-color: $error;
      color: $error;
    }
  }
}

// Main Content
.main {
  flex: 1;
  margin-left: $sidebar-width;
  background: $gray-50;
  min-height: 100vh;
  width: calc(100% - #{$sidebar-width});

  @media (max-width: $breakpoint-md) {
    margin-left: 0;
    width: 100%;
  }
}

.header {
  background: $white;
  border-bottom: 1px solid $gray-200;
  padding: $spacing-4 $spacing-6;
  display: flex;
  align-items: center;
  gap: $spacing-4;

  @media (min-width: $breakpoint-md) {
    padding: $spacing-6 $spacing-8;
  }

  &__menu-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: transparent;
    border: 1px solid $gray-300;
    border-radius: $radius-md;
    font-size: $font-size-xl;
    cursor: pointer;
    transition: all $transition-fast;

    &:hover {
      background: $gray-100;
    }

    @media (min-width: $breakpoint-md) {
      display: none;
    }
  }

  &__title {
    font-size: $font-size-xl;
    font-weight: $font-weight-bold;
    color: $gray-900;

    @media (min-width: $breakpoint-md) {
      font-size: $font-size-2xl;
    }
  }
}

.content {
  padding: $spacing-4;

  @media (min-width: $breakpoint-md) {
    padding: $spacing-6;
  }

  @media (min-width: $breakpoint-lg) {
    padding: $spacing-8;
  }
}

// Stats
.stats {
  display: grid;
  grid-template-columns: 1fr;
  gap: $spacing-4;
  margin-bottom: $spacing-6;

  @media (min-width: $breakpoint-sm) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: $breakpoint-lg) {
    grid-template-columns: repeat(3, 1fr);
    gap: $spacing-6;
    margin-bottom: $spacing-8;
  }
}

.stat-card {
  @include card;
  display: flex;
  align-items: center;
  gap: $spacing-4;

  &__icon {
    font-size: 1.5rem;
    padding: $spacing-3;
    background: linear-gradient(135deg, rgba($primary, 0.1) 0%, rgba($secondary, 0.1) 100%);
    border-radius: $radius-lg;
    flex-shrink: 0;

    @media (min-width: $breakpoint-md) {
      font-size: 2rem;
    }
  }

  &__content {
    min-width: 0;
  }

  &__value {
    font-size: $font-size-xl;
    font-weight: $font-weight-bold;
    color: $gray-900;

    @media (min-width: $breakpoint-md) {
      font-size: $font-size-2xl;
    }
  }

  &__label {
    font-size: $font-size-sm;
    color: $gray-500;
    white-space: nowrap;
  }
}

// Create URL
.create-url {
  @include card;
  margin-bottom: $spacing-6;

  @media (min-width: $breakpoint-lg) {
    margin-bottom: $spacing-8;
  }

  &__title {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: $gray-900;
    margin-bottom: $spacing-4;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: $spacing-4;
  }

  &__row {
    display: flex;
    align-items: center;
    gap: $spacing-2;
  }

  &__prefix {
    color: $gray-500;
    font-size: $font-size-sm;
    white-space: nowrap;
    background: $gray-100;
    padding: $spacing-3;
    border: 1px solid $gray-300;
    border-right: none;
    border-radius: $radius-lg 0 0 $radius-lg;
    margin-right: -1px; // Merge borders
  }

  &__input {
    width: 100%;
    padding: $spacing-3 $spacing-4;
    border: 1px solid $gray-300;
    border-radius: $radius-lg;
    font-size: $font-size-base;
    transition: all $transition-fast;

    &:focus {
      outline: none;
      border-color: $primary;
      box-shadow: 0 0 0 3px rgba($primary, 0.1);
    }

    &--title {
      font-size: $font-size-sm;
    }

    &--alias {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
      flex: 1;
    }
  }

  &__error {
    color: $error;
    font-size: $font-size-sm;
    margin-top: -$spacing-2;
  }

  &__limit {
    margin-top: $spacing-4;
    padding: $spacing-3;
    background: $warning-light;
    color: $warning-dark;
    border-radius: $radius-md;
    text-align: center;
    font-size: $font-size-sm;

    a {
      color: $warning-dark;
      font-weight: $font-weight-bold;
      text-decoration: underline;
    }
  }
}

// URL List
.url-list {
  @include card;

  &__title {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: $gray-900;
    margin-bottom: $spacing-6;
  }

  &__loading,
  &__empty {
    text-align: center;
    color: $gray-500;
    padding: $spacing-8;
  }

  &__items {
    display: flex;
    flex-direction: column;
    gap: $spacing-4;
  }
}

.url-card {
  border: 1px solid $gray-200;
  border-radius: $radius-lg;
  padding: $spacing-4;
  display: flex;
  flex-direction: column;
  gap: $spacing-4;
  transition: all $transition-fast;

  @media (min-width: $breakpoint-md) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  &:hover {
    border-color: $primary-light;
    box-shadow: $shadow-sm;
  }

  &--expired {
    background: $gray-50;
    color: $gray-600;
    
    &:hover {
      border-color: $gray-300;
      box-shadow: none;
    }
  }

  &__expired-info {
    cursor: help;
    font-size: 1.2em; // Larger icon
    margin-left: 6px;
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    
    // Custom Tooltip
    &:hover::after {
      content: attr(data-tooltip);
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      width: 220px;
      padding: $spacing-3;
      background: $gray-900;
      color: $white;
      font-size: $font-size-sm;
      font-weight: $font-weight-normal;
      text-align: center;
      border-radius: $radius-md;
      z-index: 10;
      margin-bottom: 8px;
      box-shadow: $shadow-lg;
      pointer-events: none;
      white-space: normal;
      line-height: 1.4;
    }

    // Tooltip Arrow
    &:hover::before {
      content: '';
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%) translateY(4px); // Adjust gap
      border: 6px solid transparent;
      border-top-color: $gray-900;
      margin-bottom: -4px;
      z-index: 10;
    }
  }

  &__main {
    flex: 1;
    min-width: 0;
  }

  &__short {
    display: flex;
    align-items: center;
    gap: $spacing-2;
    margin-bottom: $spacing-1;
    flex-wrap: wrap;
  }

  &__short-link {
    color: $primary;
    font-weight: $font-weight-medium;
    font-size: $font-size-lg;
  }

  &__copy {
    background: transparent;
    border: none;
    color: $gray-400;
    cursor: pointer;
    padding: $spacing-1;
    &:hover {
      opacity: 1;
    }
  }

  &__title {
    font-weight: $font-weight-medium;
    color: $gray-800;
    margin-bottom: $spacing-1;
    @include truncate;
  }

  &__original {
    font-size: $font-size-sm;
    color: $gray-500;
    @include truncate;
  }

  &__stats {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-4;
    padding-top: $spacing-3;
    border-top: 1px solid $gray-100;

    @media (min-width: $breakpoint-md) {
      flex-direction: column;
      align-items: flex-end;
      gap: $spacing-2;
      padding-top: 0;
      border-top: none;
    }
  }

  &__clicks {
    font-size: $font-size-sm;
    color: $gray-600;
    font-weight: $font-weight-medium;
    white-space: nowrap;
  }

  &__actions {
    display: flex;
    gap: $spacing-2;
  }

  &__action {
    background: $gray-100;
    border: none;
    padding: $spacing-2;
    border-radius: $radius-md;
    cursor: pointer;
    text-decoration: none;
    transition: all $transition-fast;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: $font-size-lg;

    &:hover:not(:disabled) {
      background: $gray-200;
    }

    &--delete:hover {
      background: rgba($error, 0.1);
    }
    
    &--disabled {
      opacity: 0.5;
      cursor: not-allowed;
      filter: grayscale(100%);
      
      &:hover {
        background: $gray-100;
      }
    }
  }
}

.btn {
  @include button-base;
  width: 100%;

  @media (min-width: $breakpoint-md) {
    width: auto;
  }

  &--primary {
    background: $gradient-primary;
    color: $white;

    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: $shadow-md;
    }

    &:disabled {
      opacity: 0.5;
    }
  }
}
</style>
