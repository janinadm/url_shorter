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
        class="btn btn--primary btn--block"
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
  
  &__password-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    
    .auth-form__input {
      padding-right: 44px;
    }
  }
  
  &__toggle-password {
    position: absolute;
    right: 12px;
    background: none;
    border: none;
    color: $gray-400;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
      color: $gray-600;
    }
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    margin-bottom: $spacing-4;
  }

  &__link {
    font-size: $font-size-sm;
    color: $primary;
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
