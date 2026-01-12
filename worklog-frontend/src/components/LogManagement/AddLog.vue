<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { fetchUtils } from '@/utils/fetchUtils'; // เราจะใช้ fetchUtils แบบปกติ แต่ต้องปรับนิดหน่อยสำหรับ FormData
import ToastNotification from '@/components/ToastNotification.vue';

const router = useRouter();
const toastRef = ref(null);
const isLoading = ref(false);

// Form Data
const form = ref({
  date: new Date().toISOString().split('T')[0], // Default Today
  weekNo: '',
  startTime: '08:00',
  endTime: '17:00',
  content: '',
  isAbsent: false
});

const selectedFile = ref(null);
const previewUrl = ref(null);

// --- Logic คำนวณ Week Number อัตโนมัติ ---
const getWeekNumber = (dateString) => {
  const date = new Date(dateString);
  const startDate = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date - startDate) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + 1) / 7);
};

// เมื่อวันที่เปลี่ยน ให้คำนวณ Week No ใหม่
watch(() => form.value.date, (newDate) => {
  if (newDate) {
    form.value.weekNo = getWeekNumber(newDate).toString();
  }
}, { immediate: true });

// --- File Handling ---
const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    if (file.size > 5 * 1024 * 1024) { // Limit 5MB
      toastRef.value.addToast('File too large (Max 5MB)', 'error');
      return;
    }
    selectedFile.value = file;
    // Create Preview URL
    previewUrl.value = URL.createObjectURL(file);
  }
};

const removeFile = () => {
  selectedFile.value = null;
  previewUrl.value = null;
};

