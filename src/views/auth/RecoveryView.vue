<template>
  <AuthLayout>
    <h1 class="auth-form__title">Reset password</h1>
    <p class="auth-form__subtitle">We'll send you a reset link</p>

    <form @submit.prevent="handleSubmit" class="auth-form">
      <div class="auth-form__field">
        <label for="email" class="auth-form__label">Email</label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          class="auth-form__input"
          placeholder="you@example.com"
          required
        />
      </div>

      <div v-if="error" class="auth-form__error">
        {{ error }}
      </div>

      <div v-if="success" class="auth-form__success">
        Check your email for the reset link!
      </div>

      <button 
        type="submit" 
        class="btn btn--primary btn--block"
        :disabled="loading || success"
      >
        {{ loading ? 'Sending...' : 'Send reset link' }}
      </button>
    </form>

    <template #footer>
      Remember your password? <router-link to="/login">Sign in</router-link>
    </template>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AuthLayout from '@/components/common/AuthLayout.vue'

const authStore = useAuthStore()

const form = reactive({
  email: ''
})

const loading = ref(false)
const error = ref('')
const success = ref(false)

async function handleSubmit() {
  error.value = ''
  loading.value = true

  try {
    await authStore.resetPassword(form.email)
    success.value = true
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to send reset email'
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
@use '@/assets/scss/variables' as *;
@use '@/assets/scss/mixins' as *;

.auth-form {
  &__title {
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
    color: $gray-900;
    text-align: center;
  }

  &__subtitle {
    color: $gray-500;
    text-align: center;
    margin-bottom: $spacing-6;
  }

  &__field {
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
  }

  &__error {
    padding: $spacing-3;
    background: rgba($error, 0.1);
    border: 1px solid $error;
    border-radius: $radius-md;
    color: $error;
    font-size: $font-size-sm;
    margin-bottom: $spacing-4;
  }

  &__success {
    padding: $spacing-3;
    background: rgba($success, 0.1);
    border: 1px solid $success;
    border-radius: $radius-md;
    color: $success;
    font-size: $font-size-sm;
    margin-bottom: $spacing-4;
    text-align: center;
  }
}

.btn {
  @include button-base;
  margin-top: $spacing-2;

  &--primary {
    background: $gradient-primary;
    color: $white;

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: $shadow-lg;
    }
  }

  &--block {
    width: 100%;
  }
}
</style>
