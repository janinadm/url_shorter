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
        <router-link to="/dashboard" class="sidebar__link" @click="sidebarOpen = false">
          <span class="sidebar__link-icon">📊</span>
          Dashboard
        </router-link>
        <router-link to="/dashboard/settings" class="sidebar__link sidebar__link--active" @click="sidebarOpen = false">
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
        <h1 class="header__title">Account Settings</h1>
      </header>

      <div class="content">
        <!-- Profile Section -->
        <section class="settings-section">
          <h2 class="settings-section__title">Profile</h2>
          <form @submit.prevent="updateProfile" class="settings-form">
            <div class="settings-form__group">
              <label class="settings-form__label">Name</label>
              <input
                v-model="profile.name"
                type="text"
                class="settings-form__input"
                placeholder="Your name"
              />
            </div>
            <div class="settings-form__group">
              <label class="settings-form__label">Email</label>
              <input
                :value="authStore.user?.email"
                type="email"
                class="settings-form__input"
                disabled
              />
              <p class="settings-form__hint">Email cannot be changed</p>
            </div>
            <div v-if="profileMessage" class="settings-form__message" :class="{ 'settings-form__message--success': profileSuccess }">
              {{ profileMessage }}
            </div>
            <button type="submit" class="btn btn--primary" :disabled="saving">
              {{ saving ? 'Saving...' : 'Save changes' }}
            </button>
          </form>
        </section>

        <!-- Plan Section -->
        <section class="settings-section">
          <h2 class="settings-section__title">Your Plan</h2>
          <div class="plan-info">
            <div class="plan-info__current">
              <div class="plan-info__badge">
                {{ plansStore.currentPlan.name }}
              </div>
              <p class="plan-info__price">
                <span v-if="plansStore.currentPlan.price === 0">Free</span>
                <span v-else-if="plansStore.currentPlan.price === -1">Custom pricing</span>
                <span v-else>${{ plansStore.currentPlan.price }}/month</span>
              </p>
            </div>
            <div class="plan-info__limits">
              <p>
                <strong>{{ urlStore.totalUrls }}</strong> / 
                {{ plansStore.urlLimit === Infinity ? '∞' : plansStore.urlLimit }} links used
              </p>
              <div class="plan-info__bar">
                <div 
                  class="plan-info__bar-fill" 
                  :style="{ width: usagePercent + '%' }"
                ></div>
              </div>
            </div>
          </div>

          <div class="plan-options">
            <div 
              v-for="plan in plansStore.plans" 
              :key="plan.id"
              class="plan-card"
              :class="{ 'plan-card--current': plan.id === plansStore.currentPlan.id }"
            >
              <div class="plan-card__header">
                <h3 class="plan-card__name">{{ plan.name }}</h3>
                <p class="plan-card__price">
                  <span v-if="plan.price === 0">$0</span>
                  <span v-else-if="plan.price === -1">Custom</span>
                  <span v-else>${{ plan.price }}</span>
                  <span v-if="plan.price > 0" class="plan-card__period">/mo</span>
                </p>
              </div>
              <ul class="plan-card__features">
                <li v-for="feature in plan.features" :key="feature">{{ feature }}</li>
              </ul>
              <button
                v-if="plan.id !== plansStore.currentPlan.id"
                @click="selectPlan(plan.id)"
                class="btn"
                :class="plan.id === 'pro' ? 'btn--primary' : 'btn--outline'"
              >
                {{ plan.id === 'enterprise' ? 'Contact Sales' : 'Upgrade' }}
              </button>
              <div v-else class="plan-card__active">
                ✓ Current Plan
              </div>
            </div>
          </div>
        </section>

        <!-- Danger Zone -->
        <section class="settings-section settings-section--danger">
          <h2 class="settings-section__title">Danger Zone</h2>
          <div class="danger-zone">
            <div class="danger-zone__info">
              <h3>Delete Account</h3>
              <p>Once deleted, your account and all data cannot be recovered.</p>
            </div>
            <button class="btn btn--danger" disabled>
              Delete Account
            </button>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUrlStore } from '@/stores/urls'
import { usePlansStore } from '@/stores/plans'

const router = useRouter()
const authStore = useAuthStore()
const urlStore = useUrlStore()
const plansStore = usePlansStore()

const profile = reactive({
  name: ''
})

const saving = ref(false)
const sidebarOpen = ref(false)
const profileMessage = ref('')
const profileSuccess = ref(false)

const userInitial = computed(() =>
  (authStore.user?.name?.[0] || authStore.user?.email?.[0] || 'U').toUpperCase()
)

const usagePercent = computed(() => {
  if (plansStore.urlLimit === Infinity) return 0
  return Math.min(100, (urlStore.totalUrls / plansStore.urlLimit) * 100)
})

async function handleLogout() {
  await authStore.signOut()
  router.push('/')
}

async function updateProfile() {
  saving.value = true
  profileMessage.value = ''
  try {
    await authStore.updateProfile({ name: profile.name })
    profileMessage.value = 'Profile updated successfully!'
    profileSuccess.value = true
  } catch (e) {
    profileMessage.value = e instanceof Error ? e.message : 'Failed to update profile'
    profileSuccess.value = false
  } finally {
    saving.value = false
  }
}

function selectPlan(planId: string) {
  if (planId === 'enterprise') {
    window.location.href = 'mailto:sales@linksnip.io'
  } else if (planId === 'pro') {
    // In production, redirect to Stripe Checkout
    alert('Stripe integration would redirect to payment here. For demo, plan change is simulated.')
  }
}

