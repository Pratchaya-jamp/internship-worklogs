<script setup>
import { ref, computed, onMounted } from 'vue';
import { fetchUtils } from '@/utils/fetchUtils';
import ToastNotification from '@/components/ToastNotification.vue';

const toastRef = ref(null);
const isLoading = ref(true);
const allLogs = ref([]);

// Pagination State
const currentPage = ref(1);
const itemsPerPage = 2; // โชว์ทีละ 2 สัปดาห์

// --- Helper Functions ---
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

// หาวันจันทร์ของสัปดาห์จากวันที่ใดๆ
const getMonday = (d) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

// --- Core Logic ---

// 1. Process Data: Group logs into Weeks & Identify Issues
const processedWeeks = computed(() => {
  if (allLogs.value.length === 0) return [];

  const weeksMap = new Map();

  // 1.1 Group Logs by Week (Key: Monday's Date String)
  allLogs.value.forEach(log => {
    const logDate = new Date(log.date);
    const monday = getMonday(logDate);
    const key = monday.toISOString().split('T')[0]; // YYYY-MM-DD of Monday

    if (!weeksMap.has(key)) {
      weeksMap.set(key, {
        startDate: monday,
        endDate: new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000), // Sunday
        logs: [],
        days: [] // Will be filled with Mon-Fri details
      });
    }
    weeksMap.get(key).logs.push(log);
  });

  // 1.2 Analyze each week
  const results = [];
  
  weeksMap.forEach((weekData, key) => {
    const daysAnalysis = [];
    let issueCount = 0;
    let absentCount = 0;
    let earlyLeaveCount = 0;

    // Loop Mon (0) to Fri (4) -> Date Loop
    for (let i = 0; i < 5; i++) {
      const currentDay = new Date(weekData.startDate);
      currentDay.setDate(weekData.startDate.getDate() + i);
      const dateStr = currentDay.toLocaleDateString('en-CA'); // YYYY-MM-DD
      
      // หา Log ของวันนี้
      const log = weekData.logs.find(l => l.date === dateStr);
      
      const dayInfo = {
        date: currentDay,
        dayName: currentDay.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: currentDay.getDate(),
        log: log || null,
        status: 'Normal', // Normal, Absent, EarlyLeave
        isToday: new Date().toDateString() === currentDay.toDateString()
      };

      // Check Status
      if (!log) {
        // ถ้าเป็นวันนี้หรือวันในอนาคต ยังไม่นับว่า Absent
        if (currentDay > new Date()) {
           dayInfo.status = 'Future';
        } else {
           dayInfo.status = 'Absent';
           absentCount++;
           issueCount++;
        }
      } else {
        if (timeToMinutes(log.end_time) < timeToMinutes('17:00')) {
          dayInfo.status = 'EarlyLeave';
          earlyLeaveCount++;
          issueCount++;
        }
      }

      daysAnalysis.push(dayInfo);
    }

    // Only add weeks that have issues (Absent or Early Leave)
    if (issueCount > 0) {
      results.push({
        key: key,
        startDate: weekData.startDate,
        endDate: weekData.endDate,
        days: daysAnalysis,
        stats: { absentCount, earlyLeaveCount }
      });
    }
  });

  // Sort by Date Descending (Newest week first)
  return results.sort((a, b) => b.startDate - a.startDate);
});

// --- Pagination ---
const totalPages = computed(() => Math.ceil(processedWeeks.value.length / itemsPerPage));

const paginatedWeeks = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return processedWeeks.value.slice(start, end);
});

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