// --- Submit ---
const handleSubmit = async () => {
  // Validate
  if (!form.value.date || !form.value.weekNo || !form.value.content) {
    toastRef.value.addToast('Please fill in required fields', 'warning');
    return;
  }
  if (!form.value.isAbsent && (!form.value.startTime || !form.value.endTime)) {
    toastRef.value.addToast('Please specify working hours', 'warning');
    return;
  }

  isLoading.value = true;

  try {
    // เตรียม FormData
    const formData = new FormData();
    formData.append('date', form.value.date);
    formData.append('weekNo', form.value.weekNo);
    formData.append('content', form.value.content);
    
    if (form.value.isAbsent) {
      formData.append('startTime', 'Absent');
      formData.append('endTime', ''); // ส่งว่างตามภาพ
    } else {
      formData.append('startTime', form.value.startTime);
      formData.append('endTime', form.value.endTime);
    }

    if (selectedFile.value) {
      formData.append('img', selectedFile.value);
    }

    // หมายเหตุ: fetchUtils เดิมเรา set Content-Type: application/json ไว้
    // แต่ถ้าส่ง FormData ต้องห้าม set Content-Type (Browser จะ set boundary ให้เอง)
    // เราจึงต้องใช้ fetch แบบ Raw หรือปรับ fetchUtils รองรับ
    // เพื่อความง่ายและชัวร์ ผมใช้ fetchUtils แต่ override headers
    
    // **Hack:** ส่ง headers เป็น null เพื่อให้ fetchUtils ลบ Content-Type Default ออก 
    // (ต้องไปแก้ fetchUtils นิดนึง หรือใช้ fetch ดิบตรงนี้เลยก็ได้)
    // ขอใช้ fetch ดิบตรงนี้เพื่อความชัวร์เรื่อง FormData Boundary ครับ
    
    const token = document.cookie.split('; ').find(row => row.startsWith('accessToken=')); // (ถ้า Token ไม่ได้ HttpOnly)
    // แต่เนื่องจากเราใช้ HttpOnly Cookie เราแค่ fetch(url, { credentials: 'include', body: formData }) ก็พอ

    const BASE_URL = import.meta.env.VITE_API_URL;
    const response = await fetch(`${BASE_URL}/worklogs`, {
      method: 'POST',
      body: formData,
      credentials: 'include', // ส่ง Cookie
    });

    if (!response.ok) {
       const err = await response.json().catch(() => ({}));
       throw new Error(err.message || 'Failed to create worklog');
    }

    toastRef.value.addToast('Worklog created successfully!', 'success');
    
    setTimeout(() => {
      router.push('/');
    }, 1000);

  } catch (error) {
    toastRef.value.addToast(error.message, 'error');
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-slate-50 relative pb-10">
    <ToastNotification ref="toastRef" />

    <nav class="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-4 flex items-center gap-4">
      <button @click="router.back()" class="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
      </button>
      <h1 class="text-xl font-bold text-slate-800">New Worklog</h1>
    </nav>

    <main class="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
      
      <form @submit.prevent="handleSubmit" class="space-y-6">
        
        <section class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
          <h2 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Timeline</h2>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1.5">Date</label>
              <input 
                v-model="form.date" 
                type="date" 
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              />
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1.5">Week No.</label>
              <input 
                v-model="form.weekNo" 
                type="text" 
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                placeholder="e.g. 1"
              />
            </div>
          </div>
        </section>

        <section class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4 transition-all duration-300" :class="{'ring-2 ring-rose-100': form.isAbsent}">
          <div class="flex justify-between items-center mb-2">
            <h2 class="text-sm font-bold text-slate-400 uppercase tracking-wider">Attendance</h2>
            
            <label class="flex items-center gap-3 cursor-pointer group">
              <span class="text-sm font-medium transition-colors" :class="form.isAbsent ? 'text-rose-500' : 'text-slate-500'">Mark as Absent</span>
              <div class="relative">
                <input type="checkbox" v-model="form.isAbsent" class="sr-only" />
                <div class="block w-12 h-7 rounded-full transition-colors duration-300" :class="form.isAbsent ? 'bg-rose-500' : 'bg-slate-200'"></div>
                <div class="absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform duration-300 shadow-sm" :class="form.isAbsent ? 'translate-x-5' : 'translate-x-0'"></div>
              </div>
            </label>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="relative">
              <label class="block text-sm font-semibold text-slate-700 mb-1.5">Start Time</label>
              <div class="relative">
                <input 
                  v-model="form.startTime" 
                  type="time" 
                  :disabled="form.isAbsent"
                  class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div v-if="form.isAbsent" class="absolute inset-0 flex items-center justify-center bg-slate-100/50 rounded-xl backdrop-blur-[1px]">
                  <span class="text-sm font-bold text-rose-500">Absent</span>
                </div>
              </div>
            </div>

            <div class="relative">
              <label class="block text-sm font-semibold text-slate-700 mb-1.5">End Time</label>
              <div class="relative">
                <input 
                  v-model="form.endTime" 
                  type="time" 
                  :disabled="form.isAbsent"
                  class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
                 <div v-if="form.isAbsent" class="absolute inset-0 flex items-center justify-center bg-slate-100/50 rounded-xl backdrop-blur-[1px]">
                  <span class="text-sm font-bold text-slate-400">-</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
          <h2 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Activity Details</h2>
          
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1.5">Work Description</label>
            <textarea 
              v-model="form.content" 
              rows="4" 
              class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-slate-400 resize-none"
              placeholder="What did you work on today?"
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1.5">Attachment (Optional)</label>
            
            <div class="mt-2">
              <label 
                v-if="!previewUrl"
                class="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:bg-slate-50 hover:border-indigo-400 transition-all group"
              >
                <div class="flex flex-col items-center justify-center pt-5 pb-6">
                  <div class="p-3 bg-indigo-50 text-indigo-500 rounded-full mb-3 group-hover:scale-110 transition-transform">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  </div>
                  <p class="mb-1 text-sm text-slate-500"><span class="font-semibold text-indigo-600">Click to upload</span> or drag and drop</p>
                  <p class="text-xs text-slate-400">PNG, JPG up to 5MB</p>
                </div>
                <input type="file" class="hidden" accept="image/*" @change="handleFileChange" />
              </label>

              <div v-else class="relative w-full h-56 rounded-2xl overflow-hidden border border-slate-200 group">
                <img :src="previewUrl" class="w-full h-full object-cover" />
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                  <button type="button" @click="removeFile" class="p-2 bg-white/20 text-white rounded-full hover:bg-rose-500 hover:text-white transition-all backdrop-blur-md">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div class="pt-4 pb-8">
          <button 
            type="submit" 
            :disabled="isLoading"
            class="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl hover:shadow-2xl hover:bg-indigo-600 active:scale-98 transition-all duration-300 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <span v-if="isLoading" class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
            <span>{{ isLoading ? 'Saving...' : 'Save Worklog' }}</span>
          </button>
        </div>

      </form>
    </main>
  </div>
</template>

<style scoped>
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
</style>