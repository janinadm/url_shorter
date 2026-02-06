<template>
  <div class="dashboard">
    <!-- Mobile overlay -->
    <div v-if="sidebarOpen" class="sidebar-overlay" @click="sidebarOpen = false"></div>
    
    <aside class="sidebar" :class="{ 'sidebar--open': sidebarOpen }">
      <router-link to="/dashboard" class="sidebar__logo">
        <Logo />
      </router-link>

      <nav class="sidebar__nav">
        <router-link to="/dashboard" class="sidebar__link" @click="sidebarOpen = false">
          <span class="sidebar__link-icon"><LayoutDashboard :size="20" /></span>
          Dashboard
        </router-link>
        <router-link to="/dashboard/bio" class="sidebar__link sidebar__link--active" @click="sidebarOpen = false">
          <span class="sidebar__link-icon"><Users :size="20" /></span>
          Bio Pages
        </router-link>
        <router-link to="/dashboard/settings" class="sidebar__link" @click="sidebarOpen = false">
          <span class="sidebar__link-icon"><Settings :size="20" /></span>
          Settings
        </router-link>
      </nav>

      <div class="sidebar__footer">
        <div class="sidebar__user">
          <div class="sidebar__user-avatar">{{ userInitial }}</div>
          <div class="sidebar__user-info">
            <p class="sidebar__user-name">{{ authStore.user?.name || 'User' }}</p>
            <p class="sidebar__user-plan">{{ authStore.user?.plan || 'Free' }} Plan</p>
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
        <h1 class="header__title">Bio Pages</h1>
      </header>

      <div class="content">
        <!-- Create Bio Page Form -->
        <div class="create-bio">
          <h2 class="create-bio__title">Create new Bio Page</h2>
          <p v-if="!canCreateGroup" class="create-bio__limit">
            Free users can only create 1 Bio Page. 
            <router-link to="/dashboard/settings">Upgrade to Pro</router-link>
          </p>
          <form @submit.prevent="handleCreateGroup" class="create-bio__form" :class="{ 'create-bio__form--disabled': !canCreateGroup }">
            <input
              v-model="newGroup.title"
              type="text"
              placeholder="Page title (e.g., My Portfolio)"
              class="create-bio__input"
              :disabled="!canCreateGroup"
              required
            />
            <div class="create-bio__row">
              <div class="create-bio__prefix">{{ baseUrl }}/g/</div>
              <input
                v-model="newGroup.slug"
                type="text"
                placeholder="my-page"
                class="create-bio__input create-bio__input--slug"
                :class="{ 'create-bio__input--error': slugError, 'create-bio__input--success': slugAvailable }"
                minlength="3"
                maxlength="20"
                pattern="[a-z0-9-]+"
                title="Lowercase letters, numbers, and hyphens only"
                :disabled="!canCreateGroup"
                @input="checkSlugAvailability"
                required
              />
            </div>
            <p v-if="slugError" class="create-bio__slug-error">{{ slugError }}</p>
            <p v-if="slugAvailable && newGroup.slug.length >= 3" class="create-bio__slug-success">✓ Slug available</p>
            <textarea
              v-model="newGroup.description"
              placeholder="Short bio (optional)"
              class="create-bio__input create-bio__input--textarea"
              rows="2"
              :disabled="!canCreateGroup"
            ></textarea>
            <div class="create-bio__avatar-upload" v-if="canCreateGroup">
              <div class="create-bio__avatar-preview" v-if="newGroup.avatarUrl">
                <img :src="newGroup.avatarUrl" alt="Avatar preview" />
                <button type="button" class="create-bio__avatar-remove" @click="removeAvatar">×</button>
              </div>
              <label class="create-bio__avatar-btn">
                <Upload :size="16" />
                {{ newGroup.avatarUrl ? 'Change Photo' : 'Add Profile Photo' }}
                <input 
                  ref="createAvatarInput"
                  type="file" 
                  accept="image/*" 
                  class="hidden-input"
                  @change="handleAvatarSelect"
                />
              </label>
            </div>
            <button 
              type="submit" 
              class="btn btn--gradient"
              :disabled="!canCreateGroup || creating || !!slugError || checkingSlug"
            >
              {{ creating ? 'Creating...' : 'Create Bio Page' }}
            </button>
            <p v-if="error" class="create-bio__error">{{ error }}</p>
          </form>
        </div>

        <!-- Bio Pages List -->
        <div class="bio-list">
          <h2 class="bio-list__title">Your Bio Pages</h2>
          <div v-if="groupStore.loading" class="bio-list__loading">
            Loading...
          </div>
          <div v-else-if="groupStore.groups.length === 0" class="bio-list__empty">
            <p>No Bio Pages yet. Create your first one above!</p>
          </div>
          <div v-else class="bio-list__items">
            <div 
              v-for="group in groupStore.groups" 
              :key="group.id" 
              class="bio-card"
              @click="router.push(`/dashboard/bio/${group.id}`)"
            >
              <div class="bio-card__avatar">
                <img v-if="group.avatarUrl" :src="group.avatarUrl" :alt="group.title" />
                <span v-else>{{ group.title?.[0]?.toUpperCase() || 'B' }}</span>
              </div>
              <div class="bio-card__main">
                <h3 class="bio-card__title">{{ group.title }}</h3>
                <p class="bio-card__slug">{{ baseUrl }}/g/{{ group.slug }}</p>
                <p v-if="group.description" class="bio-card__description">{{ group.description }}</p>
              </div>
              <div class="bio-card__stats">
                <span class="bio-card__links">{{ group.links?.length || 0 }} links</span>
                <div class="bio-card__actions">
                  <button 
                    @click.stop="copyBioUrl(group.slug)" 
                    class="bio-card__action"
                    :title="copied === group.slug ? 'Copied!' : 'Copy link'"
                  >
                    <Check v-if="copied === group.slug" :size="18" />
                    <Copy v-else :size="18" />
                  </button>
                  <button 
                    @click.stop="confirmDeleteGroup(group.id)" 
                    class="bio-card__action bio-card__action--delete"
                    title="Delete"
                  >
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
      title="Delete Bio Page"
      message="Are you sure you want to delete this Bio Page? Links in this page will be unlinked but not deleted."
      confirm-text="Delete"
      cancel-text="Cancel"
      variant="danger"
      :loading="deleteDialog.loading"
      @confirm="handleDeleteConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useGroupStore } from '@/stores/groups'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import Logo from '@/components/Logo.vue'
