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
        class="auth-btn auth-btn--primary auth-btn--block"
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
@use '@/assets/scss/auth';
</style>
