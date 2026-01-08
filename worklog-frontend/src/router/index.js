import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/components/Authentication/Login.vue'
import Register from '@/components/Authentication/Register.vue'
import HomePage from '@/components/MainPage/HomePage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'HomePage',
      component: HomePage,
      meta: { requiresAuth: true }
    },
    {
      path: '/login',
      name: 'Login',
      component: Login,
      meta: { guestOnly: true }
    },
    {
      path: '/register',
      name: 'Register',
      component: Register,
      meta: { guestOnly: true }
    },
  ],
})

router.beforeEach((to, from, next) => {
  // ตรวจสอบสถานะคร่าวๆ จาก localStorage (ตั้งค่าตอน Login success)
  const isAuthenticated = localStorage.getItem('isLoggedIn') === 'true';

  if (to.meta.requiresAuth && !isAuthenticated) {
    // ถ้าจะเข้าหน้า Home แต่ยังไม่ Login -> ดีดไป Login
    next({ name: 'Login' });
  } else if (to.meta.guestOnly && isAuthenticated) {
    // ถ้า Login แล้ว แต่อยากเข้า Login/Register -> ดีดกลับไป Home
    next({ name: 'HomePage' });
  } else {
    // กรณีปกติ
    next();
  }
})

export default router
