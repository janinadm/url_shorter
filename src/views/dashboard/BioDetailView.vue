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
      </div>
    </aside>

    <main class="main">
      <header class="header">
        <button class="header__menu-btn" @click="sidebarOpen = !sidebarOpen">
          <Menu :size="24" />
        </button>
        <BackButton to="/dashboard/bio" label="Bio Pages" />
        <h1 class="header__title">{{ group?.title || 'Bio Page' }}</h1>
      </header>

      <div class="content">
        <div v-if="loading" class="loading">Loading...</div>
        
        <template v-else-if="group">
          <!-- Group Info -->
          <div class="group-info">
            <div class="group-info__header">
              <div class="group-info__avatar-section">
                <div class="group-info__avatar" @click="editMode && triggerAvatarUpload()">
                  <img v-if="editForm.avatarUrl || group.avatarUrl" :src="editForm.avatarUrl || group.avatarUrl" alt="Avatar" class="group-info__avatar-img" />
                  <span v-else class="group-info__avatar-initial">{{ group.title?.[0]?.toUpperCase() || 'B' }}</span>
                  <div v-if="editMode" class="group-info__avatar-overlay">
                    <Camera :size="20" />
                  </div>
                </div>
                <input 
                  ref="avatarInput"
                  type="file" 
                  accept="image/*" 
                  class="hidden-input"
                  @change="handleAvatarUpload"
                />
              </div>
              <div class="group-info__details">
                <template v-if="editMode">
                  <input v-model="editForm.title" type="text" class="edit-input edit-input--title" placeholder="Page title" />
                  <p class="group-info__slug">
                    <a :href="`${baseUrl}/g/${group.slug}`" target="_blank">{{ baseUrl }}/g/{{ group.slug }}</a>
                  </p>
                  <textarea v-model="editForm.description" class="edit-input edit-input--textarea" placeholder="Short bio (optional)" rows="2"></textarea>
                </template>
                <template v-else>
                  <h2 class="group-info__title">{{ group.title }}</h2>
                  <p class="group-info__slug">
                    <a :href="`${baseUrl}/g/${group.slug}`" target="_blank">{{ baseUrl }}/g/{{ group.slug }}</a>
                  </p>
                  <p v-if="group.description" class="group-info__description">{{ group.description }}</p>
                </template>
              </div>
              <div class="group-info__actions">
                <template v-if="editMode">
                  <button @click="saveEdit" class="btn btn--primary btn--small" :disabled="saving">
                    {{ saving ? 'Saving...' : 'Save' }}
                  </button>
                  <button @click="cancelEdit" class="btn btn--secondary btn--small">Cancel</button>
                </template>
                <template v-else>
                  <button @click="startEdit" class="btn btn--secondary btn--small">
                    <Pencil :size="16" />
                    Edit
                  </button>
                  <button @click="copyBioUrl" class="btn btn--secondary btn--small">
                    <Copy :size="16" />
                    {{ copied ? 'Copied!' : 'Copy Link' }}
                  </button>
                </template>
              </div>
            </div>
          </div>

          <!-- Add Links Section -->
          <div class="add-links">
            <h3 class="add-links__title">Add links to this page</h3>
            <p class="add-links__description">Select from your existing links to add them to this Bio Page.</p>
            
            <div v-if="availableLinks.length === 0" class="add-links__empty">
              <p>No available links. <router-link to="/dashboard">Create some links first</router-link>.</p>
            </div>
            
            <div v-else class="add-links__list">
              <div 
                v-for="link in availableLinks" 
                :key="link.id" 
                class="link-item"
              >
                <div class="link-item__info">
                  <p class="link-item__title">{{ link.title || 'Untitled' }}</p>
                  <p class="link-item__url">{{ link.originalUrl }}</p>
                </div>
                <button 
                  @click="handleAddLink(link.id)" 
                  class="btn btn--small btn--primary"
                  :disabled="addingLink === link.id"
                >
                  {{ addingLink === link.id ? 'Adding...' : 'Add' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Current Links in Group -->
          <div class="group-links">
            <h3 class="group-links__title">Links in this Bio Page</h3>
            
            <div v-if="!group.links || group.links.length === 0" class="group-links__empty">
              <p>No links added yet.</p>
            </div>
            
            <div v-else class="group-links__list">
              <div 
                v-for="link in group.links" 
                :key="link.id" 
                class="link-item link-item--in-group"
              >
                <div class="link-item__info">
                  <p class="link-item__title">{{ link.title || 'Untitled' }}</p>
                  <p class="link-item__url">{{ link.originalUrl }}</p>
                </div>
                <button 
                  @click="handleRemoveLink(link.id)" 
                  class="btn btn--small btn--danger"
                  :disabled="removingLink === link.id"
                >
                  {{ removingLink === link.id ? 'Removing...' : 'Remove' }}
                </button>
              </div>
            </div>
          </div>
        </template>
        
        <div v-else class="not-found">
          <p>Bio Page not found.</p>
          <router-link to="/dashboard/bio">Go back</router-link>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useGroupStore } from '@/stores/groups'
import { useUrlStore } from '@/stores/urls'
import Logo from '@/components/Logo.vue'
import type { LinkGroup } from '@/types'
import { 
  LayoutDashboard, 
  Settings, 
  Menu, 
  Users,
  Copy,
  Camera,
  Pencil
} from 'lucide-vue-next'
import BackButton from '@/components/common/BackButton.vue'

const baseUrl = import.meta.env.VITE_BASE_URL || window.location.origin

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const groupStore = useGroupStore()
const urlStore = useUrlStore()

const group = ref<LinkGroup | null>(null)
const loading = ref(true)
const copied = ref(false)
const sidebarOpen = ref(false)
const addingLink = ref<string | null>(null)
const removingLink = ref<string | null>(null)

// Edit mode state
const editMode = ref(false)
const saving = ref(false)
const avatarInput = ref<HTMLInputElement | null>(null)
const editForm = reactive({
  title: '',
  description: '',
  avatarUrl: ''
})

const userInitial = computed(() => 
  (authStore.user?.name?.[0] || authStore.user?.email?.[0] || 'U').toUpperCase()
)

// Links not in any group
const availableLinks = computed(() => {
  return urlStore.urls.filter(u => !u.groupId)
})

async function fetchGroup() {
  loading.value = true
  const id = route.params.id as string
  group.value = await groupStore.fetchGroupById(id)
  loading.value = false
}

function copyBioUrl() {
  if (!group.value) return
  navigator.clipboard.writeText(`${baseUrl}/g/${group.value.slug}`)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

async function handleAddLink(urlId: string) {
  if (!group.value) return
  addingLink.value = urlId
  try {
    await groupStore.addLinkToGroup(group.value.id, urlId)
    // Refresh group data
    await fetchGroup()
    // Update local URL state
    await urlStore.fetchUrls()
  } finally {
    addingLink.value = null
  }
}

async function handleRemoveLink(urlId: string) {
  removingLink.value = urlId
  try {
    await groupStore.removeLinkFromGroup(urlId)
    // Refresh group data
    await fetchGroup()
    // Update local URL state
    await urlStore.fetchUrls()
  } finally {
    removingLink.value = null
  }
}

// Edit mode functions
function startEdit() {
  if (!group.value) return
  editForm.title = group.value.title
  editForm.description = group.value.description || ''
  editForm.avatarUrl = group.value.avatarUrl || ''
  editMode.value = true
}

function cancelEdit() {
  editMode.value = false
  editForm.title = ''
  editForm.description = ''
  editForm.avatarUrl = ''
}

async function saveEdit() {
  if (!group.value) return
  saving.value = true
  try {
    await groupStore.updateGroup(group.value.id, {
      title: editForm.title,
      description: editForm.description || undefined,
      avatarUrl: editForm.avatarUrl || undefined
    })
    await fetchGroup()
    editMode.value = false
  } finally {
    saving.value = false
  }
}

function triggerAvatarUpload() {
  avatarInput.value?.click()
}

async function handleAvatarUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return
  
  const file = input.files[0]
  if (!file) return
  
  // For now, convert to base64 data URL (simple approach without storage)
  // In production, you'd upload to Supabase Storage
  const reader = new FileReader()
  reader.onload = (e) => {
    editForm.avatarUrl = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

onMounted(async () => {
  await urlStore.fetchUrls()
  await fetchGroup()
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
  overflow-x: hidden;

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

  &__back {
    @include flex-center;
    width: 36px;
    height: 36px;
    background: transparent;
    border: 1px solid $gray-300;
    border-radius: $radius-md;
    cursor: pointer;
    transition: all $transition-fast;

    &:hover {
      border-color: $primary;
      color: $primary;
    }
  }

  &__title {
    font-size: $font-size-xl;
    font-weight: $font-weight-bold;
    color: $gray-900;
  }
}

.content {
  padding: $spacing-6;
  overflow-x: hidden;
  max-width: 100%;
  box-sizing: border-box;
}

.loading,
.not-found {
  @include card;
  text-align: center;
  color: $gray-500;
  padding: $spacing-8;
}

.group-info {
  @include card;
  margin-bottom: $spacing-6;

  &__header {
    display: flex;
    align-items: flex-start;
    gap: $spacing-4;
    flex-wrap: wrap;
  }

  &__avatar-section {
    flex-shrink: 0;
  }

  &__avatar {
    @include flex-center;
    width: 64px;
    height: 64px;
    background: $gradient-primary;
    border-radius: $radius-full;
    font-size: $font-size-xl;
    font-weight: $font-weight-bold;
    color: $white;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }

  &__avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__avatar-initial {
    font-size: $font-size-xl;
  }

  &__avatar-overlay {
    position: absolute;
    inset: 0;
    @include flex-center;
    background: rgba(0, 0, 0, 0.5);
    color: $white;
    opacity: 0;
    transition: opacity $transition-fast;
  }

  &__avatar:hover &__avatar-overlay {
    opacity: 1;
  }

  &__details {
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: $font-size-xl;
    font-weight: $font-weight-bold;
    color: $gray-900;
    margin-bottom: $spacing-2;
  }

  &__slug {
    font-size: $font-size-sm;
    margin-bottom: $spacing-2;

    a {
      color: $primary;
      text-decoration: none;
      &:hover {
        text-decoration: underline;
      }
    }
  }

  &__description {
    font-size: $font-size-sm;
    color: $gray-600;
  }

  &__actions {
    display: flex;
    gap: $spacing-2;
    flex-shrink: 0;
  }
}

.hidden-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  overflow: hidden;
}

.edit-input {
  width: 100%;
  padding: $spacing-2 $spacing-3;
  border: 1px solid $gray-300;
  border-radius: $radius-md;
  font-size: $font-size-base;
  transition: all $transition-fast;

  &:focus {
    outline: none;
    border-color: $primary;
    box-shadow: 0 0 0 3px rgba($primary, 0.1);
  }

  &--title {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    margin-bottom: $spacing-2;
  }

  &--textarea {
    resize: vertical;
    min-height: 60px;
  }
}

.add-links,
.group-links {
  @include card;
  margin-bottom: $spacing-6;

  &__title {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: $gray-900;
    margin-bottom: $spacing-2;
  }

  &__description {
    font-size: $font-size-sm;
    color: $gray-500;
    margin-bottom: $spacing-4;
  }

  &__empty {
    text-align: center;
    color: $gray-500;
    padding: $spacing-4;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: $spacing-3;
  }
}

.link-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $spacing-3;
  padding: $spacing-3;
  border: 1px solid $gray-200;
  border-radius: $radius-md;
  background: $white;

  &--in-group {
    background: linear-gradient(135deg, rgba($primary, 0.05) 0%, rgba($secondary, 0.05) 100%);
  }

  &__info {
    min-width: 0;
    flex: 1;
    overflow: hidden;
  }

  &__title {
    font-weight: $font-weight-medium;
    color: $gray-900;
    margin-bottom: $spacing-1;
    @include truncate;
  }

  &__url {
    font-size: $font-size-sm;
    color: $gray-500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
    display: block;
  }
}

.btn {
  &--small {
    padding: $spacing-2 $spacing-3;
    font-size: $font-size-sm;
  }

  &--secondary {
    display: flex;
    align-items: center;
    gap: $spacing-2;
    background: $white;
    border: 1px solid $gray-300;
    color: $gray-700;
    padding: $spacing-2 $spacing-4;
    border-radius: $radius-md;
    cursor: pointer;
    transition: all $transition-fast;

    &:hover {
      border-color: $primary;
      color: $primary;
    }
  }

  &--danger {
    background: $error;
    color: $white;
    border: none;
    padding: $spacing-2 $spacing-3;
    border-radius: $radius-md;
    cursor: pointer;
    transition: all $transition-fast;

    &:hover {
      background: darken($error, 10%);
    }
  }
}
</style>
