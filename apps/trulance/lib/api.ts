import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.peptly.in/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined'
    ? (Cookies.get('tl_access_token') || localStorage.getItem('tl_access_token'))
    : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = Cookies.get('tl_refresh_token') || localStorage.getItem('tl_refresh_token');
        if (!refreshToken) throw new Error('No refresh token');
        const { data } = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
        Cookies.set('tl_access_token', data.accessToken, { expires: 7 });
        if (typeof window !== 'undefined') localStorage.setItem('tl_access_token', data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        Cookies.remove('tl_access_token');
        Cookies.remove('tl_refresh_token');
        if (typeof window !== 'undefined') {
          localStorage.removeItem('tl_access_token');
          localStorage.removeItem('tl_refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Public TruLancer APIs
export const trulanceAPI = {
  getProjects: (params?: any) => api.get('/trulance/projects', { params }),
  getProject: (id: string) => api.get(`/trulance/projects/${id}`),
  getFreelancers: (params?: any) => api.get('/trulance/freelancers', { params }),
  getFreelancer: (id: string) => api.get(`/trulance/freelancers/${id}`),
};

// Auth
export const authAPI = {
  login: (data: any) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
};

// Freelance (auth required)
export const freelanceAPI = {
  postProject: (data: any) => api.post('/freelance', data),
  apply: (id: string) => api.post(`/freelance/${id}/apply`),
  myProjects: () => api.get('/freelance/my'),
  updateProject: (id: string, data: any) => api.patch(`/freelance/${id}`, data),
};
