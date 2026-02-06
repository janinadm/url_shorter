<template>
  <div class="bio-page" :class="`bio-page--${group?.theme || 'default'}`">
    <div v-if="loading" class="bio-page__loading">
      <div class="spinner"></div>
    </div>

    <div v-else-if="!group" class="bio-page__not-found">
      <h1>Page Not Found</h1>
      <p>This Bio Page doesn't exist or has expired.</p>
      <router-link to="/" class="btn">Go Home</router-link>
    </div>

    <template v-else>
      <header class="bio-header">
        <div class="bio-header__avatar">
          <img v-if="group.avatarUrl" :src="group.avatarUrl" :alt="group.title" class="bio-header__avatar-img" />
          <span v-else>{{ group.title?.[0]?.toUpperCase() || 'B' }}</span>
        </div>
        <h1 class="bio-header__title">{{ group.title }}</h1>
        <p v-if="group.description" class="bio-header__description">{{ group.description }}</p>
      </header>

      <main class="bio-links">
        <a
          v-for="link in group.links"
          :key="link.id"
          :href="link.originalUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="bio-link"
          @click="trackClick(link.id)"
        >
          <span class="bio-link__title">{{ link.title || 'Link' }}</span>
          <ExternalLink :size="16" class="bio-link__icon" />
        </a>

        <div v-if="!group.links || group.links.length === 0" class="bio-links__empty">
          <p>No links yet.</p>
        </div>
      </main>

      <footer class="bio-footer">
        <router-link to="/" class="bio-footer__brand">
          <Logo :light="true" />
        </router-link>
        <p class="bio-footer__tagline">Create your own Bio Page</p>
      </footer>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useGroupStore } from '@/stores/groups'
import Logo from '@/components/Logo.vue'
import type { LinkGroup } from '@/types'
import { ExternalLink } from 'lucide-vue-next'

const route = useRoute()
const groupStore = useGroupStore()

const group = ref<LinkGroup | null>(null)
const loading = ref(true)

async function fetchGroup() {
  loading.value = true
  const slug = route.params.slug as string
  group.value = await groupStore.fetchGroupBySlug(slug)
  loading.value = false
}

function trackClick(urlId: string) {
  // Could implement click tracking here in the future
  console.log('Bio link clicked:', urlId)
}

onMounted(fetchGroup)
</script>

<style lang="scss" scoped>
@use '@/assets/scss/variables' as *;
@use '@/assets/scss/mixins' as *;

.bio-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-8 $spacing-4;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  &--light {
    background: $gray-100;
  }

  &--dark {
    background: $gray-900;
  }
}

.bio-page__loading {
  @include flex-center;
  min-height: 50vh;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba($white, 0.3);
  border-top-color: $white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.bio-page__not-found {
  @include flex-center;
  flex-direction: column;
  min-height: 50vh;
  text-align: center;
  color: $white;

  h1 {
    font-size: $font-size-2xl;
    margin-bottom: $spacing-4;
  }

  p {
    margin-bottom: $spacing-6;
    opacity: 0.8;
  }

  .btn {
    background: $white;
    color: $primary;
    padding: $spacing-3 $spacing-6;
    border-radius: $radius-lg;
    text-decoration: none;
    font-weight: $font-weight-semibold;
    transition: all $transition-fast;

    &:hover {
      transform: translateY(-2px);
      box-shadow: $shadow-lg;
    }
  }
}

.bio-header {
  text-align: center;
  margin-bottom: $spacing-8;
  color: $white;

  &__avatar {
    @include flex-center;
    width: 96px;
    height: 96px;
    margin: 0 auto $spacing-4;
    background: rgba($white, 0.2);
    border-radius: $radius-full;
    font-size: $font-size-3xl;
    font-weight: $font-weight-bold;
    backdrop-filter: blur(10px);
    overflow: hidden;
  }

  &__avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__title {
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
    margin-bottom: $spacing-2;
  }

  &__description {
    font-size: $font-size-base;
    opacity: 0.9;
    max-width: 400px;
  }
}

.bio-links {
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: $spacing-4;
  margin-bottom: $spacing-8;

  &__empty {
    text-align: center;
    color: rgba($white, 0.7);
    padding: $spacing-6;
  }
}

.bio-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-2;
  padding: $spacing-4 $spacing-6;
  background: rgba($white, 0.95);
  border-radius: $radius-lg;
  text-decoration: none;
  color: $gray-900;
  font-weight: $font-weight-medium;
  transition: all $transition-fast;
  box-shadow: $shadow-md;

  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-lg;
  }

  &__title {
    flex: 1;
    text-align: center;
  }

  &__icon {
    opacity: 0.5;
  }
}

.bio-footer {
  margin-top: auto;
  text-align: center;
  color: rgba($white, 0.7);

  &__brand {
    display: inline-block;
    margin-bottom: $spacing-2;
    opacity: 0.8;
    transition: opacity $transition-fast;

    &:hover {
      opacity: 1;
    }
  }

  &__tagline {
    font-size: $font-size-sm;
  }
}

// Theme variations
.bio-page--light {
  .bio-header {
    color: $gray-900;

    &__avatar {
      background: $primary;
      color: $white;
    }
  }

  .bio-link {
    background: $white;
    border: 1px solid $gray-200;
  }

  .bio-footer {
    color: $gray-500;
  }

  .bio-page__not-found {
    color: $gray-900;

    .btn {
      background: $primary;
      color: $white;
    }
  }
}

.bio-page--dark {
  .bio-header__avatar {
    background: rgba($white, 0.1);
  }

  .bio-link {
    background: rgba($white, 0.1);
    color: $white;
    border: 1px solid rgba($white, 0.2);

    &:hover {
      background: rgba($white, 0.15);
    }
  }
}
</style>
