import React, { useState, useEffect, useCallback } from 'react';
import ReviewService, { Review, ReviewDecision } from '../../services/review.service';

interface ReviewListProps {
  campaignId?: number;
}

const ReviewList: React.FC<ReviewListProps> = ({ campaignId }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReviews, setSelectedReviews] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [bulkComment, setBulkComment] = useState<string>('');
  const [showBulkActions, setShowBulkActions] = useState<boolean>(false);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ReviewService.getReviews(campaignId, 'Pending', currentPage);
      setReviews(response.results);
      setTotalPages(Math.ceil(response.count / 10)); // Assuming 10 items per page
    } catch (error: any) {
      setError(error.message || 'Failed to fetch reviews');
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  }, [campaignId, currentPage]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleDecision = async (reviewId: number, decision: ReviewDecision) => {
    try {
      await ReviewService.submitDecision(reviewId, decision);
      // Remove the review from the list after decision
      setReviews(reviews.filter(review => review.id !== reviewId));
    } catch (error: any) {
      console.error('Error submitting decision:', error);
      alert('Failed to submit decision: ' + (error.message || 'Unknown error'));
    }
  };

  const handleBulkApprove = async () => {
    if (!bulkComment) {
      alert('Please provide a comment for the bulk approval');
      return;
    }
    
    try {
      await ReviewService.bulkApprove(selectedReviews, bulkComment);
      // Remove the approved reviews from the list
      setReviews(reviews.filter(review => !selectedReviews.includes(review.id)));
      setSelectedReviews([]);
      setBulkComment('');
      setShowBulkActions(false);
    } catch (error: any) {
      console.error('Error bulk approving reviews:', error);
      alert('Failed to bulk approve: ' + (error.message || 'Unknown error'));
    }
  };

  const handleBulkRevoke = async () => {
    if (!bulkComment) {
      alert('Please provide a comment for the bulk revocation');
      return;
    }
    
    try {
      await ReviewService.bulkRevoke(selectedReviews, bulkComment);
      // Remove the revoked reviews from the list
      setReviews(reviews.filter(review => !selectedReviews.includes(review.id)));
      setSelectedReviews([]);
      setBulkComment('');
      setShowBulkActions(false);
    } catch (error: any) {
      console.error('Error bulk revoking reviews:', error);
      alert('Failed to bulk revoke: ' + (error.message || 'Unknown error'));
    }
  };

  const toggleReviewSelection = (reviewId: number) => {
    if (selectedReviews.includes(reviewId)) {
      setSelectedReviews(selectedReviews.filter(id => id !== reviewId));
    } else {
      setSelectedReviews([...selectedReviews, reviewId]);
    }
  };

  const selectAllReviews = () => {
    if (selectedReviews.length === reviews.length) {
      setSelectedReviews([]);
    } else {
      setSelectedReviews(reviews.map(review => review.id));
    }
  };

  if (loading && reviews.length === 0) {
    return <div className="flex justify-center p-8">Loading reviews...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded mb-4">
        Error: {error}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center p-8">
        <p>No pending reviews found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Pending Reviews</h2>
        
        {selectedReviews.length > 0 && (
          <div className="flex space-x-2">
            <button 
              className="btn-success text-sm"
              onClick={() => setShowBulkActions(true)}
            >
              Actions ({selectedReviews.length})
            </button>
          </div>
        )}
      </div>

      {showBulkActions && (
        <div className="bg-gray-50 p-4 rounded-lg border mb-4">
          <h3 className="font-medium mb-2">Bulk Actions</h3>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comment
            </label>
            <textarea
              className="input"
              value={bulkComment}
              onChange={(e) => setBulkComment(e.target.value)}
              placeholder="Enter comment for bulk action..."
              rows={2}
            />
          </div>
          <div className="flex space-x-2">
            <button 
              className="btn-success text-sm"
              onClick={handleBulkApprove}
              disabled={!bulkComment}
            >
              Approve Selected
            </button>
            <button 
              className="btn-danger text-sm"
              onClick={handleBulkRevoke}
              disabled={!bulkComment}
            >
              Revoke Selected
            </button>
            <button 
              className="btn text-sm bg-gray-200"
              onClick={() => {
                setShowBulkActions(false);
                setBulkComment('');
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">
                <input 
                  type="checkbox" 
                  checked={selectedReviews.length === reviews.length && reviews.length > 0}
                  onChange={selectAllReviews}
                  className="rounded"
                />
              </th>
              <th className="py-2 px-4 border-b text-left">User</th>
              <th className="py-2 px-4 border-b text-left">Resource</th>
              <th className="py-2 px-4 border-b text-left">Access Level</th>
              <th className="py-2 px-4 border-b text-left">Last Used</th>
              <th className="py-2 px-4 border-b text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr key={review.id} className="hover:bg-gray-50">
                <td className="py-2 px-4 border-b text-center">
                  <input 
                    type="checkbox" 
                    checked={selectedReviews.includes(review.id)}
                    onChange={() => toggleReviewSelection(review.id)}
                    className="rounded"
                  />
                </td>
                <td className="py-2 px-4 border-b">
                  <div>
                    <div className="font-medium">{review.access.user.first_name} {review.access.user.last_name}</div>
                    <div className="text-sm text-gray-500">{review.access.user.email}</div>
                    <div className="text-xs text-gray-400">{review.access.user.department}</div>
                  </div>
                </td>
                <td className="py-2 px-4 border-b">
                  <div className="font-medium">{review.access.resource_name}</div>
                  <div className="text-xs text-gray-500">{review.access.resource_type}</div>
                </td>
                <td className="py-2 px-4 border-b">{review.access.access_level}</td>
                <td className="py-2 px-4 border-b">
                  {review.access.last_used ? new Date(review.access.last_used).toLocaleDateString() : 'Never'}
                </td>
                <td className="py-2 px-4 border-b">
                  <div className="flex justify-center space-x-2">
                    <button
                      onClick={() => {
                        const comment = window.prompt('Enter a comment for approval (optional):') || '';
                        handleDecision(review.id, { decision: 'Approved', comment });
                      }}
                      className="p-1 bg-green-500 text-white rounded hover:bg-green-600"
                      title="Approve"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => {
                        const comment = window.prompt('Enter a reason for revocation:');
                        if (comment) {
                          handleDecision(review.id, { decision: 'Revoked', comment });
                        }
                      }}
                      className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                      title="Revoke"
                    >
                      ✗
                    </button>
                    <button
                      onClick={() => {
                        const comment = window.prompt('Enter a reason for deferral:');
                        if (comment) {
                          handleDecision(review.id, { decision: 'Deferred', comment });
                        }
                      }}
                      className="p-1 bg-gray-400 text-white rounded hover:bg-gray-500"
                      title="Defer"
                    >
                      ?
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-200' : 'bg-gray-300 hover:bg-gray-400'}`}
            >
              Previous
            </button>
            <span className="px-3 py-1">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded ${currentPage === totalPages ? 'bg-gray-200' : 'bg-gray-300 hover:bg-gray-400'}`}
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default ReviewList; 