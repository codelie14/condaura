import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import campaignService from '../services/campaign.service';
import { toast } from 'react-toastify';
import { UserRole } from '../services/auth.service';

// Define the campaign data interface
interface CampaignFormData {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  department?: string;
  layer?: string;
  profile?: string;
  reviewers: string[];
  assignment_method: 'manual' | 'manager' | 'resource_owner';
}

interface Reviewer {
  id: number | string;
  email: string;
  name: string;
  role?: UserRole;
}

const CampaignCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    department: '',
    layer: '',
    profile: '',
    reviewers: [],
    assignment_method: 'manual',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableReviewers, setAvailableReviewers] = useState<Reviewer[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [layers, setLayers] = useState<string[]>([]);
  const [profiles, setProfiles] = useState<string[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);

  // Fetch necessary data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // TODO: Implement these API calls
        // const reviewersResponse = await userService.getReviewers();
        // setAvailableReviewers(reviewersResponse.data);
        
        // Placeholder data until APIs are implemented
        setAvailableReviewers([
          { id: 1, email: 'reviewer1@example.com', name: 'Reviewer One', role: 'Back office' },
          { id: 2, email: 'reviewer2@example.com', name: 'Reviewer Two', role: 'Front office' },
        ]);
        
        setDepartments(['DIGITAL', 'CS', 'PS', 'RAN', 'TRANS', 'IN', 'VAS', 'CLOUD', 'IP']);
        setLayers(['Application', 'Database', 'System']);
        setProfiles(['Admin', 'Read/Write', 'Read only', 'Write only', 'user', 'Viewer', 'Operator']);
        setRoles(['Admin', 'Back office', 'Front office', 'DAO', 'Digital Team']);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
    };
    
    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleReviewerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
    setFormData({
      ...formData,
      reviewers: selectedOptions,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Prepare the campaign data
      const campaignData = {
        name: formData.name,
        description: formData.description,
        start_date: formData.start_date,
        end_date: formData.end_date,
        // Include optional fields only if they have values
        ...(formData.department ? { department: formData.department } : {}),
        ...(formData.layer ? { layer: formData.layer } : {}),
        ...(formData.profile ? { profile: formData.profile } : {}),
        ...(formData.assignment_method === 'manual' ? { reviewers: formData.reviewers } : {}),
        assignment_method: formData.assignment_method
      };

      // Send request to create campaign
      await campaignService.createCampaign(campaignData);
      
      // Show success message
      toast.success('Campaign created successfully!');
      
      // Redirect to campaigns list on success
      navigate('/campaigns');
    } catch (err: any) {
      console.error('Campaign creation error:', err);
      const errorMsg = err.response?.data?.detail || 
                      err.response?.data?.message || 
                      'Failed to create campaign. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Create New Access Review Campaign</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Campaign Name*
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="e.g., Q1 2025 Access Review"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description*
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Describe the purpose of this campaign"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date*
              </label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                value={formData.start_date}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                End Date*
              </label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                value={formData.end_date}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>
          
          <h3 className="text-lg font-medium text-gray-800 mb-2 mt-6">Scope Selection</h3>
          
          <div className="mb-4">
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
              Department (Optional)
            </label>
            <select
              id="department"
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label htmlFor="layer" className="block text-sm font-medium text-gray-700 mb-1">
              Layer (Optional)
            </label>
            <select
              id="layer"
              name="layer"
              value={formData.layer}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">All Layers</option>
              {layers.map(layer => (
                <option key={layer} value={layer}>{layer}</option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label htmlFor="profile" className="block text-sm font-medium text-gray-700 mb-1">
              Profil (Optional)
            </label>
            <select
              id="profile"
              name="profile"
              value={formData.profile}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">All Profiles</option>
              {profiles.map(profile => (
                <option key={profile} value={profile}>{profile}</option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Role (Optional)
            </label>
            <select
              id="role"
              name="role"
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">All Roles</option>
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          
          <h3 className="text-lg font-medium text-gray-800 mb-2 mt-6">Reviewer Assignment</h3>
          
          <div className="mb-4">
            <label htmlFor="assignment_method" className="block text-sm font-medium text-gray-700 mb-1">
              Assignment Method*
            </label>
            <select
              id="assignment_method"
              name="assignment_method"
              value={formData.assignment_method}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="manual">Manual Selection</option>
              <option value="manager">By Manager (Hierarchical)</option>
              <option value="resource_owner">By Resource Owner</option>
            </select>
          </div>
          
          {formData.assignment_method === 'manual' && (
            <div className="mb-6">
              <label htmlFor="reviewers" className="block text-sm font-medium text-gray-700 mb-1">
                Select Reviewers*
              </label>
              <select
                id="reviewers"
                name="reviewers"
                multiple
                value={formData.reviewers}
                onChange={handleReviewerChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 h-32"
              >
                {availableReviewers.map(reviewer => (
                  <option key={reviewer.id} value={reviewer.id}>
                    {reviewer.name} ({reviewer.email}) - {reviewer.role || 'No role'}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple reviewers</p>
            </div>
          )}
          
          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={() => navigate('/campaigns')}
              className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 mr-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md disabled:bg-blue-300 transition-colors duration-200"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  Create Campaign
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CampaignCreatePage; 