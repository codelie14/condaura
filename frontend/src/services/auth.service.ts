import api from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  department?: string;
  confirmPassword?: string;  // Used in form but not sent to API
}

// Les rôles disponibles dans l'application
export type UserRole = 'Admin' | 'Back office' | 'Front office' | 'DAO' | 'Digital Team';

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: UserRole | string;
  };
}

const AuthService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/users/login/', credentials);
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    // Adapt data format for backend
    const backendData = {
      email: data.email,
      password: data.password,
      password2: data.password,  // Backend expects password2 for confirmation
      first_name: data.first_name,
      last_name: data.last_name,
      department: data.department || '',
      // username and user_id will be auto-generated on backend
    };
    
    console.log('Sending registration data:', backendData);
    
    const response = await api.post<AuthResponse>('/users/register/', backendData);
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },

  getCurrentUser(): any {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post('/users/forgot-password/', { email });
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await api.post('/users/reset-password/', { token, password });
  }
};

export default AuthService; 