import { 
  LayoutDashboard, 
  Settings, 
  Menu, 
  Users,
  Copy, 
  Check,
  Trash2,
  Upload
} from 'lucide-vue-next'

const baseUrl = import.meta.env.VITE_BASE_URL || window.location.origin

const router = useRouter()
const authStore = useAuthStore()
const groupStore = useGroupStore()

const newGroup = reactive({ title: '', slug: '', description: '', avatarUrl: '' })
const creating = ref(false)
const copied = ref('')
const error = ref('')
const sidebarOpen = ref(false)

// Slug availability check
const slugError = ref('')
const slugAvailable = ref(false)
const checkingSlug = ref(false)
let slugCheckTimeout: number | null = null
const deleteDialog = reactive({
  open: false,
  loading: false,
  groupId: ''
})

const userInitial = computed(() => 
  (authStore.user?.name?.[0] || authStore.user?.email?.[0] || 'U').toUpperCase()
)

const canCreateGroup = computed(() => {
  if (authStore.user?.plan === 'pro') return true
  return groupStore.totalGroups < 1
})

async function handleLogout() {
  await authStore.signOut()
  router.push('/')
}

async function handleCreateGroup() {
  if (!canCreateGroup.value) return
  creating.value = true
  error.value = ''
  
  try {
    const group = await groupStore.createGroup(
      newGroup.slug.toLowerCase(),
      newGroup.title,
      newGroup.description || undefined,
      newGroup.avatarUrl || undefined
    )
    if (group) {
      newGroup.title = ''
      newGroup.slug = ''
      newGroup.description = ''
      newGroup.avatarUrl = ''
      router.push(`/dashboard/bio/${group.id}`)
    }
  } catch (e: any) {
    error.value = e.message || 'Failed to create Bio Page'
  } finally {
    creating.value = false
  }
}

