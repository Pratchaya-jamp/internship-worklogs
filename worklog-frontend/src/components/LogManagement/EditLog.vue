<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { fetchUtils } from '@/utils/fetchUtils';
import ToastNotification from '@/components/ToastNotification.vue';

const route = useRoute();
const router = useRouter();
const toastRef = ref(null);
const isLoading = ref(false);
const isFetching = ref(true);

// State เก็บข้อมูล
const form = ref({
  date: '',
  weekNo: '',
  startTime: '',
  endTime: '',
  content: '',
  isAbsent: false,
  originalImgUrl: null // เก็บ URL รูปเดิมไว้โชว์
});

// เก็บ Snapshot ข้อมูลเริ่มต้นเอาไว้เทียบ (JSON String)
const originalData = ref(null);

// สำหรับรูปภาพใหม่ (ถ้ามีการเปลี่ยน)
const selectedFile = ref(null);
const previewUrl = ref(null);

// --- Fetch Data on Mount ---
const fetchLogData = async () => {
  try {
    const { id } = route.params;
    const response = await fetchUtils(`/worklogs/${id}`); // Assumes GET /api/worklogs/:id exists
    const data = response.data || response;

    // Map Data เข้า Form
    form.value = {
      date: data.date,
      weekNo: data.week_no,
      content: data.content,
      startTime: data.start_time,
      endTime: data.end_time,
      // เช็ค Logic Absent: ถ้า startTime = 'Absent' หรือ endTime ว่าง/0
      isAbsent: data.start_time === 'Absent' || !data.end_time,
      originalImgUrl: data.imageUrl
    };

    // เก็บค่าตั้งต้นไว้เปรียบเทียบ
    originalData.value = JSON.stringify(form.value);
  } catch (error) {
    toastRef.value.addToast('Failed to load log details', 'error');
    setTimeout(() => router.push('/'), 1500);
  } finally {
    isFetching.value = false;
  }
};

// --- Dirty Check Logic ---
const isModified = computed(() => {
  if (!originalData.value) return false;
  
  // 1. เช็คว่ามีการเลือกไฟล์รูปใหม่ไหม?
  if (selectedFile.value) return true;

  // 2. เช็คข้อมูล Text
  const currentData = JSON.stringify({
    date: form.value.date,
    weekNo: form.value.weekNo,
    content: form.value.content,
    startTime: form.value.startTime,
    endTime: form.value.endTime,
    isAbsent: form.value.isAbsent,
    originalImgUrl: form.value.originalImgUrl
  });

  return currentData !== originalData.value;
});

// --- Logic อื่นๆ (เหมือน AddLogView) ---
const getWeekNumber = (dateString) => {
  const date = new Date(dateString);
  const startDate = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date - startDate) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + 1) / 7);
};

watch(() => form.value.date, (newDate) => {
  if (newDate) form.value.weekNo = getWeekNumber(newDate).toString();
});

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      toastRef.value.addToast('File too large (Max 5MB)', 'error');
      return;
    }
    selectedFile.value = file;
    previewUrl.value = URL.createObjectURL(file);
  }
};

const removeFile = () => {
  selectedFile.value = null;
  previewUrl.value = null;
};

