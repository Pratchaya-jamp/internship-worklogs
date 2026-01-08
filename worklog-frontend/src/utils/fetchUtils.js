const BASE_URL = import.meta.env.VITE_API_URL;

// Helper สำหรับจัดการเมื่อ Session หมดอายุจริงๆ (Refresh ไม่ผ่าน)
const handleSessionExpired = () => {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('userData'); // เผื่อมีเก็บไว้
  // Redirect ไปหน้า Login
  window.location.href = '/login'; 
};

export const fetchUtils = async (endpoint, options = {}) => {
  // สร้าง URL เต็ม
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  
  // Config มาตรฐาน
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    // สำคัญ! เพื่อให้ส่ง Cookie (Access/Refresh Token) ไปด้วย
    credentials: 'include', 
  };

  try {
    // 1. ยิง Request รอบแรก
    let response = await fetch(url, config);

    // 2. ถ้าเจอ 401 (Access Token น่าจะหมดอายุ)
    if (response.status === 401) {
      
      // ป้องกัน Loop: ถ้า Endpoint ที่ Error ดันเป็นตัว /auth/refresh เอง แสดงว่าแก้ไม่ได้แล้ว
      if (endpoint.includes('/auth/refresh')) {
        handleSessionExpired();
        throw new Error('Session expired');
      }

      try {
        // 3. พยายามขอ Access Token ใหม่
        console.log('Access Token expired, attempting to refresh...');
        
        const refreshResponse = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include' // ส่ง Refresh Token Cookie ไป
        });

        if (refreshResponse.ok) {
          // 4. Refresh สำเร็จ! (Server set cookie ใหม่แล้ว) -> ยิง Request เดิมซ้ำ
          console.log('Token refreshed, retrying original request...');
          response = await fetch(url, config);
        } else {
          // 5. Refresh ไม่ผ่าน (Refresh Token หมดอายุ/หาย) -> ไป Login
          console.warn('Refresh token invalid or expired.');
          handleSessionExpired();
          // สร้าง Error ปลอมเพื่อจบ process
          const error = await refreshResponse.json().catch(() => ({})); 
          throw new Error(error.message || 'Session expired, please login again.');
        }

      } catch (refreshError) {
        // กรณี Network Error ตอน Refresh หรืออื่นๆ
        handleSessionExpired();
        throw refreshError;
      }
    }

    // --- ตรวจสอบ Response ปกติ (หลังผ่านการ Retry มาแล้ว หรือผ่านตั้งแต่รอบแรก) ---
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }

    if (response.status === 204) {
      return null;
    }

    return await response.json();

  } catch (error) {
    throw error;
  }
};