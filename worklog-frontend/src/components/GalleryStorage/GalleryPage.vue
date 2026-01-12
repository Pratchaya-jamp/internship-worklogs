<script setup>
import { ref, onMounted, onUnmounted } from 'vue'; // เพิ่ม onUnmounted
import { fetchUtils } from '@/utils/fetchUtils';
import ToastNotification from '@/components/ToastNotification.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';

const toastRef = ref(null);
const isLoading = ref(true);
const images = ref([]);

// --- Preview State (New) ---
const previewImage = ref(null);

// --- Upload & Delete State (เหมือนเดิม) ---
const isUploadModalOpen = ref(false);
const uploadFiles = ref([]);
const isUploading = ref(false);
const dragActive = ref(false);
const showDeleteModal = ref(false);
const itemToDelete = ref(null);
const isDeleting = ref(false);

// Helper Format Bytes
const formatBytes = (bytes, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

// --- Preview Logic (New) ---
const openPreview = (img) => {
  previewImage.value = img;
  document.body.style.overflow = 'hidden'; // ล็อก Scroll ไม่ให้เลื่อน
};

const closePreview = () => {
  previewImage.value = null;
  document.body.style.overflow = ''; // ปลดล็อก Scroll
};

// ปิด Preview เมื่อกด ESC
const handleKeydown = (e) => {
  if (e.key === 'Escape' && previewImage.value) closePreview();
};

onMounted(() => {
  fetchGallery();
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});

// --- Fetch, Download, Delete, Upload Logic (Code เดิมทั้งหมด) ---
const fetchGallery = async () => {
  isLoading.value = true;
  try {
    const response = await fetchUtils('/gallery');
    if (response.status === 'success') {
      images.value = response.data;
    } else {
      images.value = response.data || []; 
    }
  } catch (error) {
    toastRef.value.addToast('Failed to load gallery', 'error');
  } finally {
    isLoading.value = false;
  }
};

const handleDownload = async (img) => {
  try {
    toastRef.value.addToast('Downloading...', 'info');
    const BASE_URL = import.meta.env.VITE_API_URL;
    const response = await fetch(`${BASE_URL}/gallery/download/${img.filename}`, {
      method: 'GET',
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Download failed');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = img.originalName || img.filename; 
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toastRef.value.addToast('Download complete', 'success');
  } catch (error) {
    toastRef.value.addToast('Failed to download', 'error');
  }
};

const confirmDelete = (img) => {
  itemToDelete.value = img;
  showDeleteModal.value = true;
};

const handleDelete = async () => {
  if (!itemToDelete.value) return;
  isDeleting.value = true;
  try {
    await fetchUtils(`/gallery/${itemToDelete.value.id}`, { method: 'DELETE' });
    toastRef.value.addToast('Image deleted', 'success');
    images.value = images.value.filter(i => i.id !== itemToDelete.value.id);
  } catch (error) {
    toastRef.value.addToast('Failed to delete', 'error');
  } finally {
    isDeleting.value = false;
    showDeleteModal.value = false;
    itemToDelete.value = null;
  }
};

const onFileSelect = (event) => addFiles(Array.from(event.target.files));
const onDrop = (event) => { dragActive.value = false; addFiles(Array.from(event.dataTransfer.files)); };

const addFiles = (files) => {
  if (uploadFiles.value.length + files.length > 10) {
    toastRef.value.addToast('Max 10 files allowed', 'warning');
    return;
  }
  const validFiles = files.filter(file => file.size <= 5 * 1024 * 1024);
  if (validFiles.length !== files.length) toastRef.value.addToast('Some files skipped (>5MB)', 'warning');
  uploadFiles.value = [...uploadFiles.value, ...validFiles];
};

const removeUploadFile = (index) => uploadFiles.value.splice(index, 1);

const handleUpload = async () => {
  if (uploadFiles.value.length === 0) return;
  isUploading.value = true;
  try {
    const formData = new FormData();
    uploadFiles.value.forEach(file => formData.append('img', file));
    const BASE_URL = import.meta.env.VITE_API_URL;
    const response = await fetch(`${BASE_URL}/gallery/upload`, {
      method: 'POST', body: formData, credentials: 'include'
    });
    if (!response.ok) throw new Error('Upload failed');
    toastRef.value.addToast('Upload successful!', 'success');
    isUploadModalOpen.value = false;
    uploadFiles.value = [];
    fetchGallery();
  } catch (error) {
    toastRef.value.addToast('Upload failed', 'error');
  } finally {
    isUploading.value = false;
  }
};
</script>

<template>
  <div class="relative min-h-full pb-20">
    <ToastNotification ref="toastRef" />

    <ConfirmDialog 
      :isOpen="showDeleteModal"
      title="Delete Image?"
      message="Are you sure you want to delete this image? This cannot be undone."
      :isLoading="isDeleting"
      @confirm="handleDelete"
      @cancel="showDeleteModal = false"
    />

    <main class="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      <header class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 animate-fade-in">
        <div>
          <h1 class="text-3xl font-bold text-slate-900 tracking-tight">My Gallery</h1>
          <p class="text-slate-500 mt-1">Manage and store your memories.</p>
        </div>
        
        <button 
          @click="isUploadModalOpen = true"
          class="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-slate-900/20 hover:shadow-indigo-500/30 transition-all active:scale-95"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
          <span>Upload</span>
        </button>
      </header>

      <section>
        <div v-if="isLoading" class="grid grid-cols-2 md:grid-cols-4 gap-6 animate-pulse">
           <div v-for="i in 4" :key="i" class="aspect-square bg-slate-200 rounded-3xl"></div>
        </div>

        <div v-else-if="images.length === 0" class="py-20 flex flex-col items-center justify-center text-center">
           <div class="w-24 h-24 bg-indigo-50 text-indigo-500 rounded-3xl flex items-center justify-center mb-4">
             <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
           </div>
           <h2 class="text-lg font-bold text-slate-800">No images yet</h2>
           <p class="text-slate-400">Upload your first photo to get started.</p>
        </div>

        <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
           <div 
             v-for="(img, index) in images" 
             :key="img.id" 
             class="group relative aspect-[4/5] bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 animate-slide-up cursor-pointer"
             :style="{ animationDelay: `${index * 50}ms` }"
             @click="openPreview(img)" 
           >
              <img 
                :src="img.viewUrl" 
                :alt="img.originalName" 
                class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                loading="lazy"
              />
              
              <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <div class="absolute bottom-0 left-0 w-full p-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100 flex flex-col justify-end h-full">
                 <div class="mb-3">
                   <p class="text-white text-sm font-semibold truncate" :title="img.originalName">{{ img.originalName }}</p>
                   <p class="text-xs text-slate-300 font-medium">{{ formatBytes(img.size) }}</p>
                 </div>
                 
                 <div class="flex gap-2">
                   <button 
                     @click.stop="handleDownload(img)"
                     class="flex-1 py-2 bg-white/20 hover:bg-white text-white hover:text-indigo-600 backdrop-blur-md rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1"
                   >
                     <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0l-4 4m4-12v12"></path></svg>
                     Download
                   </button>
                   <button 
                     @click.stop="confirmDelete(img)"
                     class="p-2 bg-rose-500/80 hover:bg-rose-600 text-white backdrop-blur-md rounded-xl transition-colors"
                   >
                     <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                   </button>
                 </div>
              </div>
           </div>
        </div>
      </section>

      <Transition name="fade">
        <div v-if="previewImage" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-md" @click="closePreview">
          
          <button 
            @click="closePreview"
            class="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-20"
          >
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>

          <div class="relative w-full h-full p-4 flex items-center justify-center" @click.stop>
            <img 
              :src="previewImage.viewUrl" 
              class="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-scale-up" 
            />
          </div>

          <div class="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-end pointer-events-none">
            <div class="text-white pointer-events-auto">
               <h3 class="text-lg font-bold">{{ previewImage.originalName }}</h3>
               <p class="text-sm text-slate-300 opacity-80">{{ formatBytes(previewImage.size) }} • {{ new Date(previewImage.createdAt).toLocaleString() }}</p>
            </div>
            <button 
              @click.stop="handleDownload(previewImage)"
              class="pointer-events-auto px-6 py-2 bg-white text-slate-900 rounded-full font-bold hover:bg-indigo-500 hover:text-white transition-colors flex items-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0l-4 4m4-12v12"></path></svg>
              Download
            </button>
          </div>
        </div>
      </Transition>

      <Transition name="fade">
        <div v-if="isUploadModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="isUploadModalOpen = false"></div>
           <div class="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative z-10 animate-scale-up">
              <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 class="font-bold text-slate-800 text-lg">Upload Photos</h3>
                <button @click="isUploadModalOpen = false" class="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">✕</button>
              </div>
              <div class="p-6 space-y-4">
                 <div class="border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer" :class="dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'" @dragenter.prevent="dragActive = true" @dragleave.prevent="dragActive = false" @dragover.prevent @drop.prevent="onDrop" @click="$refs.fileInput.click()">
                    <input type="file" multiple ref="fileInput" class="hidden" accept="image/*" @change="onFileSelect" />
                    <div class="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-3">
                       <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                    </div>
                    <p class="text-sm font-semibold text-slate-700">Click or drag images here</p>
                 </div>
                 <div v-if="uploadFiles.length > 0" class="space-y-2 max-h-48 overflow-y-auto pr-1">
                    <div v-for="(file, i) in uploadFiles" :key="i" class="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                       <div class="flex items-center gap-3 overflow-hidden"><div class="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">IMG</div><p class="text-sm text-slate-700 truncate">{{ file.name }}</p></div>
                       <button @click="removeUploadFile(i)" class="text-slate-400 hover:text-rose-500 p-1">✕</button>
                    </div>
                 </div>
              </div>
              <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                 <button @click="isUploadModalOpen = false" class="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
                 <button @click="handleUpload" :disabled="isUploading || uploadFiles.length === 0" class="px-6 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-indigo-600 shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"><span v-if="isUploading" class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span><span>{{ isUploading ? 'Uploading...' : 'Upload' }}</span></button>
              </div>
           </div>
        </div>
      </Transition>
    </main>
  </div>
</template>

<style scoped>
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes scaleUp { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }

.animate-fade-in { animation: fadeIn 0.6s ease-out forwards; }
.animate-slide-up { opacity: 0; animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
.animate-scale-up { animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>