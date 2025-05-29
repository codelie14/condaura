import React, { useState } from 'react';
import axios from 'axios';
import api from '../services/api';

const ImportPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'access'>('users');
  const [userFile, setUserFile] = useState<File | null>(null);
  const [accessFile, setAccessFile] = useState<File | null>(null);
  const [userLoading, setUserLoading] = useState(false);
  const [accessLoading, setAccessLoading] = useState(false);
  const [userResults, setUserResults] = useState<any>(null);
  const [accessResults, setAccessResults] = useState<any>(null);
  const [userError, setUserError] = useState<string | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);

  const handleUserFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUserFile(e.target.files[0]);
      setUserError(null);
      setUserResults(null);
    }
  };

  const handleAccessFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAccessFile(e.target.files[0]);
      setAccessError(null);
      setAccessResults(null);
    }
  };

  const handleUserImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFile) {
      setUserError('Please select a CSV file to import');
      return;
    }

    setUserLoading(true);
    setUserError(null);

    const formData = new FormData();
    formData.append('file', userFile);

    try {
      const response = await api.post('/users/import/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUserResults(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setUserError(error.response?.data?.detail || 'Failed to import users. Please check your file format.');
      } else {
        setUserError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setUserLoading(false);
    }
  };

  const handleAccessImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessFile) {
      setAccessError('Please select a CSV file to import');
      return;
    }

    setAccessLoading(true);
    setAccessError(null);

    const formData = new FormData();
    formData.append('file', accessFile);

    try {
      const response = await api.post('/access/import/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setAccessResults(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setAccessError(error.response?.data?.detail || 'Failed to import access data. Please check your file format.');
      } else {
        setAccessError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setAccessLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Import Data</h1>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="flex border-b">
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'users' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('users')}
          >
            Import Users
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'access' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('access')}
          >
            Import Access
          </button>
        </div>
        
        <div className="p-6">
          {activeTab === 'users' ? (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-800 mb-2">User Import</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Upload a CSV file containing user data. The file must have the following columns:
                </p>
                
                <div className="bg-gray-50 p-3 rounded text-sm font-mono mb-4 overflow-x-auto">
                  user_id,email,first_name,last_name,department,manager_email,status
                </div>
                
                <form onSubmit={handleUserImport}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select CSV file
                    </label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleUserFileChange}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100"
                    />
                  </div>
                  
                  {userError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                      {userError}
                    </div>
                  )}
                  
                  <button
                    type="submit"
                    disabled={userLoading || !userFile}
                    className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                  >
                    {userLoading ? 'Importing...' : 'Import Users'}
                  </button>
                </form>
                
                {userResults && (
                  <div className="mt-6">
                    <h3 className="font-medium text-gray-800 mb-2">Import Results</h3>
                    <div className="bg-green-50 border border-green-200 p-4 rounded">
                      <p className="text-green-700 mb-2">Successfully imported {userResults.users_created} users.</p>
                      
                      {userResults.errors && userResults.errors.length > 0 && (
                        <div>
                          <p className="text-amber-700 mb-1">Errors encountered ({userResults.errors.length}):</p>
                          <ul className="list-disc list-inside text-sm text-amber-600">
                            {userResults.errors.slice(0, 5).map((error: string, index: number) => (
                              <li key={index}>{error}</li>
                            ))}
                            {userResults.errors.length > 5 && <li>...and {userResults.errors.length - 5} more errors</li>}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-800 mb-2">Access Import</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Upload a CSV file containing access data. The file must have the following columns:
                </p>
                
                <div className="bg-gray-50 p-3 rounded text-sm font-mono mb-4 overflow-x-auto">
                  access_id,user_id,resource_name,resource_type,access_level,granted_date,last_used
                </div>
                
                <form onSubmit={handleAccessImport}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select CSV file
                    </label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleAccessFileChange}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100"
                    />
                  </div>
                  
                  {accessError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                      {accessError}
                    </div>
                  )}
                  
                  <button
                    type="submit"
                    disabled={accessLoading || !accessFile}
                    className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                  >
                    {accessLoading ? 'Importing...' : 'Import Access'}
                  </button>
                </form>
                
                {accessResults && (
                  <div className="mt-6">
                    <h3 className="font-medium text-gray-800 mb-2">Import Results</h3>
                    <div className="bg-green-50 border border-green-200 p-4 rounded">
                      <p className="text-green-700 mb-2">Successfully imported {accessResults.accesses_created} access records.</p>
                      
                      {accessResults.errors && accessResults.errors.length > 0 && (
                        <div>
                          <p className="text-amber-700 mb-1">Errors encountered ({accessResults.errors.length}):</p>
                          <ul className="list-disc list-inside text-sm text-amber-600">
                            {accessResults.errors.slice(0, 5).map((error: string, index: number) => (
                              <li key={index}>{error}</li>
                            ))}
                            {accessResults.errors.length > 5 && <li>...and {accessResults.errors.length - 5} more errors</li>}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          
          <div className="mt-6 p-4 bg-blue-50 rounded border border-blue-100">
            <h3 className="font-medium text-blue-800 mb-2">Tips for successful import</h3>
            <ul className="list-disc list-inside text-sm text-blue-700">
              <li>Ensure your CSV file has headers matching the expected format</li>
              <li>For user import, ensure each user has a unique user_id and email</li>
              <li>For access import, ensure each access has a unique access_id</li>
              <li>For access import, ensure the user_id references existing users</li>
              <li>Dates should be in YYYY-MM-DD format</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportPage; 