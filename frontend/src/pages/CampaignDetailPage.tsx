import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import CampaignService, { Campaign, CampaignStats } from '../services/campaign.service';
import ReviewList from '../components/reviews/ReviewList';
import { useAuth } from '../contexts/AuthContext';

const CampaignDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCampaignDetails = async () => {
      if (!id) {
        setError('Campaign ID is missing');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch campaign details
        const campaignData = await CampaignService.getCampaign(parseInt(id));
        setCampaign(campaignData);
        
        // Fetch campaign stats
        try {
          const statsData = await CampaignService.getCampaignStats(parseInt(id));
          setStats(statsData);
        } catch (statsError) {
          console.error('Error fetching campaign stats:', statsError);
          // Don't set an error, as the campaign may still be viewable without stats
        }
      } catch (error: any) {
        console.error('Error fetching campaign details:', error);
        setError(error.response?.data?.detail || 'Failed to load campaign details');
        toast.error('Failed to load campaign details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCampaignDetails();
  }, [id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-200 text-gray-800';
      case 'Active':
        return 'bg-blue-200 text-blue-800';
      case 'Completed':
        return 'bg-green-200 text-green-800';
      case 'Archived':
        return 'bg-gray-300 text-gray-700';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  const calculateDaysLeft = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleStartCampaign = async () => {
    if (!campaign || !id) return;
    
    try {
      await CampaignService.startCampaign(campaign.id);
      toast.success('Campaign started successfully');
      // Reload campaign data
      const updatedCampaign = await CampaignService.getCampaign(campaign.id);
      setCampaign(updatedCampaign);
    } catch (error: any) {
      console.error('Error starting campaign:', error);
      toast.error(error.response?.data?.detail || 'Failed to start campaign');
    }
  };

  const handleCompleteCampaign = async () => {
    if (!campaign || !id) return;
    
    if (!window.confirm('Are you sure you want to complete this campaign? This will mark it as finished.')) {
      return;
    }
    
    try {
      await CampaignService.completeCampaign(campaign.id);
      toast.success('Campaign completed successfully');
      // Reload campaign data
      const updatedCampaign = await CampaignService.getCampaign(campaign.id);
      setCampaign(updatedCampaign);
    } catch (error: any) {
      console.error('Error completing campaign:', error);
      toast.error(error.response?.data?.detail || 'Failed to complete campaign');
    }
  };

  const handleArchiveCampaign = async () => {
    if (!campaign || !id) return;
    
    if (!window.confirm('Are you sure you want to archive this campaign? This action cannot be undone.')) {
      return;
    }
    
    try {
      await CampaignService.archiveCampaign(campaign.id);
      toast.success('Campaign archived successfully');
      // Redirect to campaigns list
      navigate('/campaigns');
    } catch (error: any) {
      console.error('Error archiving campaign:', error);
      toast.error(error.response?.data?.detail || 'Failed to archive campaign');
    }
  };

  const handleExportReport = async (format: 'pdf' | 'excel' | 'csv') => {
    if (!campaign || !id) return;
    
    try {
      const blob = await CampaignService.exportReport(campaign.id, format);
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `campaign_${campaign.id}_report.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`Report exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      console.error(`Error exporting ${format} report:`, error);
      toast.error(`Failed to export ${format.toUpperCase()} report`);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error || !campaign || !id) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          <strong className="font-bold">Error! </strong>
          <span className="block sm:inline">{error || 'Campaign not found'}</span>
        </div>
        <Link to="/campaigns" className="text-blue-500 hover:underline">
          &larr; Back to campaigns
        </Link>
      </div>
    );
  }

  const isAdmin = user?.role?.toLowerCase() === 'admin' || user?.is_staff;
  const daysLeft = calculateDaysLeft(campaign.end_date);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <ol className="flex text-sm text-gray-500">
          <li>
            <Link to="/dashboard" className="hover:text-blue-600">Dashboard</Link>
            <span className="mx-2">/</span>
          </li>
          <li>
            <Link to="/campaigns" className="hover:text-blue-600">Campaigns</Link>
            <span className="mx-2">/</span>
          </li>
          <li className="text-gray-900 font-medium truncate">{campaign.name}</li>
        </ol>
      </nav>
      
      {/* Campaign Header */}
      <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{campaign.name}</h1>
            <p className="text-gray-500 mb-4">{campaign.description}</p>
            
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-gray-500">Status: </span>
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(campaign.status)}`}>
                  {campaign.status}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Start Date: </span>
                <span>{formatDate(campaign.start_date)}</span>
              </div>
              <div>
                <span className="text-gray-500">End Date: </span>
                <span>{formatDate(campaign.end_date)}</span>
              </div>
              {campaign.status === 'Active' && (
                <div>
                  <span className="text-gray-500">Days Left: </span>
                  <span className={`font-medium ${daysLeft < 3 ? 'text-red-600' : 'text-gray-900'}`}>
                    {daysLeft <= 0 ? 'Overdue' : `${daysLeft} days`}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Campaign Actions */}
          {isAdmin && (
            <div className="flex flex-col sm:flex-row gap-2">
              {campaign.status === 'Draft' && (
                <button
                  onClick={handleStartCampaign}
                  className="btn bg-blue-600 text-white hover:bg-blue-700"
                >
                  Start Campaign
                </button>
              )}
              {campaign.status === 'Active' && (
                <button
                  onClick={handleCompleteCampaign}
                  className="btn bg-green-600 text-white hover:bg-green-700"
                >
                  Complete Campaign
                </button>
              )}
              {(campaign.status === 'Completed' || campaign.status === 'Active') && (
                <button
                  onClick={handleArchiveCampaign}
                  className="btn bg-gray-600 text-white hover:bg-gray-700"
                >
                  Archive Campaign
                </button>
              )}
              {campaign.status !== 'Draft' && (
                <div className="relative dropdown">
                  <button
                    className="btn bg-blue-600 text-white hover:bg-blue-700"
                    onClick={() => {
                      const dropdown = document.querySelector('.dropdown-menu');
                      dropdown?.classList.toggle('hidden');
                    }}
                  >
                    Export Report
                  </button>
                  <div className="dropdown-menu hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                    <div className="py-1">
                      <button
                        onClick={() => handleExportReport('pdf')}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        Export as PDF
                      </button>
                      <button
                        onClick={() => handleExportReport('excel')}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        Export as Excel
                      </button>
                      <button
                        onClick={() => handleExportReport('csv')}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        Export as CSV
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Campaign Stats */}
      {stats && (
        <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Campaign Progress</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600">Total Reviews</p>
              <p className="text-2xl font-bold">{stats.total_reviews}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600">Approved</p>
              <p className="text-2xl font-bold">{stats.approved_count}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-600">Revoked</p>
              <p className="text-2xl font-bold">{stats.revoked_count}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-600">Pending</p>
              <p className="text-2xl font-bold">{stats.pending_count}</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-1">
              <span>Completion Progress</span>
              <span>{stats.completion_percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${stats.completion_percentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
      
      {/* Reviews for this campaign */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Campaign Reviews</h2>
        <ReviewList campaignId={parseInt(id)} />
      </div>
    </div>
  );
};

export default CampaignDetailPage; 