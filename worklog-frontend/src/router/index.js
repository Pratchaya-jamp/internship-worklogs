import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/components/Authentication/Login.vue'
import Register from '@/components/Authentication/Register.vue'
import HomePage from '@/components/MainPage/HomePage.vue'
import WeekProgress from '@/components/MainPage/WeekProgress.vue'
import Insufficient from '@/components/MainPage/Insufficient.vue'
import AddLog from '@/components/LogManagement/AddLog.vue'
import EditLog from '@/components/LogManagement/EditLog.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'HomePage',
      component: HomePage,
      meta: { requiresAuth: true, title: 'Login' }
    },
    {
      path: '/login',
      name: 'Login',
      component: Login,
      meta: { guestOnly: true, title: 'Register' }
    },
    {
      path: '/register',
      name: 'Register',
      component: Register,
      meta: { guestOnly: true, title: 'Dashboard' }
    },
    {
      path: '/this-week',
      name: 'WeekProgress',
      component: WeekProgress,
      meta: { requiresAuth: true, title: 'Weekly Progress' }
    },
    {
      path: '/insufficient',
      name: 'Insufficient',
      component: Insufficient,
      meta: { requiresAuth: true, title: 'Insufficient Report' }
    },
    {
      path: '/newLog',
      name: 'AddLog',
      component: AddLog,
      meta: { requiresAuth: true, title: 'New Worklog' }
    },
    {
      path: '/log/:id/edit',
      name: 'EditLog',
      component: EditLog,
      meta: { requiresAuth: true, title: 'Edit Worklog' }
    },
  ],
})

const DEFAULT_TITLE = 'Worklogs Internship'; // ชื่อ App หลัก

router.beforeEach((to, from, next) => {
  // --- 1. ส่วนจัดการ Title ---
  // เช็คว่า Route ปลายทางมี meta.title ไหม
  if (to.meta.title) {
    document.title = `${to.meta.title} | ${DEFAULT_TITLE}`; 
    // ผลลัพธ์: "Dashboard | Project Worklogs"
  } else {
    document.title = DEFAULT_TITLE;
  }

  // --- 2. ส่วนจัดการ Auth (Logic เดิมของคุณ) ---
  const isAuthenticated = localStorage.getItem('isLoggedIn') === 'true';

  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'Login' });
  } else if (to.meta.guestOnly && isAuthenticated) {
    next({ name: 'HomePage' });
  } else {
    next();
  }
})

export default router
