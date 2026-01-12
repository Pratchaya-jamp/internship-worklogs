<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'; // เพิ่ม ref, lifecycle
import { useRouter } from 'vue-router';
import { fetchUtils } from '@/utils/fetchUtils';
import logoImg from '@/assets/logo.png'; 

const props = defineProps({
  user: { type: Object, default: () => null }
});

const emit = defineEmits(['logout']);
const router = useRouter();
const isDropdownOpen = ref(false); // State สำหรับ Dropdown
const dropdownRef = ref(null); // Ref สำหรับ Click Outside

const userInitials = computed(() => {
  if (!props.user) return 'G';
  const f = props.user.firstname?.charAt(0) || '';
  const l = props.user.lastname?.charAt(0) || '';
  return (f + l).toUpperCase();
});

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isDropdownOpen.value = false;
  }
};

onMounted(() => document.addEventListener('click', handleClickOutside));
onUnmounted(() => document.removeEventListener('click', handleClickOutside));

const handleLogout = async () => {
  localStorage.removeItem('isLoggedIn');
  try { await fetchUtils('/auth/logout', { method: 'POST' }).catch(() => {}); } catch (e) {}
  emit('logout');
  router.push('/login');
};

const goToGallery = () => {
  isDropdownOpen.value = false;
  router.push('/gallery');
};
</script>

<template>
  <nav class="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/80 border-b border-slate-200/60 px-6 py-4 flex justify-between items-center transition-all duration-300">
    <div class="flex items-center gap-3 cursor-pointer group" @click="router.push('/')">
      <img :src="logoImg" alt="Worklogs Logo" class="w-10 h-10 rounded-xl shadow-lg shadow-indigo-500/20 object-cover group-hover:scale-105 transition-transform duration-300"/>
      <span class="font-bold text-xl tracking-tight text-slate-800 hidden sm:block">Worklogs</span>
    </div>

    <div class="flex items-center gap-4" v-if="user" ref="dropdownRef">
      
      <button 
        @click="toggleDropdown"
        class="relative flex items-center gap-3 pl-1.5 pr-4 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-95"
      >
        <div class="w-8 h-8 rounded-full bg-slate-100 text-indigo-600 flex items-center justify-center text-xs font-bold border border-slate-200">
          {{ userInitials }}
        </div>
        <div class="hidden md:flex flex-col items-start leading-none">
          <span class="text-sm font-semibold text-slate-700">{{ user.firstname }} {{ user.lastname }}</span>
          <span class="text-[10px] text-slate-400 font-medium tracking-wide">@{{ user.username }}</span>
        </div>
        <svg class="w-4 h-4 text-slate-400 transition-transform duration-300" :class="isDropdownOpen ? 'rotate-180' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
      </button>

      <Transition name="dropdown">
        <div v-if="isDropdownOpen" class="absolute top-16 right-6 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden py-2 z-50">
          
          <div class="px-4 py-3 border-b border-slate-50 md:hidden">
            <p class="text-sm font-bold text-slate-800">{{ user.firstname }} {{ user.lastname }}</p>
            <p class="text-xs text-slate-400">@{{ user.username }}</p>
          </div>

          <button @click="goToGallery" class="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            My Gallery
          </button>
          
          <div class="h-px bg-slate-100 my-1"></div>

          <button @click="handleLogout" class="w-full text-left px-4 py-2.5 text-sm font-medium text-rose-500 hover:bg-rose-50 transition-colors flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            Logout
          </button>
        </div>
      </Transition>

    </div>
  </nav>
</template>

<style scoped>
.dropdown-enter-active, .dropdown-leave-active { transition: all 0.2s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-10px); }
</style>