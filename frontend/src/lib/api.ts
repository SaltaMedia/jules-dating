import axios from 'axios';

// Create axios instance with base configuration
// Use relative URLs so Next.js rewrite rules can handle proxying
const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('API Request with token:', token.substring(0, 20) + '...');
    } else {
      console.log('API Request without token');
    }
  }
  
  // Debug logging for the actual request URL
  console.log('🚨 DEBUG: Axios request config:', {
    method: config.method,
    url: config.url,
    baseURL: config.baseURL,
    fullUrl: (config.baseURL || '') + (config.url || '')
  });
  
  return config;
});

// API client with typed methods
export const apiClient = {
  // Generic methods
  get: (url: string) => api.get(url),
  post: (url: string, data?: any, config?: any) => api.post(url, data, config),
  put: (url: string, data?: any, config?: any) => api.put(url, data, config),
  delete: (url: string) => api.delete(url),

  // Chat endpoints
  chat: {
    send: (message: string, context: any[] = [], userId?: string) => {
      console.log('🚨 DEBUG: Making API call to /api/chat with:', {
        message: message.substring(0, 50) + '...',
        contextLength: context.length,
        userId,
        baseURL: api.defaults.baseURL
      });
      return api.post('/api/chat', { message, context, userId });
    },
    sendWithImage: (message: string, imageFile: File, context: any[] = [], userId?: string) => {
      console.log('🚨 DEBUG: sendWithImage called with:', {
        message,
        imageFile: {
          name: imageFile.name,
          size: imageFile.size,
          type: imageFile.type
        },
        contextLength: context.length,
        userId
      });
      
      const formData = new FormData();
      formData.append('message', message);
      formData.append('image', imageFile);
      formData.append('context', JSON.stringify(context));
      if (userId) formData.append('userId', userId);
      
      console.log('🚨 DEBUG: FormData entries:');
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }
      
      return api.post('/api/chat/with-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    ...(process.env.NODE_ENV === 'development' && {
      sendTest: (message: string, context: any[] = [], userId?: string) => {
        console.log('DEBUG: Frontend making request to /api/chat/test (DEV ONLY)');
        console.log('DEBUG: Message:', message);
        console.log('DEBUG: Context:', context);
        return api.post('/api/chat/test', { message, context, userId });
      },
    }),
  },

  // Wardrobe endpoints
  wardrobe: {
    updateTags: (itemId: string, tags: any) => 
      api.put(`/api/wardrobe/${itemId}`, { tags }),
    getItem: (itemId: string) => 
      api.get(`/api/wardrobe/${itemId}`),
    getAllItems: () => 
      api.get('/api/wardrobe'),
  },

  // Auth endpoints
  auth: {
    login: (credentials: any) => 
      api.post('/api/auth/login', credentials),
    register: (userData: any) => 
      api.post('/api/auth/register', userData),
    logout: () => 
      api.post('/api/auth/logout'),
  },

  // Wishlist endpoints
  wishlist: {
    add: (item: any) => 
      api.post('/api/wishlist', item),
    getAll: () => 
      api.get('/api/wishlist'),
  },

  // Inspiration endpoints
  inspiration: {
    getImages: (message: string, context: any[] = [], userId?: string) => 
      api.post('/api/inspiration/test', { message, context, userId }),
    getMoreImages: (message: string, context: any[] = [], existingImages: any[] = [], userId?: string) => 
      api.post('/api/inspiration/show-more', { message, context, existingImages, userId }),
  },

  // Products endpoints
  products: {
    search: (message: string, conversation: any[] = []) => 
      api.post('/api/products/test', { message, conversation }),
  },

  // Community endpoints
  community: {
    // Posts
    createPost: (postData: any) => 
      api.post('/api/community/posts', postData),
    getFeed: (page: number = 1, limit: number = 10) => 
      api.get(`/api/community/feed?page=${page}&limit=${limit}`),
    getPost: (postId: string) => 
      api.get(`/api/community/posts/${postId}`),
    updatePost: (postId: string, updateData: any) => 
      api.put(`/api/community/posts/${postId}`, updateData),
    deletePost: (postId: string) => 
      api.delete(`/api/community/posts/${postId}`),
    getUserPosts: (page: number = 1, limit: number = 10) => 
      api.get(`/api/community/my-posts?page=${page}&limit=${limit}`),
    getPostsByTag: (tag: string, page: number = 1, limit: number = 10) => 
      api.get(`/api/community/tag/${tag}?page=${page}&limit=${limit}`),
    
    // Interactions
    likePost: (postId: string) => 
      api.post(`/api/community/posts/${postId}/likes`),
    addComment: (postId: string, text: string) => 
      api.post(`/api/community/posts/${postId}/comments`, { text }),
  },

  // Fit check endpoints
  fitChecks: {
    submitFitCheck: (data: { imageUrl: string; eventContext?: string; specificQuestion?: string; analysis?: string }) => 
      api.post('/api/fit-check/submit', data),
    getHistory: () => 
      api.get('/api/fit-check/history'),
    getFitCheck: (id: string) => 
      api.get(`/api/fit-check/${id}`),
    updateResponse: (id: string, response: string) => 
      api.put(`/api/fit-check/${id}/response`, { response }),
    deleteFitCheck: (id: string) => 
      api.delete(`/api/fit-check/${id}`),
    updateNotes: (id: string, notes: string) => 
      api.put(`/api/fit-check/${id}/notes`, { notes }),
  },
};

export default api;
