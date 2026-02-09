<template>
  <AuthLayout>
    <div class="callback">
      <div v-if="loading" class="callback__loading">
        <div class="callback__spinner"></div>
        <p>Confirming your email...</p>
      </div>
      
      <div v-else-if="success" class="callback__success">
        <div class="callback__icon callback__icon--success">✓</div>
        <h1>Email Confirmed!</h1>
        <p>Your account has been verified successfully.</p>
        <router-link to="/dashboard" class="auth-btn auth-btn--primary">
          Go to Dashboard
        </router-link>
      </div>
      
      <div v-else class="callback__error">
        <div class="callback__icon callback__icon--error">!</div>
        <h1>Confirmation Failed</h1>
        <p>{{ error || 'Something went wrong. Please try again.' }}</p>
        <router-link to="/login" class="auth-btn auth-btn--primary">
          Back to Login
        </router-link>
      </div>
    </div>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/common/AuthLayout.vue'

const router = useRouter()
const route = useRoute()

const loading = ref(true)
const success = ref(false)
const error = ref('')

onMounted(async () => {
  try {
    // Check for hash parameters (Supabase uses hash-based auth)
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')
    const type = hashParams.get('type')
    
    // Also check query params as fallback
    const queryType = route.query.type as string
    const queryError = route.query.error_description as string
    
    if (queryError) {
      throw new Error(queryError)
    }
    
    if (type === 'signup' || type === 'email_change' || queryType === 'signup') {
      // If we have tokens, set the session
      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        })
        
        if (sessionError) throw sessionError
      }
      
      success.value = true
      
      // Auto-redirect after 2 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } else if (type === 'recovery') {
      // Password recovery - redirect to reset password page
      router.push('/recovery')
    } else {
      // Unknown type or no confirmation needed
      success.value = true
    }
  } catch (e: any) {
    console.error('Auth callback error:', e)
    error.value = e.message || 'Confirmation failed'
  } finally {
    loading.value = false
  }
})
</script>

<style lang="scss" scoped>
@use '@/assets/scss/variables' as *;

.callback {
  text-align: center;
  padding: $spacing-8;
  
  &__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-4;
    color: $gray-600;
  }
  
  &__spinner {
    width: 48px;
    height: 48px;
    border: 4px solid $gray-200;
    border-top-color: $primary;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  &__success,
  &__error {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-4;
    
    h1 {
      font-size: $font-size-2xl;
      font-weight: $font-weight-bold;
      color: $gray-900;
      margin: 0;
    }
    
    p {
      color: $gray-600;
      margin-bottom: $spacing-4;
    }
  }
  
  &__icon {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    font-weight: bold;
    
    &--success {
      background: rgba($success, 0.1);
      color: $success;
    }
    
    &--error {
      background: rgba($error, 0.1);
      color: $error;
    }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
