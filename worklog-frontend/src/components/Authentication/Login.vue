<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { fetchUtils } from '@/utils/fetchUtils';
import ToastNotification from '@/components/ToastNotification.vue';

import logoImg from '@/assets/logo.png'

const router = useRouter();
const toastRef = ref(null);
const isLoading = ref(false);

const form = ref({
  identifier: '',
  password: ''
});

const handleLogin = async () => {
  if (!form.value.identifier || !form.value.password) {
    toastRef.value.addToast('Please fill in all fields', 'error');
    return;
  }

  isLoading.value = true;
  try {
    // 1. ยิง API Login
    const response = await fetchUtils('/auth/login', {
      method: 'POST',
      body: JSON.stringify(form.value)
    });

    toastRef.value.addToast('Welcome back!', 'success');
    
    // 2. [สำคัญ] บันทึกสถานะว่า Login แล้ว ลงใน LocalStorage
    // Router Guard จะมาเช็คตรงนี้เพื่ออนุญาตให้เข้าหน้า Home
    localStorage.setItem('isLoggedIn', 'true');

    // (Optional) ถ้า Backend ส่งข้อมูล User กลับมาด้วย (เช่น firstname/lastname)
    // ให้บันทึกลงไปเพื่อให้หน้า Home ดึงไปแสดงชื่อได้เลย ไม่ต้องรอโหลด
    if (response.user) {
      localStorage.setItem('user', JSON.stringify(response.user));
    }

    // 3. Redirect ไปหน้า Home
    setTimeout(() => {
      router.push('/'); 
    }, 1000);

  } catch (error) {
    toastRef.value.addToast(error.message || 'Invalid credentials', 'error');
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800 relative overflow-hidden font-sans">
    <ToastNotification ref="toastRef" />

    <div class="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-100 via-slate-50 to-white -z-0"></div>

    <div class="w-full max-w-sm bg-white/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-white/50 z-10 animate-fade-in-up">
      
      <div class="text-center mb-10">
        <img 
          :src="logoImg" 
          alt="Logo" 
          class="w-16 h-16 rounded-2xl mx-auto mb-4 shadow-lg shadow-indigo-500/20 object-cover"
        />
        <h1 class="text-2xl font-bold text-slate-800">Welcome Back</h1>
        <p class="text-slate-400 text-sm mt-1">Enter your credentials to access Worklogs</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
        
        <div class="group">
          <label class="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Username or Email</label>
          <div class="relative">
             <input 
              v-model="form.identifier" 
              type="text" 
              class="w-full pl-4 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-300 placeholder-slate-300 group-hover:border-slate-300"
              placeholder="example@worklog.com"
            />
          </div>
        </div>

        <div class="group">
          <div class="flex justify-between items-center mb-2">
            <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Password</label>
            <a href="#" class="text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors">Forgot?</a>
          </div>
          <input 
            v-model="form.password" 
            type="password" 
            class="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-300 placeholder-slate-300 group-hover:border-slate-300"
            placeholder="••••••••"
          />
        </div>

        <button 
          type="submit" 
          :disabled="isLoading"
          class="w-full py-3.5 bg-slate-900 text-white rounded-xl font-semibold shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-md transition-all duration-300 flex justify-center items-center gap-2 disabled:opacity-70"
        >
          <span v-if="isLoading" class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
          <span>{{ isLoading ? 'Logging in...' : 'Sign In' }}</span>
        </button>

      </form>

      <div class="mt-8 text-center">
        <p class="text-sm text-slate-400">
          Don't have an account? 
          <RouterLink to="/register" class="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">Sign Up</RouterLink>
        </p>
      </div>

    </div>
  </div>
</template>

<style scoped>
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>