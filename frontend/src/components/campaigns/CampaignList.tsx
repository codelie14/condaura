import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CampaignService, { Campaign } from '../../services/campaign.service';

interface ApiResponse {
  results?: Campaign[];
  [key: string]: any;
}

const CampaignList: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        const response = await CampaignService.getCampaigns();
        // Ensure campaigns is always an array
        if (Array.isArray(response)) {
          setCampaigns(response);
        } else if (response && typeof response === 'object') {
          // Handle case where API returns { results: [...] }
          const apiResponse = response as ApiResponse;
          if (Array.isArray(apiResponse.results)) {
            setCampaigns(apiResponse.results);
          } else {
            console.warn('API response is not in expected format:', response);
            setCampaigns([]);
          }
        } else {
          setCampaigns([]);
          console.warn('Unexpected API response format:', response);
        }
      } catch (error: any) {
        setError(error.message || 'Failed to fetch campaigns');
        console.error('Error fetching campaigns:', error);
        setCampaigns([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  if (loading) {
    return <div className="flex justify-center p-8">Loading campaigns...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded mb-4">
        Error: {error}
      </div>
    );
  }

  if (!campaigns || campaigns.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="mb-4">No campaigns found.</p>
        <Link 
          to="/campaigns/create" 
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          Create New Campaign
        </Link>
      </div>
    );
  }

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

  return (
    <div className="overflow-x-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Campaigns</h2>
        <Link 
          to="/campaigns/create" 
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md transition-colors duration-200"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          Create New Campaign
        </Link>
      </div>

      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b text-left">Name</th>
            <th className="py-2 px-4 border-b text-left">Status</th>
            <th className="py-2 px-4 border-b text-left">Start Date</th>
            <th className="py-2 px-4 border-b text-left">End Date</th>
            <th className="py-2 px-4 border-b text-left">Days Left</th>
            <th className="py-2 px-4 border-b text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(campaigns) && campaigns.map((campaign) => {
            const daysLeft = calculateDaysLeft(campaign.end_date);
            return (
              <tr key={campaign.id} className="hover:bg-gray-50">
                <td className="py-2 px-4 border-b">
                  <Link 
                    to={`/campaigns/${campaign.id}`}
                    className="text-accent1 hover:underline font-medium"
                  >
                    {campaign.name}
                  </Link>
                  <p className="text-sm text-gray-500 truncate max-w-xs">{campaign.description}</p>
                </td>
                <td className="py-2 px-4 border-b">
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(campaign.status)}`}>
                    {campaign.status}
                  </span>
                </td>
                <td className="py-2 px-4 border-b">{formatDate(campaign.start_date)}</td>
                <td className="py-2 px-4 border-b">{formatDate(campaign.end_date)}</td>
                <td className="py-2 px-4 border-b">
                  {campaign.status === 'Active' ? (
                    <span className={`font-medium ${daysLeft < 3 ? 'text-red-600' : ''}`}>
                      {daysLeft <= 0 ? 'Overdue' : `${daysLeft} days`}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="py-2 px-4 border-b text-center">
                  <div className="flex justify-center space-x-2">
                    <Link 
                      to={`/campaigns/${campaign.id}`}
                      className="text-accent1 hover:text-accent2"
                    >
                      View
                    </Link>
                    {campaign.status === 'Draft' && (
                      <Link 
                        to={`/campaigns/${campaign.id}/edit`}
                        className="text-accent1 hover:text-accent2"
                      >
                        Edit
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default CampaignList; 