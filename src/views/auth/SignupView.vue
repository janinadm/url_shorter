<template>
  <AuthLayout>
    <h1 class="auth-form__title">Create your account</h1>
    <p class="auth-form__subtitle">Start shortening links in seconds</p>

    <form @submit.prevent="handleSubmit" class="auth-form">
      <div class="auth-form__field">
        <label for="name" class="auth-form__label">Name</label>
        <input
          id="name"
          v-model="form.name"
          type="text"
          class="auth-form__input"
          placeholder="Your name"
        />
      </div>

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

      <div class="auth-form__field">
        <label for="password" class="auth-form__label">Password</label>
        <div class="auth-form__password-wrapper">
          <input
            id="password"
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            class="auth-form__input"
            placeholder="Min. 8 characters"
            required
            minlength="8"
          />
          <button 
            type="button" 
            class="auth-form__toggle-password"
            @click="showPassword = !showPassword"
            :title="showPassword ? 'Hide password' : 'Show password'"
          >
            <EyeOff v-if="showPassword" :size="18" />
            <Eye v-else :size="18" />
          </button>
        </div>
      </div>

      <div v-if="error" class="auth-form__error">
        {{ error }}
      </div>

      <div v-if="success" class="auth-form__success">
        Check your email to confirm your account!
      </div>

      <button 
        type="submit" 
        class="auth-btn auth-btn--primary auth-btn--block"
        :disabled="loading"
      >
        {{ loading ? 'Creating account...' : 'Create account' }}
      </button>
    </form>

    <template #footer>
      Already have an account? <router-link to="/login">Sign in</router-link>
    </template>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AuthLayout from '@/components/common/AuthLayout.vue'
import { Eye, EyeOff } from 'lucide-vue-next'

const authStore = useAuthStore()

const form = reactive({
  name: '',
  email: '',
  password: ''
})

const loading = ref(false)
const error = ref('')
const success = ref(false)
const showPassword = ref(false)

async function handleSubmit() {
  error.value = ''
  loading.value = true

  try {
    await authStore.signUp(form.email, form.password, form.name)
    success.value = true
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to create account'
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
@use '@/assets/scss/auth';
</style>
