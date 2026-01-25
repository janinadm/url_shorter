<template>
  <div class="logo" :class="{ 'logo--light': light }">
    <div class="logo__icon">
      <!-- Stylized Link Icon representing 'L' -->
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    </div>
    <span class="logo__text">
      Brevio<span class="logo__suffix">Link</span>
    </span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  light?: boolean
}>()
</script>

<style lang="scss" scoped>
.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Inter', system-ui, sans-serif;
  user-select: none;

  &__icon {
    color: #6366f1; // Primary color
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    svg {
      width: 100%;
      height: 100%;
    }
  }

  &__text {
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827; // Gray-900
    letter-spacing: -0.02em;
    display: flex;
    align-items: baseline;
  }

  &__suffix {
    background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  &--light {
    .logo__text {
      color: #ffffff;
    }
    
    .logo__icon {
      color: #818cf8; // Lighter primary
    }
    
    .logo__suffix {
      background: linear-gradient(135deg, #818cf8 0%, #c084fc 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }
}
</style>
