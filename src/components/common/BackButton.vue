<template>
  <button @click="goBack" class="back-btn" type="button">
    <ArrowLeft :size="18" />
    <span>{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  label?: string
  to?: string
}>(), {
  label: 'Go back'
})

const router = useRouter()

function goBack() {
  if (props.to) {
    router.push(props.to)
  } else {
    router.back()
  }
}
</script>

<style lang="scss" scoped>
@use '@/assets/scss/variables' as *;

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: $spacing-2;
  padding: $spacing-2 $spacing-3;
  background: transparent;
  border: 1px solid $gray-300;
  border-radius: $radius-md;
  color: $gray-600;
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover {
    background: $gray-100;
    border-color: $gray-400;
    color: $gray-900;
  }
}
</style>
