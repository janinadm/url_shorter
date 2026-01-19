<template>
  <div class="dashboard">
    <!-- Mobile overlay -->
    <div v-if="sidebarOpen" class="sidebar-overlay" @click="sidebarOpen = false"></div>
    
    <aside class="sidebar" :class="{ 'sidebar--open': sidebarOpen }">
      <router-link to="/" class="sidebar__logo">
        <span class="sidebar__logo-icon">🔗</span>
        <span class="sidebar__logo-text">LinkSnip</span>
      </router-link>

      <nav class="sidebar__nav">
        <router-link to="/dashboard" class="sidebar__link" :class="{ 'sidebar__link--active': isActive('dashboard') }" @click="sidebarOpen = false">
          <span class="sidebar__link-icon">📊</span>
          Dashboard
        </router-link>
        <router-link to="/dashboard/settings" class="sidebar__link" :class="{ 'sidebar__link--active': isActive('settings') }" @click="sidebarOpen = false">
          <span class="sidebar__link-icon">⚙️</span>
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
          ☰
        </button>
        <h1 class="header__title">{{ pageTitle }}</h1>
      </header>

      <!-- Dashboard Overview -->
      <div v-if="isActive('dashboard')" class="content">
        <div class="stats">
          <div class="stat-card">
            <div class="stat-card__icon">🔗</div>
            <div class="stat-card__content">
              <p class="stat-card__value">{{ urlStore.totalUrls }}</p>
              <p class="stat-card__label">Total Links</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-card__icon">👆</div>
            <div class="stat-card__content">
              <p class="stat-card__value">{{ urlStore.totalClicks }}</p>
              <p class="stat-card__label">Total Clicks</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-card__icon">📈</div>
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
            <button 
              type="submit" 
              class="btn btn--primary"
              :disabled="!canCreate || creating"
            >
              {{ creating ? 'Creating...' : 'Shorten' }}
            </button>
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
            <div v-for="url in urlStore.urls" :key="url.id" class="url-card">
              <div class="url-card__main">
                <div class="url-card__short">
                  <span class="url-card__short-link">{{ baseUrl }}/r/{{ url.shortCode }}</span>
                  <button @click="copyUrl(url.shortCode)" class="url-card__copy" :title="copied === url.shortCode ? 'Copied!' : 'Copy'">
                    {{ copied === url.shortCode ? '✓' : '📋' }}
                  </button>
                </div>
                <p class="url-card__title">{{ url.title || 'Untitled' }}</p>
                <p class="url-card__original">{{ url.originalUrl }}</p>
              </div>
              <div class="url-card__stats">
                <span class="url-card__clicks">{{ url.clicks || 0 }} clicks</span>
                <div class="url-card__actions">
                  <router-link :to="`/dashboard/analytics/${url.id}`" class="url-card__action">
                    📊
                  </router-link>
                  <button @click="confirmDeleteUrl(url.id)" class="url-card__action url-card__action--delete">
                    🗑️
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
import { ref, computed, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUrlStore } from '@/stores/urls'
import { usePlansStore } from '@/stores/plans'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const baseUrl = import.meta.env.VITE_BASE_URL || window.location.origin

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const urlStore = useUrlStore()
const plansStore = usePlansStore()

const newUrl = reactive({ url: '', title: '' })
const creating = ref(false)
const copied = ref('')
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
  try {
    await urlStore.createUrl(newUrl.url, newUrl.title || undefined)
    newUrl.url = ''
    newUrl.title = ''
  } finally {
    creating.value = false
  }
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

onMounted(() => {
  urlStore.fetchUrls()
})
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
    gap: $spacing-3;

    @media (min-width: $breakpoint-md) {
      flex-direction: row;
      flex-wrap: wrap;
    }
  }

  &__input {
    @include input-base;
    
    @media (min-width: $breakpoint-md) {
      flex: 2;
      min-width: 200px;
    }

    &--title {
      @media (min-width: $breakpoint-md) {
        flex: 1;
        min-width: 150px;
      }
    }
  }

  &__limit {
    margin-top: $spacing-3;
    font-size: $font-size-sm;
    color: $warning;

    a {
      color: $primary;
    }
  }
}

// URL List
.url-list {
  &__title {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: $gray-900;
    margin-bottom: $spacing-4;
  }

  &__loading,
  &__empty {
    text-align: center;
    padding: $spacing-8;
    color: $gray-500;

    @media (min-width: $breakpoint-md) {
      padding: $spacing-12;
    }
  }

  &__items {
    display: flex;
    flex-direction: column;
    gap: $spacing-4;
  }
}

.url-card {
  @include card;
  display: flex;
  flex-direction: column;
  gap: $spacing-3;

  @media (min-width: $breakpoint-md) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-4;
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
  }

  &__short-link {
    font-family: monospace;
    font-size: $font-size-sm;
    color: $primary;
    font-weight: $font-weight-medium;

    @media (min-width: $breakpoint-md) {
      font-size: $font-size-base;
    }
  }

  &__copy {
    background: none;
    border: none;
    cursor: pointer;
    font-size: $font-size-base;
    padding: $spacing-1;
    opacity: 0.7;
    flex-shrink: 0;

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

    &:hover {
      background: $gray-200;
    }

    &--delete:hover {
      background: rgba($error, 0.1);
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
