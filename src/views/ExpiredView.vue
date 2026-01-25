<template>
  <div class="expired-container">
    <div class="expired-card">
      <div class="expired-icon">⏳</div>
      <h1 class="expired-title">Link Expired</h1>
      <p class="expired-message">
        This link has reached its expiration date and is no longer available based on the creator's plan.
      </p>
      
      <div class="expired-action">
        <p class="expired-promo">
          Want permanent links? Upgrade to Brevio Pro!
        </p>
        <router-link to="/" class="btn btn--primary">
          Get Started with Brevio
        </router-link>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/scss/variables' as *;
@use '@/assets/scss/mixins' as *;

.expired-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $gray-50;
  padding: $spacing-4;
}

.expired-card {
  @include card;
  max-width: 480px;
  width: 100%;
  text-align: center;
  padding: $spacing-8;
}

.expired-icon {
  font-size: 4rem;
  margin-bottom: $spacing-6;
}

.expired-title {
  font-size: $font-size-2xl;
  font-weight: $font-weight-bold;
  color: $gray-900;
  margin-bottom: $spacing-4;
}

.expired-message {
  color: $gray-600;
  line-height: 1.6;
  margin-bottom: $spacing-8;
}

.expired-action {
  background: $primary-light;
  padding: $spacing-6;
  border-radius: $radius-lg;
}

.expired-promo {
  color: $gray-900;
  font-weight: $font-weight-medium;
  margin-bottom: $spacing-4;
}
</style>