function copyBioUrl(slug: string) {
  navigator.clipboard.writeText(`${baseUrl}/g/${slug}`)
  copied.value = slug
  setTimeout(() => { copied.value = '' }, 2000)
}

function removeAvatar() {
  newGroup.avatarUrl = ''
}

async function checkSlugAvailability() {
  // Clear previous timeout
  if (slugCheckTimeout) {
    clearTimeout(slugCheckTimeout)
  }
  
  slugError.value = ''
  slugAvailable.value = false
  
  const slug = newGroup.slug.trim().toLowerCase()
  
  // Basic validation
  if (slug.length < 3) {
    return
  }
  
  if (!/^[a-z0-9-]+$/.test(slug)) {
    slugError.value = 'Only lowercase letters, numbers, and hyphens allowed'
    return
  }
  
  // Debounce the API call
  checkingSlug.value = true
  slugCheckTimeout = window.setTimeout(async () => {
    try {
      const result = await groupStore.checkSlugExists(slug)
      
      if (result.exists) {
        if (result.expiresAt) {
          const expirationDate = new Date(result.expiresAt)
          const now = new Date()
          const daysLeft = Math.max(0, Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
          
          if (daysLeft > 0) {
            const dayText = `${daysLeft} day${daysLeft !== 1 ? 's' : ''}`
            slugError.value = `Slug "${slug}" is taken. Will be available in ~${dayText}`
          } else {
            slugError.value = `Slug "${slug}" is taken but will be available soon`
          }
        } else {
          slugError.value = `Slug "${slug}" is in use by a Pro user (permanent)`
        }
        slugAvailable.value = false
      } else {
        slugAvailable.value = true
      }
    } catch (e) {
      console.error('Error checking slug:', e)
    } finally {
      checkingSlug.value = false
    }
  }, 400)
}

function handleAvatarSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return
  
  const file = input.files[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    newGroup.avatarUrl = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

function confirmDeleteGroup(id: string) {
  deleteDialog.groupId = id
  deleteDialog.open = true
}

async function handleDeleteConfirm() {
  deleteDialog.loading = true
  try {
    await groupStore.deleteGroup(deleteDialog.groupId)
    deleteDialog.open = false
  } finally {
    deleteDialog.loading = false
    deleteDialog.groupId = ''
  }
}

onMounted(() => {
  if (authStore.user) {
    groupStore.fetchGroups()
  }
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

  &__logo {
    display: flex;
    align-items: center;
    margin-bottom: $spacing-8;
    text-decoration: none;
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
    display: flex;
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
  }

  &__user-plan {
    font-size: $font-size-xs;
    color: $gray-500;
    text-transform: capitalize;
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

.main {
  flex: 1;
  margin-left: $sidebar-width;
  background: $gray-50;
  min-height: 100vh;

  @media (max-width: $breakpoint-md) {
    margin-left: 0;
  }
}

.header {
  background: $white;
  border-bottom: 1px solid $gray-200;
  padding: $spacing-4 $spacing-6;
  display: flex;
  align-items: center;
  gap: $spacing-4;

  &__menu-btn {
    display: flex;
    @media (min-width: $breakpoint-md) {
      display: none;
    }
    background: transparent;
    border: 1px solid $gray-300;
    border-radius: $radius-md;
    padding: $spacing-2;
    cursor: pointer;
  }

  &__title {
    font-size: $font-size-xl;
    font-weight: $font-weight-bold;
    color: $gray-900;
  }
}

.content {
  padding: $spacing-6;
}

.create-bio {
  @include card;
  margin-bottom: $spacing-6;

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

    &--slug {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
      flex: 1;
    }

    &--textarea {
      resize: vertical;
      min-height: 60px;
    }
  }

  &__error {
    color: $error;
    font-size: $font-size-sm;
  }

  &__limit {
    margin-bottom: $spacing-4;
    padding: $spacing-3;
    background: $warning-light;
    color: $warning-dark;
    border-radius: $radius-md;
    text-align: center;
    font-size: $font-size-sm;

    a {
      color: $warning-dark;
      font-weight: $font-weight-bold;
    }
  }

  &__slug-error {
    color: $error;
    font-size: $font-size-sm;
    margin-top: $spacing-1;
    margin-bottom: $spacing-2;
  }

  &__slug-success {
    color: $success;
    font-size: $font-size-sm;
    margin-top: $spacing-1;
    margin-bottom: $spacing-2;
  }

  &__form--disabled {
    opacity: 0.6;
    pointer-events: none;
  }

  &__input--error {
    border-color: $error !important;
    
    &:focus {
      box-shadow: 0 0 0 3px rgba($error, 0.1);
    }
  }

  &__input--success {
    border-color: $success !important;
    
    &:focus {
      box-shadow: 0 0 0 3px rgba($success, 0.1);
    }
  }

  &__avatar-upload {
    display: flex;
    align-items: center;
    gap: $spacing-4;
  }

  &__avatar-preview {
    position: relative;
    width: 64px;
    height: 64px;
    border-radius: $radius-full;
    overflow: hidden;
    flex-shrink: 0;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__avatar-remove {
    position: absolute;
    top: -4px;
    right: -4px;
    width: 20px;
    height: 20px;
    background: $error;
    color: $white;
    border: none;
    border-radius: $radius-full;
    font-size: 14px;
    line-height: 1;
    cursor: pointer;
    @include flex-center;

    &:hover {
      background: darken($error, 10%);
    }
  }

  &__avatar-btn {
    display: inline-flex;
    align-items: center;
    gap: $spacing-2;
    padding: $spacing-2 $spacing-4;
    background: $gray-100;
    border: 1px dashed $gray-400;
    border-radius: $radius-md;
    color: $gray-600;
    font-size: $font-size-sm;
    cursor: pointer;
    transition: all $transition-fast;

    &:hover {
      border-color: $primary;
      color: $primary;
      background: rgba($primary, 0.05);
    }
  }
}

.hidden-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  overflow: hidden;
}

.btn--gradient {
  width: 100%;
  padding: $spacing-3 $spacing-6;
  background: $gradient-primary;
  border: none;
  border-radius: $radius-lg;
  color: $white;
  font-size: $font-size-base;
  font-weight: $font-weight-semibold;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: $shadow-md;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.bio-list {
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

.bio-card {
  border: 1px solid $gray-200;
  border-radius: $radius-lg;
  padding: $spacing-4;
  display: flex;
  flex-direction: column;
  gap: $spacing-4;
  cursor: pointer;
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

  &__avatar {
    @include flex-center;
    width: 48px;
    height: 48px;
    flex-shrink: 0;
    background: $gradient-primary;
    border-radius: $radius-full;
    color: $white;
    font-weight: $font-weight-bold;
    font-size: $font-size-lg;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__main {
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: $gray-900;
    margin-bottom: $spacing-1;
  }

  &__slug {
    font-size: $font-size-sm;
    color: $primary;
    margin-bottom: $spacing-2;
  }

  &__description {
    font-size: $font-size-sm;
    color: $gray-600;
  }

  &__stats {
    display: flex;
    align-items: center;
    gap: $spacing-4;
  }

  &__links {
    font-size: $font-size-sm;
    color: $gray-500;
    white-space: nowrap;
  }

  &__actions {
    display: flex;
    gap: $spacing-2;
  }

  &__action {
    @include flex-center;
    width: 36px;
    height: 36px;
    border: 1px solid $gray-300;
    border-radius: $radius-md;
    background: $white;
    color: $gray-600;
    cursor: pointer;
    transition: all $transition-fast;

    &:hover {
      border-color: $primary;
      color: $primary;
    }

    &--delete:hover {
      border-color: $error;
      color: $error;
    }
  }
}
</style>
