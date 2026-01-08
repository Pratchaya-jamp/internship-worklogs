<script setup>
import { ref } from 'vue';

const toasts = ref([]);

// Expose function ให้ component อื่นเรียกใช้ผ่าน Template Ref หรือ Event Bus (ในตัวอย่างนี้จะจำลอง logic ภายใน)
// ในงานจริงแนะนำให้ใช้ Pinia หรือ Composable (useToast)
const addToast = (message, type = 'success') => {
  const id = Date.now();
  toasts.value.push({ id, message, type });
  setTimeout(() => removeToast(id), 3000);
};

const removeToast = (id) => {
  toasts.value = toasts.value.filter(t => t.id !== id);
};

defineExpose({ addToast });
</script>

<template>
  <div class="fixed top-5 right-5 z-50 flex flex-col gap-3">
    <TransitionGroup name="toast">
      <div 
        v-for="toast in toasts" 
        :key="toast.id"
        class="flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-md border border-white/10 text-sm font-medium transition-all transform hover:scale-102 cursor-pointer"
        :class="{
          'bg-emerald-500/90 text-white': toast.type === 'success',
          'bg-rose-500/90 text-white': toast.type === 'error',
          'bg-amber-500/90 text-white': toast.type === 'warning'
        }"
        @click="removeToast(toast.id)"
      >
        <span>{{ toast.message }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.9);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.9);
}
</style>