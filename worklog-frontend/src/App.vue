<script setup>
import { ref, watch, computed } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';
import Navbar from '@/components/Navbar.vue'; // Import Navbar
import { fetchUtils } from '@/utils/fetchUtils';

const route = useRoute();
const router = useRouter();
const userData = ref(null);

// เช็คว่าหน้าปัจจุบันควรแสดง Navbar ไหม (ซ่อนตอน Login/Register)
const showNavbar = computed(() => {
  return !['login', 'register'].includes(route.name);
});

// Function ดึงข้อมูล User
const fetchUserProfile = async () => {
  // ถ้ามีข้อมูลอยู่แล้ว หรือไม่ได้ Login (ไม่มี token ใน browser logic) ก็ไม่ต้องยิง
  // แต่เนื่องจาก token เป็น HttpOnly เราเช็ค localStorage แค่ flag ว่า 'isLoggedIn'
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  
  if (isLoggedIn && !userData.value) {
    try {
      const response = await fetchUtils('/auth/me');
      if (response.status === 'success') {
        userData.value = response.data;
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      // ถ้า 401 fetchUtils อาจจะดีดไป Login แล้ว แต่เพื่อความชัวร์
      localStorage.removeItem('isLoggedIn');
      router.push('/login');
    }
  }
};

// Watch Route Change: 
// ทุกครั้งที่เปลี่ยนหน้า ถ้าเข้าหน้าที่มี Navbar และยังไม่มีข้อมูล User ให้ไปดึงมา
watch(
  () => route.path,
  async () => {
    if (showNavbar.value) {
      await fetchUserProfile();
    }
  },
  { immediate: true } // ทำงานทันทีตอนโหลดเว็บครั้งแรก
);

// รับ Event Logout จาก Navbar
const handleUserLogout = () => {
  userData.value = null;
};
</script>

<template>
  <div class="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased selection:bg-indigo-500 selection:text-white overflow-x-hidden flex flex-col">
    
    <Transition name="slide-down">
      <Navbar 
        v-if="showNavbar" 
        :user="userData" 
        @logout="handleUserLogout"
      />
    </Transition>
    
    <div class="flex-1">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </div>

  </div>
</template>

<style>
/* Import Google Fonts: Inter (English) & Kanit (Thai) for Premium Look */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Kanit:wght@300;400;500;600&display=swap');

/* Global Reset & Base Styles */
:root {
  font-family: 'Inter', 'Kanit', sans-serif;
}

body {
  margin: 0;
  padding: 0;
  /* ป้องกันการกระตุกของ Scrollbar เวลาเปลี่ยนหน้า */
  overflow-y: scroll; 
}

/* Custom Scrollbar (Chrome/Safari/Webkit) - ให้ดู Modern Minimal */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background-color: #cbd5e1; /* slate-300 */
  border-radius: 20px;
  border: 3px solid transparent;
  background-clip: content-box;
}

::-webkit-scrollbar-thumb:hover {
  background-color: #94a3b8; /* slate-400 */
}

/* Page Transitions (Smooth Fade + Slide) */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.4s cubic-bezier(0.25, 1, 0.5, 1), transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
}

.page-enter-from {
  opacity: 0;
  transform: translateY(15px); /* เลื่อนขึ้นมาจากด้านล่างนิดหน่อย */
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-5px); /* เลื่อนขึ้นไปข้างบนนิดหน่อยตอนออก */
}

/* Autofill Background Fix (สำหรับ Chrome ไม่ให้เป็นสีเหลือง) */
input:-webkit-autofill,
input:-webkit-autofill:hover, 
input:-webkit-autofill:focus, 
input:-webkit-autofill:active{
    -webkit-box-shadow: 0 0 0 30px white inset !important;
    -webkit-text-fill-color: #1e293b !important;
    transition: background-color 5000s ease-in-out 0s;
}

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Kanit:wght@300;400;500;600&display=swap');

:root { font-family: 'Inter', 'Kanit', sans-serif; }
body { margin: 0; padding: 0; overflow-y: scroll; }

/* Transitions */
.page-enter-active, .page-leave-active {
  transition: opacity 0.4s cubic-bezier(0.25, 1, 0.5, 1), transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
}
.page-enter-from { opacity: 0; transform: translateY(15px); }
.page-leave-to { opacity: 0; transform: translateY(-5px); }

/* Navbar Slide Animation */
.slide-down-enter-active, .slide-down-leave-active {
  transition: transform 0.4s ease, opacity 0.4s ease;
}
.slide-down-enter-from, .slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>