// --- Submit (PUT) ---
const handleUpdate = async () => {
  if (!isModified.value) return; // กันไว้เผื่อ

  isLoading.value = true;
  try {
    const formData = new FormData();
    formData.append('date', form.value.date);
    formData.append('weekNo', form.value.weekNo);
    formData.append('content', form.value.content);
    
    if (form.value.isAbsent) {
      formData.append('startTime', 'Absent');
      formData.append('endTime', '');
    } else {
      formData.append('startTime', form.value.startTime);
      formData.append('endTime', form.value.endTime);
    }

    // ส่งรูปเฉพาะถ้ามีการเลือกใหม่
    if (selectedFile.value) {
      formData.append('img', selectedFile.value);
    }

    const { id } = route.params;
    const BASE_URL = import.meta.env.VITE_API_URL;
    
    // ใช้ fetch ดิบสำหรับ FormData (หรือ fetchUtils แบบ override headers)
    const response = await fetch(`${BASE_URL}/worklogs/${id}`, {
      method: 'PUT',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) throw new Error('Failed to update');

    toastRef.value.addToast('Log updated successfully!', 'success');
    
    // Update snapshot ใหม่
    originalData.value = JSON.stringify(form.value);
    selectedFile.value = null; // Reset file input

    setTimeout(() => router.push('/'), 1000);

  } catch (error) {
    toastRef.value.addToast(error.message || 'Update failed', 'error');
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchLogData();
});
</script>

<template>
  <div class="min-h-screen bg-slate-50 relative pb-10">
    <ToastNotification ref="toastRef" />

    <nav class="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-4 flex items-center gap-4">
      <button @click="router.back()" class="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
      </button>
      <h1 class="text-xl font-bold text-slate-800">Edit Worklog</h1>
    </nav>

    <div v-if="isFetching" class="flex justify-center items-center h-64">
       <div class="animate-spin h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
    </div>

    <main v-else class="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
      <form @submit.prevent="handleUpdate" class="space-y-6">
        
        <section class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1.5">Date</label>
              <input v-model="form.date" type="date" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1.5">Week No.</label>
              <input v-model="form.weekNo" type="text" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
            </div>
          </div>
        </section>

        <section class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4" :class="{'ring-2 ring-rose-100': form.isAbsent}">
          <div class="flex justify-between items-center mb-2">
            <h2 class="text-sm font-bold text-slate-400 uppercase tracking-wider">Attendance</h2>
            <label class="flex items-center gap-3 cursor-pointer">
              <span class="text-sm font-medium" :class="form.isAbsent ? 'text-rose-500' : 'text-slate-500'">Mark as Absent</span>
              <input type="checkbox" v-model="form.isAbsent" class="w-5 h-5 rounded text-rose-500 focus:ring-rose-500" />
            </label>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="relative">
              <label class="block text-sm font-semibold text-slate-700 mb-1.5">Start Time</label>
              <input v-model="form.startTime" type="time" :disabled="form.isAbsent" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50" />
            </div>
            <div class="relative">
              <label class="block text-sm font-semibold text-slate-700 mb-1.5">End Time</label>
              <input v-model="form.endTime" type="time" :disabled="form.isAbsent" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50" />
            </div>
          </div>
        </section>

        <section class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1.5">Work Description</label>
            <textarea v-model="form.content" rows="4" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"></textarea>
          </div>

          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1.5">Attachment</label>
            <div class="mt-2">
              <div v-if="previewUrl" class="relative w-full h-56 rounded-2xl overflow-hidden border border-slate-200 group">
                <img :src="previewUrl" class="w-full h-full object-cover" />
                <button type="button" @click="removeFile" class="absolute top-2 right-2 p-2 bg-rose-500 text-white rounded-full shadow-lg">✕</button>
                <div class="absolute bottom-2 left-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded">New Image</div>
              </div>

              <div v-else-if="form.originalImgUrl" class="relative w-full h-56 rounded-2xl overflow-hidden border border-slate-200 group">
                <img :src="form.originalImgUrl" class="w-full h-full object-cover opacity-80" />
                 <div class="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                    <label class="cursor-pointer px-4 py-2 bg-white/90 rounded-xl text-sm font-bold hover:bg-white transition-all shadow-lg">
                      Change Image
                      <input type="file" class="hidden" accept="image/*" @change="handleFileChange" />
                    </label>
                 </div>
                 <div class="absolute bottom-2 left-2 bg-slate-800 text-white text-xs px-2 py-1 rounded">Current Image</div>
              </div>

              <label v-else class="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:bg-slate-50 hover:border-indigo-400 transition-all">
                  <div class="flex flex-col items-center justify-center pt-5 pb-6 text-slate-400">
                    <svg class="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                    <p class="text-sm">Upload Image</p>
                  </div>
                  <input type="file" class="hidden" accept="image/*" @change="handleFileChange" />
              </label>
            </div>
          </div>
        </section>

        <div class="pt-4 pb-8">
          <button 
            type="submit" 
            :disabled="isLoading || !isModified"
            class="w-full py-4 rounded-2xl font-bold shadow-xl transition-all duration-300 flex justify-center items-center gap-2"
            :class="isModified 
              ? 'bg-slate-900 text-white hover:bg-indigo-600 hover:shadow-2xl active:scale-98 cursor-pointer' 
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'"
          >
            <span v-if="isLoading" class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
            <span>{{ isLoading ? 'Saving...' : (isModified ? 'Save Changes' : 'No Changes') }}</span>
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