import React, { useState, useEffect } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import api from '../services/api';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ReportFilters {
  campaignId: string;
  dateFrom: string;
  dateTo: string;
  department: string;
}

const ReportsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [filters, setFilters] = useState<ReportFilters>({
    campaignId: '',
    dateFrom: '',
    dateTo: '',
    department: '',
  });
  const [chartType, setChartType] = useState<'decision' | 'resource'>('decision');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch available campaigns for filtering
        try {
          const campaignsResponse = await api.get('/campaigns/');
          // Ensure campaigns is an array
          if (Array.isArray(campaignsResponse.data)) {
            setCampaigns(campaignsResponse.data);
          } else if (campaignsResponse.data && campaignsResponse.data.results && Array.isArray(campaignsResponse.data.results)) {
            // Handle case where API returns { results: [...] }
            setCampaigns(campaignsResponse.data.results);
          } else {
            // Default to empty array if response is not as expected
            console.warn('Campaigns API response is not in expected format', campaignsResponse.data);
            setCampaigns([]);
          }
        } catch (error) {
          console.error('Failed to fetch campaigns:', error);
          setCampaigns([]);
        }
        
        // Fetch departments for filtering
        setDepartments(['IT', 'HR', 'Finance', 'Marketing', 'Operations']);
        
        // Fetch initial stats
        try {
          const statsResponse = await api.get('/reviews/stats/');
          setStats(statsResponse.data);
        } catch (error) {
          console.error('Failed to fetch stats:', error);
          setStats(null);
        }
      } catch (error) {
        console.error('Failed to fetch report data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const applyFilters = async () => {
    try {
      setLoading(true);
      
      // Construct query parameters
      const params: any = {};
      if (filters.campaignId) params.campaign = filters.campaignId;
      if (filters.department) params.department = filters.department;
      if (filters.dateFrom) params.date_from = filters.dateFrom;
      if (filters.dateTo) params.date_to = filters.dateTo;
      
      const statsResponse = await api.get('/reviews/stats/', { params });
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Failed to fetch filtered stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = async () => {
    try {
      setExportLoading(true);
      
      // Construct query parameters
      const params: any = {};
      if (filters.campaignId) params.campaign = filters.campaignId;
      if (filters.department) params.department = filters.department;
      if (filters.dateFrom) params.date_from = filters.dateFrom;
      if (filters.dateTo) params.date_to = filters.dateTo;
      
      const response = await api.get('/reports/export/excel/', {
        params,
        responseType: 'blob'
      });
      
      // Create a download link and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `access-review-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to export Excel report:', error);
      alert('Failed to export report. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  const exportPdf = async () => {
    try {
      setExportLoading(true);
      
      // Construct query parameters
      const params: any = {};
      if (filters.campaignId) params.campaign = filters.campaignId;
      if (filters.department) params.department = filters.department;
      if (filters.dateFrom) params.date_from = filters.dateFrom;
      if (filters.dateTo) params.date_to = filters.dateTo;
      
      const response = await api.get('/reports/export/pdf/', {
        params,
        responseType: 'blob'
      });
      
      // Create a download link and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `access-review-report-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to export PDF report:', error);
      alert('Failed to export report. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  // Prepare chart data for decisions
  const decisionChartData = stats && stats.by_decision && Array.isArray(stats.by_decision) ? {
    labels: stats.by_decision.map((item: any) => item.decision || 'Unknown'),
    datasets: [
      {
        label: 'Number of Reviews',
        data: stats.by_decision.map((item: any) => item.count),
        backgroundColor: [
          'rgba(54, 162, 235, 0.5)', // blue for pending
          'rgba(75, 192, 192, 0.5)',  // green for approved
          'rgba(255, 99, 132, 0.5)',  // red for rejected
          'rgba(255, 206, 86, 0.5)',  // yellow for deferred
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
        ],
        borderWidth: 1,
      },
    ],
  } : null;

  // Prepare chart data for resource types
  const resourceChartData = stats && stats.by_resource_type && Array.isArray(stats.by_resource_type) ? {
    labels: stats.by_resource_type.map((item: any) => item.access__resource_type || 'Unknown'),
    datasets: [
      {
        label: 'Number of Reviews',
        data: stats.by_resource_type.map((item: any) => item.count),
        backgroundColor: [
          'rgba(54, 162, 235, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(255, 99, 132, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(153, 102, 255, 0.5)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  } : null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        
        <div className="flex space-x-2 mt-4 md:mt-0">
          <button
            onClick={exportExcel}
            disabled={exportLoading || loading}
            className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-green-300 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Excel
          </button>
          
          <button
            onClick={exportPdf}
            disabled={exportLoading || loading}
            className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:bg-red-300 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export PDF
          </button>
        </div>
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-lg font-medium text-gray-800 mb-4">Filter Reports</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Campaign
            </label>
            <select
              name="campaignId"
              value={filters.campaignId}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">All Campaigns</option>
              {Array.isArray(campaigns) && campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <select
              name="department"
              value={filters.department}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date From
            </label>
            <input
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date To
            </label>
            <input
              type="date"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        </div>
        
        <button
          onClick={applyFilters}
          disabled={loading}
          className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
        >
          {loading ? 'Loading...' : 'Apply Filters'}
        </button>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white shadow-md rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Total Reviews</h3>
              <p className="text-4xl font-bold text-blue-600">{stats.total}</p>
            </div>
            
            <div className="bg-white shadow-md rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Completion Rate</h3>
              <p className="text-4xl font-bold text-green-600">
                {stats && stats.by_decision && Array.isArray(stats.by_decision) && stats.total > 0 ? (
                  `${Math.round(
                    ((stats.by_decision.find((d: any) => d.decision === 'approved')?.count || 0) +
                    (stats.by_decision.find((d: any) => d.decision === 'rejected')?.count || 0)) / 
                    stats.total * 100
                  )}%`
                ) : '0%'}
              </p>
            </div>
            
            <div className="bg-white shadow-md rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Rejection Rate</h3>
              <p className="text-4xl font-bold text-red-600">
                {stats && stats.by_decision && Array.isArray(stats.by_decision) && stats.total > 0 ? (
                  `${Math.round(
                    (stats.by_decision.find((d: any) => d.decision === 'rejected')?.count || 0) / 
                    stats.total * 100
                  )}%`
                ) : '0%'}
              </p>
            </div>
          </div>
          
          <div className="bg-white shadow-md rounded-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-gray-800">Charts & Visualizations</h2>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setChartType('decision')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    chartType === 'decision' 
                      ? 'bg-blue-100 text-blue-700 font-medium' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  By Decision
                </button>
                
                <button
                  onClick={() => setChartType('resource')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    chartType === 'resource' 
                      ? 'bg-blue-100 text-blue-700 font-medium' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  By Resource Type
                </button>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6">
              <div className="md:w-1/2">
                {chartType === 'decision' && decisionChartData ? (
                  <Bar
                    data={decisionChartData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          display: false,
                        },
                        title: {
                          display: true,
                          text: 'Reviews by Decision'
                        },
                      },
                    }}
                  />
                ) : resourceChartData ? (
                  <Bar
                    data={resourceChartData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          display: false,
                        },
                        title: {
                          display: true,
                          text: 'Reviews by Resource Type'
                        },
                      },
                    }}
                  />
                ) : null}
              </div>
              
              <div className="md:w-1/2">
                {chartType === 'decision' && decisionChartData ? (
                  <Pie
                    data={decisionChartData}
                    options={{
                      responsive: true,
                      plugins: {
                        title: {
                          display: true,
                          text: 'Reviews by Decision'
                        },
                      },
                    }}
                  />
                ) : resourceChartData ? (
                  <Pie
                    data={resourceChartData}
                    options={{
                      responsive: true,
                      plugins: {
                        title: {
                          display: true,
                          text: 'Reviews by Resource Type'
                        },
                      },
                    }}
                  />
                ) : null}
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Decision Details</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Decision
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats && stats.by_decision && Array.isArray(stats.by_decision) && stats.by_decision.map((item: any, index: number) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.decision === 'approved' ? 'bg-green-100 text-green-800' :
                          item.decision === 'rejected' ? 'bg-red-100 text-red-800' :
                          item.decision === 'pending' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.decision || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {Math.round((item.count / stats.total) * 100)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-6">
          <p className="text-gray-500 text-center">No data available. Please adjust your filters and try again.</p>
        </div>
      )}
    </div>
  );
};

export default ReportsPage; 