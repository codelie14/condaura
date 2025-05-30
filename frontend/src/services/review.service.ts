import api from './api';

export interface Access {
  id: number;
  access_id: string;
  user: {
    id: number;
    user_id: string;
    email: string;
    first_name: string;
    last_name: string;
    department: string;
  };
  resource_name: string;
  resource_type: string;
  access_level: string;
  granted_date: string;
  last_used: string | null;
}

export interface Review {
  id: number;
  campaign: number;
  access: Access;
  reviewer: number;
  decision: 'Pending' | 'Approved' | 'Revoked' | 'Deferred';
  comment: string | null;
  reviewed_at: string | null;
}

export interface ReviewDecision {
  decision: 'Approved' | 'Revoked' | 'Deferred';
  comment: string;
}

export interface ReviewsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Review[];
}

const ReviewService = {
  async getReviews(campaignId?: number, status?: string, page = 1): Promise<ReviewsResponse> {
    let url = '/reviews/';
    const params: Record<string, any> = { page };
    
    if (campaignId) {
      params.campaign = campaignId;
    }
    
    if (status) {
      params.decision = status;
    }
    
    const response = await api.get<ReviewsResponse>(url, { params });
    return response.data;
  },

  async getReview(id: number): Promise<Review> {
    const response = await api.get<Review>(`/reviews/${id}/`);
    return response.data;
  },

  async submitDecision(id: number, decision: ReviewDecision): Promise<Review> {
    const response = await api.post<Review>(`/reviews/${id}/decide/`, decision);
    return response.data;
  },

  async bulkApprove(reviewIds: number[], comment: string): Promise<void> {
    await api.post('/reviews/bulk-approve/', {
      review_ids: reviewIds,
      comment 
    });
  },

  async bulkRevoke(reviewIds: number[], comment: string): Promise<void> {
    await api.post('/reviews/bulk-revoke/', {
      review_ids: reviewIds,
      comment 
    });
  },

  async getMyReviews(status?: string): Promise<ReviewsResponse> {
    const params: Record<string, any> = {};
    if (status) {
      params.decision = status;
    }
    
    const response = await api.get<ReviewsResponse>('/reviews/my-reviews/', { params });
    return response.data;
  },

  async getReviewsStats(): Promise<{ 
    total: number;
    pending: number;
    approved: number;
    revoked: number;
    deferred: number;
  }> {
    const response = await api.get('/reviews/stats/');
    return response.data;
  }
};

export default ReviewService; 