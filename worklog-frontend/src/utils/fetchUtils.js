const BASE_URL = import.meta.env.VITE_API_URL;

export const fetchUtils = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
    // สำคัญมาก! เพื่อให้ Browser ส่ง/รับ HttpOnly Cookie
    credentials: 'include', 
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
        // กรณี Token หมดอายุ หรือ 401 อาจจะดักที่นี่เพื่อ Redirect ไป Login
        if (response.status === 401) {
            window.location.href = '/login'; 
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Something went wrong');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};