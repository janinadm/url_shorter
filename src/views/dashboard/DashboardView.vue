<template>
  <div class="dashboard">
    <aside class="sidebar">
      <router-link to="/" class="sidebar__logo">
        <span class="sidebar__logo-icon">🔗</span>
        <span class="sidebar__logo-text">LinkSnip</span>
      </router-link>

      <nav class="sidebar__nav">
        <router-link to="/dashboard" class="sidebar__link" :class="{ 'sidebar__link--active': isActive('dashboard') }">
          <span class="sidebar__link-icon">📊</span>
          Dashboard
        </router-link>
        <router-link to="/dashboard/settings" class="sidebar__link" :class="{ 'sidebar__link--active': isActive('settings') }">
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
                  <span class="url-card__short-link">linksnip.io/{{ url.shortCode }}</span>
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
                  <button @click="deleteUrl(url.id)" class="url-card__action url-card__action--delete">
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUrlStore } from '@/stores/urls'
import { usePlansStore } from '@/stores/plans'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const urlStore = useUrlStore()
const plansStore = usePlansStore()

const newUrl = reactive({ url: '', title: '' })
const creating = ref(false)
const copied = ref('')

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
  router.push('/login')
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
  navigator.clipboard.writeText(`https://linksnip.io/${shortCode}`)
  copied.value = shortCode
  setTimeout(() => { copied.value = '' }, 2000)
}

async function deleteUrl(id: string) {
  if (confirm('Are you sure you want to delete this link?')) {
    await urlStore.deleteUrl(id)
  }
}

onMounted(() => {
  urlStore.fetchUrls()
})
</script>

<style lang="scss" scoped>
@use '@/assets/scss/variables' as *;
@use '@/assets/scss/mixins' as *;

.dashboard {
  display: grid;
  grid-template-columns: 260px 1fr;
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
  width: 260px;

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
    background: $gradient-primary;
    color: $white;
    font-weight: $font-weight-bold;
    border-radius: $radius-full;
  }

  &__user-name {
    font-weight: $font-weight-medium;
    color: $gray-900;
    font-size: $font-size-sm;
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
  margin-left: 260px;
  background: $gray-50;
  min-height: 100vh;
}

.header {
  background: $white;
  border-bottom: 1px solid $gray-200;
  padding: $spacing-6 $spacing-8;

  &__title {
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
    color: $gray-900;
  }
}

.content {
  padding: $spacing-8;
}

// Stats
.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-6;
  margin-bottom: $spacing-8;
}

.stat-card {
  @include card;
  display: flex;
  align-items: center;
  gap: $spacing-4;

  &__icon {
    font-size: 2rem;
    padding: $spacing-3;
    background: linear-gradient(135deg, rgba($primary, 0.1) 0%, rgba($secondary, 0.1) 100%);
    border-radius: $radius-lg;
  }

  &__value {
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
    color: $gray-900;
  }

  &__label {
    font-size: $font-size-sm;
    color: $gray-500;
  }
}

// Create URL
.create-url {
  @include card;
  margin-bottom: $spacing-8;

  &__title {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: $gray-900;
    margin-bottom: $spacing-4;
  }

  &__form {
    display: flex;
    gap: $spacing-3;
    flex-wrap: wrap;
  }

  &__input {
    @include input-base;
    flex: 2;
    min-width: 200px;

    &--title {
      flex: 1;
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
    padding: $spacing-12;
    color: $gray-500;
  }

  &__items {
    display: flex;
    flex-direction: column;
    gap: $spacing-4;
  }
}

.url-card {
  @include card;
  @include flex-between;
  gap: $spacing-4;

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
    font-size: $font-size-base;
    color: $primary;
    font-weight: $font-weight-medium;
  }

  &__copy {
    background: none;
    border: none;
    cursor: pointer;
    font-size: $font-size-base;
    padding: $spacing-1;
    opacity: 0.7;

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
    flex-direction: column;
    align-items: flex-end;
    gap: $spacing-2;
  }

  &__clicks {
    font-size: $font-size-sm;
    color: $gray-600;
    font-weight: $font-weight-medium;
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