// --- Fetch Data ---
const fetchData = async () => {
  isLoading.value = true;
  try {
    const response = await fetchUtils('/worklogs');
    if (response.status === 'success') {
      allLogs.value = response.data;
    }
  } catch (error) {
    toastRef.value?.addToast('Failed to load logs', 'error');
  } finally {
    setTimeout(() => { isLoading.value = false; }, 500);
  }
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="relative min-h-full pb-20">
    <ToastNotification ref="toastRef" />

    <main class="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      <header class="animate-fade-in flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 class="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            Insufficient Report
            <span v-if="!isLoading" class="text-sm font-semibold px-3 py-1 bg-rose-100 text-rose-600 rounded-full border border-rose-200">
               {{ processedWeeks.length }} Weeks Found
            </span>
          </h1>
          <p class="text-slate-500 mt-1">Weeks with absences or early leaves.</p>
        </div>
        
        <div v-if="!isLoading && processedWeeks.length > 0" class="flex items-center gap-2">
           <button 
             @click="changePage(currentPage - 1)" 
             :disabled="currentPage === 1"
             class="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-white hover:text-indigo-600 hover:shadow-sm disabled:opacity-40 disabled:hover:bg-transparent transition-all"
           >
             <svg class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
           </button>
           <span class="text-sm font-medium text-slate-600">Page {{ currentPage }} of {{ totalPages }}</span>
           <button 
             @click="changePage(currentPage + 1)" 
             :disabled="currentPage === totalPages"
             class="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-white hover:text-indigo-600 hover:shadow-sm disabled:opacity-40 disabled:hover:bg-transparent transition-all"
           >
             <svg class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" /></svg>
           </button>
        </div>
      </header>

      <section v-if="isLoading" class="space-y-6">
         <div v-for="i in 2" :key="i" class="h-64 bg-white rounded-3xl border border-slate-100 shadow-sm animate-pulse"></div>
      </section>

      <section v-else-if="processedWeeks.length === 0" class="py-20 flex flex-col items-center justify-center text-center">
         <div class="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center text-4xl mb-4 shadow-sm border border-emerald-100">
           🎉
         </div>
         <h2 class="text-xl font-bold text-slate-800">Excellent Work!</h2>
         <p class="text-slate-500 mt-2">No insufficient weeks found in your history.</p>
      </section>

      <section v-else class="space-y-8">
        
        <div 
          v-for="(week, idx) in paginatedWeeks" 
          :key="week.key"
          class="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-slide-up"
          :style="{ animationDelay: `${idx * 100}ms` }"
        >
          <div class="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
             <div class="flex items-center gap-3">
               <div class="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 shadow-sm">
                 🗓️
               </div>
               <div>
                 <h3 class="font-bold text-slate-800">
                   Week of {{ week.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }}
                 </h3>
                 <p class="text-xs text-slate-400">
                   {{ week.startDate.toLocaleDateString('en-CA') }} - {{ week.endDate.toLocaleDateString('en-CA') }}
                 </p>
               </div>
             </div>

             <div class="flex gap-2">
               <span v-if="week.stats.absentCount > 0" class="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold border border-rose-100">
                 <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                 {{ week.stats.absentCount }} Absent
               </span>
               <span v-if="week.stats.earlyLeaveCount > 0" class="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs font-bold border border-amber-100">
                 <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                 {{ week.stats.earlyLeaveCount }} Early Leave
               </span>
             </div>
          </div>

          <div class="divide-y divide-slate-50">
            <div 
              v-for="day in week.days" 
              :key="day.date"
              class="p-5 flex gap-4 transition-colors duration-200"
              :class="{
                'bg-rose-50/30': day.status === 'Absent',
                'bg-amber-50/30': day.status === 'EarlyLeave'
              }"
            >
              <div class="flex flex-col items-center min-w-[50px]">
                 <div class="text-xs font-bold uppercase text-slate-400 mb-0.5">{{ day.dayName }}</div>
                 <div class="text-lg font-bold text-slate-800">{{ day.dayNumber }}</div>
              </div>

              <div class="flex-1">
                 <div v-if="day.status === 'Absent'" class="flex items-center h-full text-rose-500">
                    <div class="flex items-center gap-2 px-3 py-1.5 bg-white border border-rose-100 rounded-xl shadow-sm">
                       <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                       <span class="text-sm font-bold">Absent / Missing Log</span>
                    </div>
                 </div>

                 <div v-else-if="day.status === 'Future'" class="flex items-center h-full text-slate-300 italic text-sm">
                    Pending...
                 </div>

                 <div v-else class="flex flex-col sm:flex-row gap-4 sm:items-center">
                    <div class="min-w-[100px]">
                       <div class="flex items-center gap-1.5">
                          <span class="text-sm font-bold text-slate-800">{{ day.log.start_time }}</span>
                          <span class="h-px w-3 bg-slate-300"></span>
                          <span class="text-sm font-bold" :class="day.status === 'EarlyLeave' ? 'text-amber-600' : 'text-slate-800'">{{ day.log.end_time }}</span>
                       </div>
                       <div v-if="day.status === 'EarlyLeave'" class="text-[10px] font-bold text-amber-600 mt-1 flex items-center gap-1">
                          ⚠️ Left early
                       </div>
                    </div>

                    <div class="flex-1">
                       <p class="text-sm text-slate-700 line-clamp-1">{{ day.log.content }}</p>
                    </div>

                    <div v-if="day.log.imageUrl" class="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                       <img :src="day.log.imageUrl" class="w-full h-full object-cover" />
                    </div>
                 </div>
              </div>
            </div>
          </div>
          
        </div>

        <div class="flex justify-center pt-4">
           <div class="flex items-center gap-1 bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
              <button 
               v-for="p in totalPages" 
               :key="p"
               @click="changePage(p)"
               class="w-8 h-8 rounded-xl text-sm font-bold transition-all flex items-center justify-center"
               :class="currentPage === p ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'"
              >
                {{ p }}
              </button>
           </div>
        </div>

      </section>

    </main>
  </div>
</template>

<style scoped>
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

.animate-fade-in { animation: fadeIn 0.6s ease-out forwards; }
.animate-slide-up { opacity: 0; animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
</style>