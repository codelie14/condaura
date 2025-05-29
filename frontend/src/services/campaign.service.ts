import api from './api';

export interface Campaign {
  id: number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: 'Draft' | 'Active' | 'Completed' | 'Archived';
  created_by: number;
  created_at: string;
}

export interface CampaignCreateData {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
}

export interface CampaignStats {
  total_reviews: number;
  completed_reviews: number;
  approved_count: number;
  revoked_count: number;
  pending_count: number;
  completion_percentage: number;
}

const CampaignService = {
  async getCampaigns(): Promise<Campaign[]> {
    const response = await api.get<Campaign[]>('/campaigns/');
    return response.data;
  },

  async getCampaign(id: number): Promise<Campaign> {
    const response = await api.get<Campaign>(`/campaigns/${id}/`);
    return response.data;
  },

  async createCampaign(data: CampaignCreateData): Promise<Campaign> {
    const response = await api.post<Campaign>('/campaigns/', data);
    return response.data;
  },

  async updateCampaign(id: number, data: Partial<CampaignCreateData>): Promise<Campaign> {
    const response = await api.put<Campaign>(`/campaigns/${id}/`, data);
    return response.data;
  },

  async deleteCampaign(id: number): Promise<void> {
    await api.delete(`/campaigns/${id}/`);
  },

  async getCampaignStats(id: number): Promise<CampaignStats> {
    const response = await api.get<CampaignStats>(`/campaigns/${id}/stats/`);
    return response.data;
  },

  async startCampaign(id: number): Promise<Campaign> {
    const response = await api.post<Campaign>(`/campaigns/${id}/start/`);
    return response.data;
  },

  async completeCampaign(id: number): Promise<Campaign> {
    const response = await api.post<Campaign>(`/campaigns/${id}/complete/`);
    return response.data;
  },

  async archiveCampaign(id: number): Promise<Campaign> {
    const response = await api.post<Campaign>(`/campaigns/${id}/archive/`);
    return response.data;
  },

  async exportReport(id: number, format: 'pdf' | 'excel' | 'csv'): Promise<Blob> {
    const response = await api.get(`/campaigns/${id}/export/${format}/`, {
      responseType: 'blob'
    });
    return response.data;
  }
};

export default CampaignService; 