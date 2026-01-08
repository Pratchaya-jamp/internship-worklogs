<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { fetchUtils } from '@/utils/fetchUtils';
import ToastNotification from '@/components/ToastNotification.vue';

const router = useRouter();
const toastRef = ref(null);
const isLoading = ref(false);

const form = ref({
  username: '',
  email: '',
  firstname: '',
  lastname: '',
  password: '',
  confirmPassword: ''
});

const errors = ref({});

// --- Password Logic (เหมือนเดิม) ---
const pwdRequirements = computed(() => {
  const pwd = form.value.password;
  const confirm = form.value.confirmPassword;
  
  return {
    length: pwd.length >= 8,
    number: /[0-9]/.test(pwd),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    match: pwd && confirm && pwd === confirm
  };
});

const passwordStrength = computed(() => {
  const len = form.value.password.length;
  if (len === 0) return 0;
  if (len < 8) return 0;
  if (len < 12) return 1; // Weak
  if (len < 14) return 2; // Medium
  return 3; // Strong
});

const passwordStrengthLabel = computed(() => {
  const s = passwordStrength.value;
  if (s === 1) return 'Weak';
  if (s === 2) return 'Medium';
  if (s === 3) return 'Strong';
  return '';
});

// --- Validation & Submit (เหมือนเดิม) ---
const validate = () => {
  errors.value = {};
  let isValid = true;
  
  if (!form.value.username) { errors.value.username = 'Username is required'; isValid = false; }
  if (!form.value.email || !/^\S+@\S+\.\S+$/.test(form.value.email)) { errors.value.email = 'Valid email is required'; isValid = false; }
  if (!form.value.firstname) { errors.value.firstname = 'Required'; isValid = false; }
  if (!form.value.lastname) { errors.value.lastname = 'Required'; isValid = false; }
  
  const req = pwdRequirements.value;
  if (!req.length || !req.number || !req.special) {
    errors.value.password = 'Password does not meet requirements.';
    isValid = false;
  }
  if (!req.match) {
    errors.value.confirmPassword = 'Passwords do not match.';
    isValid = false;
  }

  return isValid;
};

