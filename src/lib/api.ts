// API Client for FacilityGuard SaaS
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'http://34.220.120.69/api' 
  : 'http://localhost:3000/api';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('facilityguard_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('facilityguard_token', token);
      } else {
        localStorage.removeItem('facilityguard_token');
      }
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = this.baseURL + endpoint;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = 'Bearer ' + this.token;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Authentication endpoints
  async register(data: {
    email: string;
    password: string;
    name: string;
    organizationName: string;
  }) {
    return this.request<{
      message: string;
      user: any;
      organization: any;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: { email: string; password: string }) {
    const result = await this.request<{
      message: string;
      token: string;
      user: any;
      organization: any;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    // Store token after successful login
    this.setToken(result.token);
    return result;
  }

  async getProfile() {
    return this.request<{
      user: any;
      organization: any;
    }>('/auth/me');
  }

  async logout() {
    this.setToken(null);
  }

  // Organization endpoints
  async getOrganization() {
    return this.request<{ organization: any }>('/organizations');
  }

  async updateOrganization(data: {
    name?: string;
    plan?: string;
    email?: string;
    phone?: string;
    website?: string;
  }) {
    return this.request<{
      message: string;
      organization: any;
    }>('/organizations', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Facility endpoints
  async getFacilities() {
    return this.request<{ facilities: any[] }>('/facilities');
  }

  async createFacility(data: {
    name: string;
    type: string;
    location?: string;
    description?: string;
  }) {
    return this.request<{
      message: string;
      facility: any;
    }>('/facilities', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Survey endpoints
  async getSurveys() {
    return this.request<{ surveys: any[] }>('/surveys');
  }

  async createSurvey(data: {
    title: string;
    description?: string;
    facilityId: string;
    questions: any[];
  }) {
    return this.request<{
      message: string;
      survey: any;
    }>('/surveys', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Response endpoints
  async getResponses(filters?: { surveyId?: string; facilityId?: string }) {
    const params = new URLSearchParams();
    if (filters?.surveyId) params.append('surveyId', filters.surveyId);
    if (filters?.facilityId) params.append('facilityId', filters.facilityId);
    
    const query = params.toString();
    const endpoint = '/responses' + (query ? `?${query}` : '');
    return this.request<{ responses: any[] }>(endpoint);
  }

  async submitResponse(data: {
    surveyId: string;
    answers: any[];
    rating?: number;
    comment?: string;
  }) {
    return this.request<{
      message: string;
      response: { id: string; submittedAt: string };
    }>('/responses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();