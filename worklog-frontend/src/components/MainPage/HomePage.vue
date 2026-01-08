<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { fetchUtils } from '@/utils/fetchUtils';
import ToastNotification from '@/components/ToastNotification.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';

const router = useRouter();
const toastRef = ref(null);
const isLoading = ref(true);
const logs = ref([]);
const currentTime = ref('');
let clockInterval = null;

// Filters & Sort
const searchQuery = ref('');
const filterDateStart = ref('');
const filterDateEnd = ref('');
const sortDesc = ref(true); 

// Pagination State
const currentPage = ref(1);
const itemsPerPage = 10;

// Delete Logic State
const showDeleteModal = ref(false);
const itemToDelete = ref(null);
const isDeleting = ref(false);

// --- Helper Functions ---
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

const startClock = () => {
  const update = () => {
    currentTime.value = new Date().toLocaleTimeString('en-US', {
      timeZone: 'Asia/Bangkok',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };
  update();
  clockInterval = setInterval(update, 1000);
};

// --- Computed Stats ---
const totalLogsCount = computed(() => logs.value.length);

const weeklyProgress = computed(() => {
  const now = new Date();
  const day = now.getDay(); 
  const diffToMon = (day + 6) % 7; 
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMon);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const uniqueDays = new Set();
  logs.value.forEach(log => {
    const logDate = new Date(log.date);
    logDate.setHours(12, 0, 0, 0); 
    if (logDate >= monday && logDate <= sunday) {
      uniqueDays.add(log.date);
    }
  });
  return uniqueDays.size;
});

const weeklyProgressPercent = computed(() => Math.min((weeklyProgress.value / 5) * 100, 100));

const insufficientWeeksCount = computed(() => {
  const weeks = {};
  logs.value.forEach(log => {
    const date = new Date(log.date);
    const key = `${date.getFullYear()}-W${log.week_no}`;
    if (!weeks[key]) weeks[key] = { days: new Set(), hasEarlyLeave: false };
    
    const dayOfWeek = date.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) weeks[key].days.add(log.date);
    if (log.end_time && timeToMinutes(log.end_time) < timeToMinutes('17:00')) weeks[key].hasEarlyLeave = true;
    if (log.start_time === 'Absent') weeks[key].days.add(log.date); // Count absent days as logged days for simplicity in this logic, or adjust as needed
  });

  let count = 0;
  Object.values(weeks).forEach(week => {
    // Logic: ถ้านับวันทำงานได้ไม่ครบ 5 หรือมี Early Leave
    if (week.days.size < 5 || week.hasEarlyLeave) count++;
  });
  return count;
});

// --- Filter & Sort Logic ---
const filteredLogs = computed(() => {
  let result = [...logs.value];

  if (searchQuery.value) {
    const lower = searchQuery.value.toLowerCase();
    result = result.filter(log => log.content.toLowerCase().includes(lower));
  }
  if (filterDateStart.value) {
    result = result.filter(log => new Date(log.date) >= new Date(filterDateStart.value));
  }
  if (filterDateEnd.value) {
    result = result.filter(log => new Date(log.date) <= new Date(filterDateEnd.value));
  }

  result.sort((a, b) => sortDesc.value ? b.id - a.id : a.id - b.id);
  return result;
});

// --- Pagination Logic ---
const totalPages = computed(() => Math.ceil(filteredLogs.value.length / itemsPerPage));

const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredLogs.value.slice(start, end);
});

const paginationInfo = computed(() => {
  if (filteredLogs.value.length === 0) return 'No results';
  const start = (currentPage.value - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage.value * itemsPerPage, filteredLogs.value.length);
  return `Showing ${start}-${end} of ${filteredLogs.value.length}`;
});

watch([searchQuery, filterDateStart, filterDateEnd, sortDesc], () => {
  currentPage.value = 1;
});

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

