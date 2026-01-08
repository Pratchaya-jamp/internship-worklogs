<script setup>
import { ref, computed, onMounted } from 'vue';
import { fetchUtils } from '@/utils/fetchUtils';
import ToastNotification from '@/components/ToastNotification.vue';

// --- Import Chart.js ---
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';

// Register Chart.js Components
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const toastRef = ref(null);
const isLoading = ref(true);
const allLogs = ref([]);

// --- Helper Functions (เหมือนเดิม) ---
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

// ปรับให้ Return เป็นทศนิยมเพื่อใช้ใน Chart (เช่น 1.5 ชม.)
const minutesToHours = (mins) => parseFloat((mins / 60).toFixed(2));

const getWeekRange = () => {
  const now = new Date();
  const day = now.getDay(); 
  const diffToMon = (day + 6) % 7; 
  
  const start = new Date(now);
  start.setDate(now.getDate() - diffToMon);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

// --- Core Logic ---
const thisWeekLogs = computed(() => {
  const { start, end } = getWeekRange();
  return allLogs.value.filter(log => {
    const logDate = new Date(log.date);
    logDate.setHours(12, 0, 0, 0); 
    return logDate >= start && logDate <= end;
  });
});

const weeklyData = computed(() => {
  const { start } = getWeekRange();
  const days = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dateStr = d.toLocaleDateString('en-CA');
    
    const dailyLogs = thisWeekLogs.value.filter(l => l.date === dateStr);
    
    let totalMins = 0;
    dailyLogs.forEach(l => {
      const s = timeToMinutes(l.start_time);
      const e = timeToMinutes(l.end_time);
      if (e > s) totalMins += (e - s);
    });

    days.push({
      date: dateStr,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }), // Mon
      dayNumber: d.getDate(),
      isToday: new Date().toDateString() === d.toDateString(),
      logs: dailyLogs,
      totalMinutes: totalMins,
      totalHours: minutesToHours(totalMins) // เพิ่มค่านี้มาเพื่อใช้กับ Chart
    });
  }
  return days;
});

// --- CHART CONFIGURATION ---

