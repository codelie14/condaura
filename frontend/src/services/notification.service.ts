import api from './api';

export interface Notification {
  id: number;
  user: number;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  is_read: boolean;
  related_object_type: string | null;
  related_object_id: number | null;
  created_at: string;
}

export interface NotificationsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Notification[];
}

const NotificationService = {
  async getNotifications(page = 1, onlyUnread = false): Promise<NotificationsResponse> {
    const params: Record<string, any> = { page };
    
    if (onlyUnread) {
      params.unread = true;
    }
    
    const response = await api.get<NotificationsResponse>('/notifications/notifications/', { params });
    return response.data;
  },

  async markAsRead(id: number): Promise<Notification> {
    const response = await api.post<Notification>(`/notifications/notifications/${id}/read/`);
    return response.data;
  },

  async markAllAsRead(): Promise<void> {
    await api.post('/notifications/notifications/mark-all-read/');
  },

  async getUnreadCount(): Promise<number> {
    const response = await api.get<{ count: number }>('/notifications/notifications/unread-count/');
    return response.data.count;
  },

  async deleteNotification(id: number): Promise<void> {
    await api.delete(`/notifications/notifications/${id}/`);
  }
};

export default NotificationService; 