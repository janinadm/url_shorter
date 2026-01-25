<template>
  <div class="auth">
    <div class="auth__container">
      <div class="auth__card">
        <router-link to="/" class="auth__logo">
          <span class="auth__logo-icon">🔗</span>
          <span class="auth__logo-text">Brevio</span>
        </router-link>
        <slot />
      </div>
      <p class="auth__footer">
        <slot name="footer" />
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
// Auth layout wrapper
</script>

<style lang="scss" scoped>
@use '@/assets/scss/variables' as *;
@use '@/assets/scss/mixins' as *;

.auth {
  min-height: 100vh;
  @include flex-center;
  background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #fdf4ff 100%);
  padding: $spacing-4;

  &__container {
    width: 100%;
    max-width: 420px;
  }

  &__card {
    @include card;
    padding: $spacing-8;
  }

  &__logo {
    display: flex;
    align-items: center;
    justify-content: center;
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

  &__footer {
    margin-top: $spacing-6;
    text-align: center;
    color: $gray-600;
    font-size: $font-size-sm;

    a {
      color: $primary;
      font-weight: $font-weight-medium;
    }
  }
}
</style>