// --- Delete Logic ---
const confirmDelete = (log) => {
  itemToDelete.value = log;
  showDeleteModal.value = true;
};

const handleDeleteAction = () => {
  if (!itemToDelete.value) return;
  
  isDeleting.value = true;

  // 1. Loading 3 วินาที
  setTimeout(async () => {
    try {
      // 2. เรียก API DELETE
      await fetchUtils(`/worklogs/${itemToDelete.value.id}`, {
        method: 'DELETE'
      });
      
      toastRef.value.addToast('Log deleted successfully', 'success');
      
      // ✅ 3. Update Real-time: ลบออกจาก Array ทันที ไม่ต้องรอ fetchData() ใหม่
      // ใช้ .value เพราะ logs เป็น ref
      logs.value = logs.value.filter(log => log.id !== itemToDelete.value.id);
      
      // (Optionally) ถ้าอยากให้ชัวร์จริงๆ จะเรียก fetchData() ซ้ำก็ได้ แต่การ filter ข้างบนจะทำให้ UI หายวับไปทันที
      // await fetchData(); 
      
    } catch (error) {
      console.error(error);
      toastRef.value.addToast('Failed to delete log', 'error');
    } finally {
      isDeleting.value = false;
      showDeleteModal.value = false;
      itemToDelete.value = null;
    }
  }, 3000);
};

// --- Fetch Data ---
const fetchData = async () => {
  isLoading.value = true;
  try {
    const response = await fetchUtils('/worklogs');
    if (response.status === 'success') {
      logs.value = response.data;
    }
  } catch (error) {
    toastRef.value?.addToast('Failed to load logs', 'error');
  } finally {
    setTimeout(() => { isLoading.value = false; }, 600);
  }
};

const goToWeeklyProg = () => {
    router.push("/this-week")
}

const goToMissing = () => {
    router.push("/insufficient")
}

onMounted(() => {
  startClock();
  fetchData();
});

onUnmounted(() => {
  if (clockInterval) clearInterval(clockInterval);
});
</script>

