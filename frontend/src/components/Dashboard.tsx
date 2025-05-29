import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CampaignService, { Campaign } from '../services/campaign.service';
import ReviewService from '../services/review.service';
import NotificationService, { Notification } from '../services/notification.service';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([]);
  const [pendingReviews, setPendingReviews] = useState<number>(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState({
    approved: 0,
    revoked: 0,
    pending: 0,
    total: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch active campaigns
        const campaigns = await CampaignService.getCampaigns();
        setActiveCampaigns(campaigns.filter(c => c.status === 'Active').slice(0, 5));
        
        // Fetch review stats
        const reviewStats = await ReviewService.getReviewsStats();
        setStats({
          approved: reviewStats.approved,
          revoked: reviewStats.revoked,
          pending: reviewStats.pending,
          total: reviewStats.total
        });
        setPendingReviews(reviewStats.pending);
        
        // Fetch notifications
        const notificationResponse = await NotificationService.getNotifications(1, true);
        setNotifications(notificationResponse.results.slice(0, 5));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const calculateCompletionPercentage = () => {
    if (stats.total === 0) return 0;
    return Math.round(((stats.approved + stats.revoked) / stats.total) * 100);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const calculateDaysLeft = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getNotificationTypeClass = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return 'bg-green-100 text-green-800';
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-800';
      case 'ERROR':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading dashboard data...</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user?.first_name}!</h1>
          <p className="text-gray-600">Here's an overview of your Condaura activities</p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Link to="/reviews" className="btn-primary">
            {pendingReviews > 0 ? `Review Access (${pendingReviews})` : 'View Reviews'}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <div className="card bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Review Summary</h2>
          
          <div className="flex items-center justify-between mb-2">
            <span>Completion</span>
            <span className="font-semibold">{calculateCompletionPercentage()}%</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div 
              className="bg-accent1 h-2.5 rounded-full" 
              style={{ width: `${calculateCompletionPercentage()}%` }}
            ></div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm text-gray-500">Approved</div>
              <div className="text-xl font-semibold text-green-600">{stats.approved}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm text-gray-500">Revoked</div>
              <div className="text-xl font-semibold text-red-600">{stats.revoked}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm text-gray-500">Pending</div>
              <div className="text-xl font-semibold text-orange-600">{stats.pending}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm text-gray-500">Total</div>
              <div className="text-xl font-semibold">{stats.total}</div>
            </div>
          </div>
        </div>

        {/* Active Campaigns */}
        <div className="card bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Active Campaigns</h2>
            <Link to="/campaigns" className="text-sm text-accent1 hover:underline">
              View All
            </Link>
          </div>
          
          {activeCampaigns.length === 0 ? (
            <p className="text-gray-500">No active campaigns at the moment.</p>
          ) : (
            <div className="space-y-3">
              {activeCampaigns.map(campaign => {
                const daysLeft = calculateDaysLeft(campaign.end_date);
                return (
                  <div key={campaign.id} className="border-b pb-3 last:border-0">
                    <Link 
                      to={`/campaigns/${campaign.id}`}
                      className="font-medium text-accent1 hover:underline"
                    >
                      {campaign.name}
                    </Link>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-500">Ends: {formatDate(campaign.end_date)}</span>
                      <span className={`${daysLeft < 3 ? 'text-red-600' : 'text-gray-600'} font-medium`}>
                        {daysLeft <= 0 ? 'Overdue' : `${daysLeft} days left`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="card bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Recent Notifications</h2>
            <Link to="/notifications" className="text-sm text-accent1 hover:underline">
              View All
            </Link>
          </div>
          
          {notifications.length === 0 ? (
            <p className="text-gray-500">No new notifications.</p>
          ) : (
            <div className="space-y-3">
              {notifications.map(notification => (
                <div key={notification.id} className="border-b pb-3 last:border-0">
                  <div className="flex items-start">
                    <span className={`inline-block w-2 h-2 rounded-full mt-2 mr-2 ${!notification.is_read ? 'bg-accent1' : 'bg-gray-300'}`}></span>
                    <div>
                      <div className="font-medium">{notification.title}</div>
                      <div className="text-sm text-gray-600">{notification.message}</div>
                      <div className="flex justify-between items-center mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getNotificationTypeClass(notification.type)}`}>
                          {notification.type}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(notification.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 