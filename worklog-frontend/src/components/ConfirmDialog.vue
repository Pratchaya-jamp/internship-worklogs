<script setup>
defineProps({
  isOpen: Boolean,
  title: String,
  message: String,
  isLoading: Boolean
});

const emit = defineEmits(['confirm', 'cancel']);
</script>

<template>
  <Transition name="fade">
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" @click="!isLoading && emit('cancel')"></div>

      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 relative z-10 transform transition-all scale-100">
        
        <div class="text-center">
          <div class="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <svg v-if="!isLoading" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            <div v-else class="animate-spin h-8 w-8 border-2 border-rose-500 border-t-transparent rounded-full"></div>
          </div>

          <h3 class="text-xl font-bold text-slate-800 mb-2">{{ title }}</h3>
          <p class="text-slate-500 text-sm mb-6">{{ message }}</p>

          <div class="flex gap-3">
            <button 
              @click="emit('cancel')" 
              :disabled="isLoading"
              class="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              @click="emit('confirm')" 
              :disabled="isLoading"
              class="flex-1 py-2.5 rounded-xl bg-rose-500 text-white font-semibold hover:bg-rose-600 shadow-lg shadow-rose-500/30 transition-all disabled:opacity-70 flex justify-center items-center gap-2"
            >
              <span v-if="isLoading">Deleting...</span>
              <span v-else>Yes, Delete</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>