<template>
  <div class="relative min-h-full pb-20">
    <ToastNotification ref="toastRef" />
    
    <ConfirmDialog 
      :isOpen="showDeleteModal"
      title="Delete Worklog?"
      message="Are you sure you want to delete this log? This action cannot be undone."
      :isLoading="isDeleting"
      @confirm="handleDeleteAction"
      @cancel="showDeleteModal = false"
    />

    <main class="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      <header class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 animate-fade-in">
        <div>
          <h1 class="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p class="text-slate-500 mt-1">Overview of your work performance.</p>
        </div>
      </header>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div class="bg-white p-6 rounded-3xl shadow-lg shadow-slate-200/60 border border-slate-100 flex flex-col justify-between h-36 group hover:-translate-y-1 transition-transform duration-300">
          <div class="flex justify-between items-start">
            <div class="p-3 bg-indigo-50 text-indigo-600 rounded-2xl text-xl">📝</div>
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Logs</span>
          </div>
          <div>
            <div class="text-3xl font-bold text-slate-800">{{ totalLogsCount }}</div>
            <p class="text-xs text-slate-400 mt-1">Recorded activities</p>
          </div>
        </div>

        <div class="bg-white p-6 rounded-3xl shadow-lg shadow-slate-200/60 border border-slate-100 flex flex-col justify-between h-36 group hover:-translate-y-1 transition-transform duration-300 hover:cursor-pointer" @click="goToWeeklyProg">
          <div class="flex justify-between items-start">
            <div class="p-3 bg-sky-50 text-sky-600 rounded-2xl text-xl">📊</div>
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">This Week</span>
          </div>
          <div class="w-full">
            <div class="flex items-end justify-between mb-2">
               <div class="text-3xl font-bold text-slate-800">{{ weeklyProgress }} <span class="text-lg text-slate-400 font-medium">/ 5</span></div>
               <span class="text-xs font-bold text-sky-600">{{ Math.round(weeklyProgressPercent) }}%</span>
            </div>
            <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
               <div class="h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-full transition-all duration-1000 ease-out" :style="{ width: `${weeklyProgressPercent}%` }"></div>
            </div>
          </div>
        </div>

        <div class="bg-white p-6 rounded-3xl shadow-lg shadow-slate-200/60 border border-slate-100 flex flex-col justify-between h-36 group hover:-translate-y-1 transition-transform duration-300 hover:cursor-pointer" @click="goToMissing">
          <div class="flex justify-between items-start">
            <div class="p-3 bg-rose-50 text-rose-600 rounded-2xl text-xl">⚠️</div>
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Insufficient</span>
          </div>
          <div>
            <div class="text-3xl font-bold text-slate-800 flex items-center gap-2">
              {{ insufficientWeeksCount }}
              <span class="text-sm font-medium text-slate-400">Weeks</span>
            </div>
            <p class="text-xs text-slate-400 mt-1">Incomplete / Early Leave</p>
          </div>
        </div>

        <div class="bg-slate-900 p-6 rounded-3xl shadow-xl shadow-slate-900/20 border border-slate-800 flex flex-col justify-between h-36 group relative overflow-hidden">
          <div class="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl"></div>
          <div class="flex justify-between items-start relative z-10">
            <div class="p-3 bg-white/10 text-white rounded-2xl text-xl backdrop-blur-sm">🕒</div>
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">BKK TIME</span>
          </div>
          <div class="relative z-10">
            <div class="text-3xl font-mono font-bold text-white tracking-widest">{{ currentTime }}</div>
            <div class="flex items-center gap-1.5 mt-1">
              <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <p class="text-xs text-slate-400">Live</p>
            </div>
          </div>
        </div>
      </div>

      <section class="flex flex-col lg:flex-row gap-4 justify-between items-center bg-white/60 backdrop-blur-md p-4 rounded-3xl border border-white/50 shadow-sm">
        <div class="relative w-full lg:w-96 group">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" /></svg>
          </div>
          <input v-model="searchQuery" type="text" class="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 sm:text-sm transition-all shadow-sm" placeholder="Search content..." />
        </div>
        <div class="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <input v-model="filterDateStart" type="date" class="px-3 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm" />
          <span class="text-slate-400">-</span>
          <input v-model="filterDateEnd" type="date" class="px-3 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm" />
          <div class="h-8 w-px bg-slate-200 mx-1"></div>
          <button @click="sortDesc = !sortDesc" class="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 active:scale-95 transition-all shadow-sm">
            <svg v-if="sortDesc" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" /></svg>
            <span>{{ sortDesc ? 'Newest' : 'Oldest' }}</span>
          </button>
        </div>
      </section>

      <section>
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <h2 class="text-xl font-bold text-slate-800">Recent Logs</h2>
            <span class="text-xs font-semibold px-2.5 py-1 bg-slate-200 text-slate-600 rounded-lg">{{ filteredLogs.length }} items</span>
          </div>
          
          <button 
            @click="router.push('/newLog')"
            class="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-indigo-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-slate-900/20 hover:shadow-indigo-500/30 transition-all duration-300 active:scale-95"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            <span>Add Log</span>
          </button>
        </div>

        <div class="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden min-h-[400px] relative flex flex-col">
          
          <div v-if="isLoading" class="p-8 space-y-6">
             <div v-for="i in 4" :key="i" class="flex flex-col sm:flex-row gap-6 animate-pulse">
               <div class="w-full sm:w-48 h-32 bg-slate-100 rounded-2xl"></div>
               <div class="flex-1 space-y-3 py-2">
                 <div class="h-5 bg-slate-100 rounded w-1/4"></div>
                 <div class="h-4 bg-slate-100 rounded w-3/4"></div>
                 <div class="h-4 bg-slate-100 rounded w-1/2"></div>
               </div>
             </div>
          </div>

          <div v-else-if="filteredLogs.length === 0" class="flex-1 flex flex-col items-center justify-center text-slate-400 p-10">
            <div class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-3xl shadow-inner">📭</div>
            <p class="font-medium">No logs found matching your criteria.</p>
          </div>

          <div v-else class="flex-1 divide-y divide-slate-50">
            <div 
              v-for="(log, index) in paginatedLogs" 
              :key="log.id" 
              class="group p-6 hover:bg-slate-50/80 transition-all duration-300 flex flex-col sm:flex-row gap-6 animate-slide-up relative" 
              :style="{ animationDelay: `${index * 50}ms` }"
            >

              <div class="flex sm:flex-col items-center sm:items-start gap-2 sm:gap-1 min-w-[100px]">
                 <div class="text-xl font-bold text-slate-800">{{ log.start_time }}</div>
                 <div class="h-px w-4 bg-slate-300 hidden sm:block"></div>
                 <span class="text-sm text-slate-400">to {{ log.end_time || '-' }}</span>
                 <span class="sm:hidden text-slate-300 mx-2">|</span>
                 <div class="text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded border border-indigo-100 mt-0 sm:mt-2">Week {{ log.week_no }}</div>
              </div>

              <div class="flex-1 space-y-2"> 
                 <div class="flex items-center gap-2 mb-1">
                    <span class="text-xs font-bold text-slate-400 uppercase tracking-wide">{{ new Date(log.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }}</span>
                 </div>
                 <h3 class="text-lg font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors leading-snug">{{ log.content }}</h3>
                 
                 <div class="flex items-center flex-wrap gap-4 pt-2 mt-auto">
                    
                    <span class="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                       🆔 #{{ log.id }}
                    </span>

                    <div class="flex items-center gap-2">
                      <button 
                        @click.stop="router.push(`/log/${log.id}/edit`)"
                        class="flex items-center gap-1 px-2 py-1 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-100" 
                        title="Edit"
                      >
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        Edit
                      </button>
                      
                      <button 
                        @click.stop="confirmDelete(log)"
                        class="flex items-center gap-1 px-2 py-1 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-100" 
                        title="Delete"
                      >
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        Delete
                      </button>
                    </div>

                 </div>
              </div>

              <div v-if="log.imageUrl" class="sm:w-32 md:w-40 flex-shrink-0">
                <div class="aspect-video sm:aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm group-hover:shadow-md transition-all relative">
                  <img :src="log.imageUrl" alt="Worklog attachment" class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
                  <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="!isLoading && filteredLogs.length > 0" class="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <span class="text-sm text-slate-500 font-medium order-2 sm:order-1">{{ paginationInfo }}</span>

            <div class="flex items-center gap-1 order-1 sm:order-2">
              <button 
                @click="changePage(currentPage - 1)"
                :disabled="currentPage === 1"
                class="p-2 rounded-xl text-slate-500 hover:bg-white hover:text-indigo-600 hover:shadow-sm disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
              </button>

              <div class="flex gap-1 bg-slate-200/50 p-1 rounded-xl">
                <button 
                  v-for="page in totalPages" 
                  :key="page"
                  @click="changePage(page)"
                  class="w-8 h-8 rounded-lg text-sm font-bold transition-all flex items-center justify-center"
                  :class="currentPage === page ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'"
                >
                  {{ page }}
                </button>
              </div>

              <button 
                @click="changePage(currentPage + 1)"
                :disabled="currentPage === totalPages"
                class="p-2 rounded-xl text-slate-500 hover:bg-white hover:text-indigo-600 hover:shadow-sm disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" /></svg>
              </button>
            </div>
          </div>
        </div>
      </section>

    </main>
  </div>
</template>

<style scoped>
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

.animate-fade-in { animation: fadeIn 0.6s ease-out forwards; }
.animate-slide-up { opacity: 0; animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
</style>