const handleRegister = async () => {
  if (!validate()) {
    toastRef.value.addToast('Please fix the errors in the form.', 'warning');
    return;
  }
  
  isLoading.value = true;
  const payload = {
    username: form.value.username,
    email: form.value.email,
    password: form.value.password,
    firstname: form.value.firstname,
    lastname: form.value.lastname
  };

  try {
    await fetchUtils('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    toastRef.value.addToast('Registration successful! Redirecting...', 'success');
    setTimeout(() => { router.push('/login'); }, 1500);
  } catch (error) {
    toastRef.value.addToast(error.message || 'Registration failed', 'error');
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800 relative overflow-hidden font-sans py-10">
    <ToastNotification ref="toastRef" />

    <div class="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
    <div class="absolute bottom-0 left-0 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl"></div>

    <div class="w-full max-w-lg bg-white p-8 md:p-10 rounded-3xl shadow-2xl border border-slate-100 z-10 transition-all duration-500">
      
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Create Account</h1>
        <p class="text-slate-400 mt-2 text-sm">Join Project Worklogs today</p>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-5">
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Firstname</label>
            <input v-model="form.firstname" type="text" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-300 placeholder-slate-300" placeholder="Your Firstname" />
            <span v-if="errors.firstname" class="text-xs text-rose-500 mt-1 block">{{ errors.firstname }}</span>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Lastname</label>
            <input v-model="form.lastname" type="text" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-300 placeholder-slate-300" placeholder="Your Lastname" />
            <span v-if="errors.lastname" class="text-xs text-rose-500 mt-1 block">{{ errors.lastname }}</span>
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Username</label>
          <input v-model="form.username" type="text" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-300 placeholder-slate-300" placeholder="example123" />
          <span v-if="errors.username" class="text-xs text-rose-500 mt-1 block">{{ errors.username }}</span>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Email</label>
          <input v-model="form.email" type="email" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-300 placeholder-slate-300" placeholder="example@worklog.com" />
          <span v-if="errors.email" class="text-xs text-rose-500 mt-1 block">{{ errors.email }}</span>
        </div>

        <div class="p-5 bg-slate-50 rounded-2xl border border-slate-100 transition-all duration-500">
          
          <div>
            <div class="flex justify-between items-center mb-1">
              <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Password</label>
              <Transition name="fade">
                <span 
                  v-if="form.password"
                  class="text-xs font-bold transition-colors duration-300"
                  :class="{
                    'text-rose-500': passwordStrength === 1,
                    'text-amber-500': passwordStrength === 2,
                    'text-emerald-500': passwordStrength === 3
                  }"
                >
                  {{ passwordStrengthLabel }}
                </span>
              </Transition>
            </div>
            <input 
              v-model="form.password" 
              type="password" 
              class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-300 placeholder-slate-300"
              placeholder="••••••••"
            />
            
            <Transition name="expand">
              <div v-if="form.password" class="overflow-hidden">
                <div class="flex gap-1 h-1.5 mt-3 mb-1 rounded-full bg-slate-200">
                   <div class="flex-1 transition-all duration-500 ease-out" 
                        :class="passwordStrength >= 1 ? 'bg-rose-500 opacity-100' : 'bg-rose-500 opacity-30'"></div>
                   <div class="flex-1 transition-all duration-500 ease-out" 
                        :class="passwordStrength >= 2 ? 'bg-amber-500 opacity-100' : 'opacity-0'"></div>
                   <div class="flex-1 transition-all duration-500 ease-out" 
                        :class="passwordStrength >= 3 ? 'bg-emerald-500 opacity-100' : 'opacity-0'"></div>
                </div>
              </div>
            </Transition>
          </div>

          <div class="mt-4">
            <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Confirm Password</label>
            <input 
              v-model="form.confirmPassword" 
              type="password" 
              class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-300 placeholder-slate-300"
              :class="{'border-emerald-500 ring-2 ring-emerald-500/20': pwdRequirements.match && form.confirmPassword}"
              placeholder="••••••••"
            />
          </div>

          <Transition name="expand">
            <div v-if="form.password" class="overflow-hidden">
              <div class="pt-4 border-t border-slate-200/50 mt-4">
                <h4 class="text-xs text-slate-400 font-semibold mb-2">Requirements</h4>
                <div class="space-y-2 text-xs">
                  
                  <div class="flex items-center gap-2 transition-colors duration-300" :class="pwdRequirements.length ? 'text-emerald-600' : 'text-slate-400'">
                    <div class="w-4 h-4 rounded-full flex items-center justify-center border transition-all duration-300" :class="pwdRequirements.length ? 'bg-emerald-100 border-emerald-500' : 'border-slate-300'">
                      <svg v-if="pwdRequirements.length" class="w-2.5 h-2.5 text-emerald-600 animate-check-pop" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span>At least 8 characters</span>
                  </div>

                  <div class="flex items-center gap-2 transition-colors duration-300" :class="pwdRequirements.number ? 'text-emerald-600' : 'text-slate-400'">
                    <div class="w-4 h-4 rounded-full flex items-center justify-center border transition-all duration-300" :class="pwdRequirements.number ? 'bg-emerald-100 border-emerald-500' : 'border-slate-300'">
                      <svg v-if="pwdRequirements.number" class="w-2.5 h-2.5 text-emerald-600 animate-check-pop" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span>At least 1 number</span>
                  </div>

                  <div class="flex items-center gap-2 transition-colors duration-300" :class="pwdRequirements.special ? 'text-emerald-600' : 'text-slate-400'">
                     <div class="w-4 h-4 rounded-full flex items-center justify-center border transition-all duration-300" :class="pwdRequirements.special ? 'bg-emerald-100 border-emerald-500' : 'border-slate-300'">
                      <svg v-if="pwdRequirements.special" class="w-2.5 h-2.5 text-emerald-600 animate-check-pop" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span>At least 1 special char</span>
                  </div>

                  <div class="flex items-center gap-2 transition-colors duration-300" :class="pwdRequirements.match ? 'text-emerald-600' : 'text-slate-400'">
                     <div class="w-4 h-4 rounded-full flex items-center justify-center border transition-all duration-300" :class="pwdRequirements.match ? 'bg-emerald-100 border-emerald-500' : 'border-slate-300'">
                      <svg v-if="pwdRequirements.match" class="w-2.5 h-2.5 text-emerald-600 animate-check-pop" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span>Passwords match</span>
                  </div>

                </div>
              </div>
            </div>
          </Transition>

          <span v-if="errors.password || errors.confirmPassword" class="text-xs text-rose-500 block font-medium mt-2">Check requirements.</span>
        </div>

        <button type="submit" :disabled="isLoading" class="w-full py-3.5 bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 active:scale-98 transition-all duration-300 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
          <span v-if="isLoading" class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
          <span>{{ isLoading ? 'Creating Account...' : 'Sign Up' }}</span>
        </button>

      </form>

      <div class="mt-8 text-center">
        <p class="text-sm text-slate-400">Already have an account? <RouterLink to="/login" class="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">Log In</RouterLink></p>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* Keyframes for Check Icon Pop */
@keyframes checkPop {
  0% { transform: scale(0); }
  60% { transform: scale(1.4); }
  100% { transform: scale(1); }
}

.animate-check-pop {
  animation: checkPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

/* Expand Animation (Slide Down) */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  max-height: 500px; /* ค่าเผื่อไว้เยอะๆ */
  opacity: 1;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
  margin-top: 0; /* ดึง margin กลับตอนซ่อน */
}

/* Fade Animation for Text */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>