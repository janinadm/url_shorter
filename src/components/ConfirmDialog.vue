<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click.self="handleCancel">
        <div class="modal" :class="[`modal--${variant}`]">
          <div class="modal__header">
            <div class="modal__icon">
              <span v-if="variant === 'danger'">⚠️</span>
              <span v-else>❓</span>
            </div>
            <h3 class="modal__title">{{ title }}</h3>
          </div>
          
          <div class="modal__body">
            <p>{{ message }}</p>
          </div>
          
          <div class="modal__footer">
            <button 
              class="btn btn--secondary" 
              @click="handleCancel"
              :disabled="loading"
            >
              {{ cancelText }}
            </button>
            <button 
              class="btn" 
              :class="variant === 'danger' ? 'btn--danger' : 'btn--primary'"
              @click="handleConfirm"
              :disabled="loading"
            >
              <span v-if="loading" class="btn__spinner"></span>
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'danger'
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  variant: 'default',
  loading: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': []
  'cancel': []
}>()

function handleConfirm() {
  emit('confirm')
}

function handleCancel() {
  if (!props.loading) {
    emit('update:modelValue', false)
    emit('cancel')
  }
}
</script>

<style lang="scss" scoped>
@use 'sass:color';
@use '@/assets/scss/variables' as *;

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: $spacing-4;
}

.modal {
  background: $white;
  border-radius: $radius-xl;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-width: 400px;
  width: 100%;
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-3;
    padding: $spacing-6 $spacing-6 $spacing-4;
  }

  &__icon {
    font-size: 1.5rem;
  }

  &__title {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: $gray-900;
    margin: 0;
  }

  &__body {
    padding: 0 $spacing-6 $spacing-6;
    color: $gray-600;
    line-height: 1.6;
  }

  &__footer {
    display: flex;
    gap: $spacing-3;
    padding: $spacing-4 $spacing-6;
    background: $gray-50;
    justify-content: flex-end;
  }

  &--danger {
    .modal__title {
      color: $error;
    }
  }
}

.btn {
  padding: $spacing-2 $spacing-4;
  border-radius: $radius-md;
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  cursor: pointer;
  transition: all $transition-fast;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: $spacing-2;

  &--primary {
    background: $primary;
    color: $white;

    &:hover:not(:disabled) {
      background: color.adjust($primary, $lightness: -10%);
    }
  }

  &--secondary {
    background: $white;
    color: $gray-700;
    border: 1px solid $gray-300;

    &:hover:not(:disabled) {
      background: $gray-50;
    }
  }

  &--danger {
    background: $error;
    color: $white;

    &:hover:not(:disabled) {
      background: color.adjust($error, $lightness: -10%);
    }
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &__spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba($white, 0.3);
    border-top-color: $white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// Transition animations
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
  
  .modal {
    transition: transform 0.2s ease;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  
  .modal {
    transform: scale(0.95);
  }
}
</style>