const chartData = computed(() => {
  return {
    labels: weeklyData.value.map(d => `${d.dayName} ${d.dayNumber}`),
    datasets: [{
      label: 'Hours Worked',
      data: weeklyData.value.map(d => d.totalHours),
      // Logic สี: ถ้าเป็นวันนี้ใช้สี Indigo (#6366f1), วันอื่นใช้สีเทา (#cbd5e1)
      backgroundColor: weeklyData.value.map(d => d.isToday ? '#6366f1' : '#cbd5e1'),
      borderRadius: 6, // หัวมน
      barThickness: 40, // ความกว้างแท่ง
      borderSkipped: false,
    }]
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }, // ซ่อน Legend
    tooltip: {
      backgroundColor: '#1e293b',
      padding: 10,
      cornerRadius: 8,
      callbacks: {
        // Format Tooltip ให้สวยงาม: "4.5h"
        label: (context) => `${context.raw} hrs`
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      border: { display: false },
      grid: {
        color: '#f1f5f9', // เส้น Grid สีจางๆ
        borderDash: [5, 5] // เส้นประ
      },
      ticks: {
        font: { size: 10 },
        color: '#94a3b8',
        callback: (value) => `${value}h` // ใส่หน่วย h ที่แกน Y
      }
    },
    x: {
      border: { display: false },
      grid: { display: false }, // ซ่อนเส้น Grid แนวตั้ง
      ticks: {
        font: { size: 11, weight: 'bold' },
        color: (context) => {
          // ทำให้ตัวหนังสือของ "วันนี้" เป็นสีเข้ม
          const index = context.index;
          return weeklyData.value[index]?.isToday ? '#4f46e5' : '#64748b';
        }
      }
    }
  },
  animation: {
    duration: 1000,
    easing: 'easeOutQuart'
  }
};

// --- Stats Logic & Fetch ---
const weekStats = computed(() => {
  let totalMins = 0;
  let activeDays = 0;
  weeklyData.value.forEach(d => {
    totalMins += d.totalMinutes;
    if (d.totalMinutes > 0) activeDays++;
  });
  
  // Helper แปลงกลับเป็น xh ym สำหรับโชว์ text
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  const displayTime = `${h}h ${m > 0 ? m + 'm' : ''}`;

  return {
    totalTime: displayTime,
    activeDays: activeDays,
    logCount: thisWeekLogs.value.length
  };
});

const fetchData = async () => {
  isLoading.value = true;
  try {
    const response = await fetchUtils('/worklogs');
    if (response.status === 'success') allLogs.value = response.data;
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

    <main class="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      <header class="animate-fade-in">
        <h1 class="text-3xl font-bold text-slate-900 tracking-tight">Week Progress</h1>
        <p class="text-slate-500 mt-1">Detailed activity analysis.</p>
      </header>

      <div v-if="!isLoading" class="grid grid-cols-3 gap-4 animate-slide-up" style="animation-delay: 100ms;">
        <div class="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center gap-1">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Time</span>
          <span class="text-2xl font-bold text-indigo-600">{{ weekStats.totalTime }}</span>
        </div>
        <div class="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center gap-1">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Days</span>
          <span class="text-2xl font-bold text-emerald-600">{{ weekStats.activeDays }} <span class="text-sm text-slate-400">/ 5</span></span>
        </div>
        <div class="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center gap-1">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Logs</span>
          <span class="text-2xl font-bold text-slate-800">{{ weekStats.logCount }}</span>
        </div>
      </div>

      <section class="bg-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 animate-slide-up" style="animation-delay: 200ms;">
        <h2 class="text-lg font-bold text-slate-800 mb-6">Activity Chart</h2>
        
        <div class="relative h-64 w-full">
          <div v-if="isLoading" class="h-full flex items-end justify-between gap-4 animate-pulse">
             <div v-for="i in 7" :key="i" class="w-full bg-slate-100 rounded-t-xl" :style="{ height: `${Math.random() * 80 + 20}%` }"></div>
          </div>
          
          <Bar v-else :data="chartData" :options="chartOptions" />
        </div>
      </section>

      <section class="space-y-6">
        <h2 class="text-lg font-bold text-slate-800 pl-2">Daily Breakdown</h2>
        <div v-if="!isLoading" class="space-y-6">
          <div v-for="(day, index) in weeklyData" :key="day.date" class="relative">
             <div v-if="index !== 6" class="absolute left-6 top-10 bottom-[-24px] w-px bg-slate-200"></div>
             <div class="flex gap-6">
               <div class="flex flex-col items-center min-w-[50px]">
                 <div class="w-12 h-12 rounded-2xl flex flex-col items-center justify-center border shadow-sm z-10 transition-colors" :class="day.isToday ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-200' : 'bg-white text-slate-600 border-slate-200'">
                   <span class="text-[10px] font-bold uppercase leading-none">{{ day.dayName }}</span>
                   <span class="text-lg font-bold leading-none mt-0.5">{{ day.dayNumber }}</span>
                 </div>
               </div>
               <div class="flex-1 pb-2">
                 <div v-if="day.totalMinutes === 0" class="py-3 pl-1 flex items-center gap-2 text-sm text-slate-400 italic">
                   <span class="w-2 h-2 rounded-full bg-slate-300"></span><span>Absent / No activity</span>
                 </div>
                 <div v-else class="space-y-3">
                    <div v-for="log in day.logs" :key="log.id" class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex gap-4 items-start">
                      <div class="mt-1 min-w-[60px] text-center">
                         <div class="text-xs font-bold text-slate-800">{{ log.start_time }}</div>
                         <div class="text-[10px] text-slate-400">to {{ log.end_time }}</div>
                      </div>
                      <div class="h-8 w-px bg-slate-100"></div>
                      <div class="flex-1">
                        <p class="text-sm font-semibold text-slate-800">{{ log.content }}</p>
                         <div class="flex items-center gap-2 mt-1.5">
                            <span v-if="timeToMinutes(log.end_time) < timeToMinutes('17:00')" class="text-[10px] font-bold px-2 py-0.5 bg-rose-50 text-rose-600 rounded">Early Leave</span>
                            <span v-else class="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded">Completed</span>
                         </div>
                      </div>
                      <div v-if="log.imageUrl" class="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                         <img :src="log.imageUrl" class="w-full h-full object-cover" />
                      </div>
                    </div>
                 </div>
               </div>
             </div>
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