import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import StatusHeader from './StatusHeader';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Fetch notification count on mount
  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const response = await fetch('/api/notifications/notifications/unread-count/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });
        const data = await response.json();
        setUnreadCount(data.count);
      } catch (error) {
        console.error('Failed to fetch notification count:', error);
      }
    };

    fetchNotificationCount();
    // Set up interval to check for new notifications
    const interval = setInterval(fetchNotificationCount, 60000); // every minute
    
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { path: '/campaigns', label: 'Campaigns', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { path: '/reviews', label: 'Reviews', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { path: '/reports', label: 'Reports', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  ];

  // Admin-only nav items
  const adminItems = [
    { path: '/import', label: 'Import Data', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div 
        className={`${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        } bg-gradient-to-b from-blue-900 to-blue-700 text-white fixed inset-y-0 left-0 z-30 transition-all duration-300 ease-in-out`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 border-b border-blue-800">
            <Link to="/dashboard" className="flex items-center">
              <img 
                src="/condaura-ogo-mini.png" 
                alt="Condaura Logo" 
                className={`h-8 ${isSidebarCollapsed ? 'mx-auto' : 'mr-2'}`} 
              />
              {!isSidebarCollapsed && (
                <span className="text-xl font-bold text-white">Condaura</span>
              )}
            </Link>
          </div>
          
          {/* Toggle sidebar button */}
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute right-0 mt-20 bg-blue-800 rounded-l-md p-1 transform translate-x-1/2"
          >
            <svg 
              className={`h-4 w-4 text-white transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          {/* Navigation Links */}
          <nav className="flex-1 px-2 py-4 overflow-y-auto">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center ${
                      isSidebarCollapsed ? 'justify-center' : 'px-4'
                    } py-2 rounded-md ${
                      isActive(item.path)
                        ? 'bg-blue-800 text-white'
                        : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                    } transition-colors duration-200`}
                  >
                    <svg
                      className={`h-6 w-6 ${isSidebarCollapsed ? 'mx-auto' : 'mr-3'}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={item.icon}
                      />
                    </svg>
                    {!isSidebarCollapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              ))}
              
              {/* Admin Items */}
              {(user?.role?.toLowerCase() === 'admin' || user?.is_staff) && (
                <>
                  <li className="mt-6 mb-2">
                    {!isSidebarCollapsed && (
                      <span className="px-4 text-xs font-semibold text-blue-300 uppercase tracking-wider">
                        Admin
                      </span>
                    )}
                    {isSidebarCollapsed && <hr className="border-blue-800 mx-2" />}
                  </li>
                  
                  {adminItems.map((item) => (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={`flex items-center ${
                          isSidebarCollapsed ? 'justify-center' : 'px-4'
                        } py-2 rounded-md ${
                          isActive(item.path)
                            ? 'bg-blue-800 text-white'
                            : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                        } transition-colors duration-200`}
                      >
                        <svg
                          className={`h-6 w-6 ${isSidebarCollapsed ? 'mx-auto' : 'mr-3'}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d={item.icon}
                          />
                        </svg>
                        {!isSidebarCollapsed && <span>{item.label}</span>}
                      </Link>
                    </li>
                  ))}
                </>
              )}
            </ul>
          </nav>
          
          {/* User Profile Section */}
          <div className={`p-4 border-t border-blue-800 ${isSidebarCollapsed ? 'text-center' : ''}`}>
            <Link
              to="/profile"
              className="flex items-center text-blue-100 hover:text-white transition-colors duration-200"
            >
              <div className={`bg-blue-800 rounded-full h-10 w-10 flex items-center justify-center ${isSidebarCollapsed ? 'mx-auto mb-2' : 'mr-3'}`}>
                <span className="text-lg font-semibold">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </span>
              </div>
              {!isSidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-blue-300 truncate">
                    {user?.role}
                  </p>
                </div>
              )}
            </Link>
            
            {!isSidebarCollapsed && (
              <button
                onClick={handleLogout}
                className="mt-4 w-full flex items-center justify-center px-4 py-2 text-sm text-blue-100 bg-blue-800 rounded-md hover:bg-blue-900 transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            )}
            
            {isSidebarCollapsed && (
              <button
                onClick={handleLogout}
                className="mt-2 w-full flex items-center justify-center p-2 text-sm text-blue-100 bg-blue-800 rounded-md hover:bg-blue-900 transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        {/* Status Header */}
        <StatusHeader />
        
        {/* Top Header */}
        <header className="bg-white shadow-sm z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-2xl font-semibold text-gray-900">
                {location.pathname === '/dashboard' && 'Dashboard'}
                {location.pathname === '/campaigns' && 'Campaigns'}
                {location.pathname === '/campaigns/create' && 'Create Campaign'}
                {location.pathname.match(/^\/campaigns\/\d+$/) && 'Campaign Details'}
                {location.pathname === '/reviews' && 'Reviews'}
                {location.pathname === '/reports' && 'Reports & Analytics'}
                {location.pathname === '/import' && 'Import Data'}
                {location.pathname === '/profile' && 'Profile Settings'}
              </h1>
              
              <div className="flex items-center">
                {/* Notifications */}
                <div className="relative mr-4">
                  <Link
                    to="/notifications"
                    className="p-2 rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-50 focus:outline-none"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>
                </div>
                
                {/* Mobile menu button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden p-2 rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-50 focus:outline-none"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>
        
        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white shadow-md">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive(item.path)
                      ? 'bg-blue-700 text-white'
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              
              {(user?.role?.toLowerCase() === 'admin' || user?.is_staff) && adminItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive(item.path)
                      ? 'bg-blue-700 text-white'
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              
              <div className="border-t border-gray-200 pt-2">
                <Link
                  to="/profile"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Profile Settings
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout; 