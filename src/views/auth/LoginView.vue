<template>
  <AuthLayout>
    <h1 class="auth-form__title">Welcome back</h1>
    <p class="auth-form__subtitle">Sign in to your account</p>

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

      <div class="auth-form__field">
        <label for="password" class="auth-form__label">Password</label>
        <div class="auth-form__password-wrapper">
          <input
            id="password"
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            class="auth-form__input"
            placeholder="Your password"
            required
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

      <div class="auth-form__actions">
        <router-link to="/recovery" class="auth-form__link">
          Forgot password?
        </router-link>
      </div>

      <div v-if="error" class="auth-form__error">
        {{ error }}
      </div>

      <button 
        type="submit" 
        class="auth-btn auth-btn--primary auth-btn--block"
        :disabled="loading"
      >
        {{ loading ? 'Signing in...' : 'Sign in' }}
      </button>
    </form>

    <template #footer>
      Don't have an account? <router-link to="/signup">Sign up</router-link>
    </template>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AuthLayout from '@/components/common/AuthLayout.vue'
import { Eye, EyeOff } from 'lucide-vue-next'

const authStore = useAuthStore()
const router = useRouter()

const form = reactive({
  email: '',
  password: ''
})

const loading = ref(false)
const error = ref('')
const showPassword = ref(false)

async function handleSubmit() {
  error.value = ''
  loading.value = true

  try {
    await authStore.signIn(form.email, form.password)
    router.push('/dashboard')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Invalid email or password'
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
@use '@/assets/scss/auth';
</style>