onMounted(() => {
  profile.name = authStore.user?.name || ''
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

.settings-section {
  @include card;
  margin-bottom: $spacing-6;

  &__title {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: $gray-900;
    margin-bottom: $spacing-4;
    padding-bottom: $spacing-3;
    border-bottom: 1px solid $gray-200;

    @media (min-width: $breakpoint-md) {
      margin-bottom: $spacing-6;
      padding-bottom: $spacing-4;
    }
  }

  &--danger {
    border: 1px solid rgba($error, 0.3);
  }
}

.settings-form {
  max-width: 100%;

  @media (min-width: $breakpoint-md) {
    max-width: 400px;
  }

  &__group {
    margin-bottom: $spacing-4;
  }

  &__label {
    display: block;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $gray-700;
    margin-bottom: $spacing-1;
  }

  &__input {
    @include input-base;

    &:disabled {
      background: $gray-100;
      color: $gray-500;
    }
  }

  &__hint {
    font-size: $font-size-xs;
    color: $gray-500;
    margin-top: $spacing-1;
  }

  &__message {
    padding: $spacing-3;
    border-radius: $radius-md;
    font-size: $font-size-sm;
    margin-bottom: $spacing-4;
    background: rgba($error, 0.1);
    color: $error;

    &--success {
      background: rgba($success, 0.1);
      color: $success;
    }
  }
}

.plan-info {
  display: flex;
  flex-direction: column;
  gap: $spacing-4;
  margin-bottom: $spacing-6;

  @media (min-width: $breakpoint-md) {
    flex-direction: row;
    gap: $spacing-8;
    margin-bottom: $spacing-8;
  }

  &__current {
    display: flex;
    align-items: center;
    gap: $spacing-3;

    @media (min-width: $breakpoint-md) {
      gap: $spacing-4;
    }
  }

  &__badge {
    background: $gradient-primary;
    color: $white;
    padding: $spacing-2 $spacing-3;
    border-radius: $radius-full;
    font-weight: $font-weight-semibold;
    font-size: $font-size-sm;

    @media (min-width: $breakpoint-md) {
      padding: $spacing-2 $spacing-4;
      font-size: $font-size-base;
    }
  }

  &__price {
    font-size: $font-size-base;
    color: $gray-700;

    @media (min-width: $breakpoint-md) {
      font-size: $font-size-lg;
    }
  }

  &__limits {
    flex: 1;
  }

  &__bar {
    height: 8px;
    background: $gray-200;
    border-radius: $radius-full;
    margin-top: $spacing-2;
    overflow: hidden;
  }

  &__bar-fill {
    height: 100%;
    background: $gradient-primary;
    border-radius: $radius-full;
    transition: width $transition-base;
  }
}

.plan-options {
  display: grid;
  grid-template-columns: 1fr;
  gap: $spacing-4;

  @media (min-width: $breakpoint-sm) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: $breakpoint-lg) {
    grid-template-columns: repeat(3, 1fr);
  }
}

.plan-card {
  padding: $spacing-4;
  border: 2px solid $gray-200;
  border-radius: $radius-xl;
  transition: all $transition-fast;

  @media (min-width: $breakpoint-md) {
    padding: $spacing-6;
  }

  &--current {
    border-color: $primary;
    background: linear-gradient(135deg, rgba($primary, 0.02) 0%, rgba($secondary, 0.02) 100%);
  }

  &__header {
    margin-bottom: $spacing-3;

    @media (min-width: $breakpoint-md) {
      margin-bottom: $spacing-4;
    }
  }

  &__name {
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    color: $gray-900;

    @media (min-width: $breakpoint-md) {
      font-size: $font-size-lg;
    }
  }

  &__price {
    font-size: $font-size-xl;
    font-weight: $font-weight-bold;
    color: $gray-900;

    @media (min-width: $breakpoint-md) {
      font-size: $font-size-2xl;
    }
  }

  &__period {
    font-size: $font-size-sm;
    font-weight: $font-weight-normal;
    color: $gray-500;
  }

  &__features {
    list-style: none;
    margin-bottom: $spacing-4;

    @media (min-width: $breakpoint-md) {
      margin-bottom: $spacing-6;
    }

    li {
      padding: $spacing-1 0;
      font-size: $font-size-xs;
      color: $gray-600;

      @media (min-width: $breakpoint-md) {
        font-size: $font-size-sm;
      }

      &::before {
        content: '✓ ';
        color: $success;
      }
    }
  }

  &__active {
    text-align: center;
    color: $primary;
    font-weight: $font-weight-medium;
    padding: $spacing-3;
    font-size: $font-size-sm;
  }
}

.danger-zone {
  display: flex;
  flex-direction: column;
  gap: $spacing-4;

  @media (min-width: $breakpoint-md) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  &__info {
    h3 {
      font-weight: $font-weight-semibold;
      color: $gray-900;
      margin-bottom: $spacing-1;
    }

    p {
      font-size: $font-size-sm;
      color: $gray-600;
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
  }

  &--outline {
    background: transparent;
    border: 2px solid $gray-300;
    color: $gray-700;

    &:hover {
      border-color: $primary;
      color: $primary;
    }
  }

  &--danger {
    background: $error;
    color: $white;

    &:disabled {
      opacity: 0.5;
    }
  }
}
</style>
