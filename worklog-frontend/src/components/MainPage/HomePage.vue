<script setup>
import { ref, onMounted } from 'vue';
import { fetchUtils } from '@/utils/fetchUtils';
import ToastNotification from '@/components/ToastNotification.vue';

// *ไม่ต้อง Import user หรือ Navbar แล้ว เพราะ App.vue จัดการให้*

const toastRef = ref(null);
const isLoading = ref(true);

const stats = ref([
  { title: 'Total Logs', value: '128', icon: '📝', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { title: 'Hours Worked', value: '340h', icon: '⏱️', color: 'text-violet-600', bg: 'bg-violet-50' },
  { title: 'Projects', value: '5', icon: '🚀', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { title: 'Streak', value: '12 Days', icon: '🔥', color: 'text-orange-500', bg: 'bg-orange-50' },
]);

const recentLogs = ref([]);

const fetchData = async () => {
  try {
    await new Promise(r => setTimeout(r, 800)); // Mock delay
    
    // ตรงนี้ดึงแค่ Logs พอ ไม่ต้องดึง User
    recentLogs.value = [
      { id: 1, title: 'Fix CSS Bug on Login Page', project: 'Project Worklogs', time: '2 hours ago', status: 'Completed' },
      { id: 2, title: 'Setup Backend Architecture', project: 'API Core', time: '5 hours ago', status: 'In Progress' },
      { id: 3, title: 'Meeting with Client', project: 'Freelance A', time: 'Yesterday', status: 'Meeting' },
      { id: 4, title: 'Database Optimization', project: 'E-Commerce', time: '2 days ago', status: 'Completed' },
    ];
    
    isLoading.value = false;
  } catch (error) {
    toastRef.value?.addToast('Failed to load data', 'error');
  }
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="relative"> <ToastNotification ref="toastRef" />
    
    <main class="max-w-6xl mx-auto px-6 py-10 space-y-10">
      
      <header class="space-y-2 animate-fade-in">
        <h1 class="text-3xl font-bold text-slate-900">
          Dashboard Overview
        </h1>
        <p class="text-slate-500">Here's what's happening with your projects today.</p>
      </header>

      <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
        <div v-for="i in 4" :key="i" class="h-32 bg-slate-200 rounded-3xl"></div>
      </div>
      
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <div 
          v-for="(stat, index) in stats" 
          :key="stat.title"
          class="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 hover:-translate-y-1 transition-transform duration-300"
          :style="{ animationDelay: `${index * 100}ms` }"
        >
          <div class="flex items-start justify-between mb-4">
            <div :class="`p-3 rounded-2xl ${stat.bg} ${stat.color} text-xl`">
              {{ stat.icon }}
            </div>
          </div>
          <div>
            <h3 class="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{{ stat.title }}</h3>
            <p class="text-3xl font-bold text-slate-800">{{ stat.value }}</p>
          </div>
        </div>
      </div>

      <section>
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-bold text-slate-800">Recent Logs</h2>
          <button class="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">View All</button>
        </div>

        <div class="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden min-h-[300px] relative">
          <div v-if="isLoading" class="p-8 space-y-4">
             <div v-for="i in 3" :key="i" class="flex items-center gap-4 animate-pulse">
               <div class="w-12 h-12 bg-slate-100 rounded-xl"></div>
               <div class="flex-1 space-y-2">
                 <div class="h-4 bg-slate-100 rounded w-1/3"></div>
                 <div class="h-3 bg-slate-100 rounded w-1/4"></div>
               </div>
             </div>
          </div>

          <div v-else class="divide-y divide-slate-50">
            <div 
              v-for="(log, index) in recentLogs" 
              :key="log.id"
              class="group p-5 hover:bg-slate-50/80 transition-colors duration-200 flex items-center gap-4 animate-slide-up"
              :style="{ animationDelay: `${index * 100}ms` }"
            >
               <div class="w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors bg-slate-50 border-slate-100 text-slate-500">
                  <span class="text-lg">📌</span>
               </div>
               <div class="flex-1">
                <h3 class="font-semibold text-slate-800 text-sm">{{ log.title }}</h3>
                <p class="text-xs text-slate-400 mt-0.5">{{ log.project }} • {{ log.time }}</p>
              </div>
              <span :class="{'text-emerald-500': log.status==='Completed', 'text-amber-500': log.status==='In Progress'}" class="text-xs font-bold px-3 py-1 bg-slate-50 rounded-lg">{{ log.status }}</span>
            </div>
          </div>

        </div>
      </section>

    </main>

    <button class="fixed bottom-8 right-8 w-14 h-14 bg-slate-900 hover:bg-indigo-600 text-white rounded-full shadow-2xl hover:shadow-indigo-500/40 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center z-40">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
    </button>
  </div>
</template>

<style scoped>
/* Animations (เหมือนเดิม) */
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-in { animation: fadeIn 0.6s ease-out forwards; }
.animate-slide-up { opacity: 0; animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
</style>