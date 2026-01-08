<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { fetchUtils } from '@/utils/fetchUtils';

import logoImg from '@/assets/logo.png'

const props = defineProps({
  user: {
    type: Object,
    default: () => null
  }
});

// Define Emits เพื่อบอกตัวแม่ (App.vue) ว่า Logout แล้ว
const emit = defineEmits(['logout']);
const router = useRouter();

// สร้างตัวย่อชื่อ (Avatar) เช่น Somsak Dev -> SD
const userInitials = computed(() => {
  if (!props.user) return 'Guest';
  const f = props.user.firstname?.charAt(0) || '';
  const l = props.user.lastname?.charAt(0) || '';
  return (f + l).toUpperCase();
});

const handleLogout = async () => {
  localStorage.removeItem('isLoggedIn');
  try {
     await fetchUtils('/auth/logout', { method: 'POST' }).catch(() => {}); 
  } catch (e) {}
  
  // แจ้ง App.vue ให้เคลียร์ค่า User
  emit('logout');
  router.push('/login');
};
</script>

<template>
  <nav class="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/80 border-b border-slate-200/60 px-6 py-4 flex justify-between items-center transition-all duration-300">
    <div class="flex items-center gap-3 cursor-pointer" @click="router.push('/')">
      <img 
        :src="logoImg" 
        alt="Worklogs Logo" 
        class="w-10 h-10 rounded-xl shadow-lg shadow-indigo-500/20 object-cover group-hover:scale-105 transition-transform duration-300"
      />
      <span class="font-bold text-xl tracking-tight text-slate-800 hidden sm:block">Internship Worklogs</span>
    </div>

    <div class="flex items-center gap-4" v-if="user">
      
      <div class="hidden md:flex items-center gap-3 pl-1.5 pr-4 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-default">
        <div class="w-8 h-8 rounded-full bg-slate-100 text-indigo-600 flex items-center justify-center text-xs font-bold border border-slate-200">
          {{ userInitials }}
        </div>
        <div class="flex flex-col leading-none">
          <span class="text-sm font-semibold text-slate-700">{{ user.firstname }} {{ user.lastname }}</span>
          <span class="text-[10px] text-slate-400 font-medium tracking-wide">@{{ user.username }}</span>
        </div>
      </div>

      <div class="md:hidden w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold border border-indigo-100">
         {{ userInitials }}
      </div>

      <div class="h-6 w-px bg-slate-200 mx-1"></div>

      <button 
        @click="handleLogout"
        class="group p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all duration-300 shadow-sm active:scale-95"
        title="Logout"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="group-hover:rotate-12 transition-transform"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
      </button>
    </div>
  </nav>
</template>