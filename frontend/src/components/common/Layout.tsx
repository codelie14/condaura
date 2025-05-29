import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import NotificationService from '../../services/notification.service';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchUnreadNotifications = async () => {
      try {
        const count = await NotificationService.getUnreadCount();
        setUnreadNotifications(count);
      } catch (error) {
        console.error('Failed to fetch unread notifications:', error);
      }
    };

    // Fetch initially and then every minute
    fetchUnreadNotifications();
    const interval = setInterval(fetchUnreadNotifications, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <Link to="/dashboard" className="text-2xl font-bold text-primary">
              Condaura
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              to="/dashboard" 
              className={`text-sm font-medium ${isActive('/dashboard') ? 'text-accent1' : 'text-gray-700 hover:text-accent1'}`}
            >
              Dashboard
            </Link>
            <Link 
              to="/campaigns" 
              className={`text-sm font-medium ${isActive('/campaigns') ? 'text-accent1' : 'text-gray-700 hover:text-accent1'}`}
            >
              Campaigns
            </Link>
            <Link 
              to="/reviews" 
              className={`text-sm font-medium ${isActive('/reviews') ? 'text-accent1' : 'text-gray-700 hover:text-accent1'}`}
            >
              Reviews
            </Link>
            <Link 
              to="/notifications" 
              className="relative text-sm font-medium text-gray-700 hover:text-accent1"
            >
              Notifications
              {unreadNotifications > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </Link>
          </nav>
          
          {/* User Menu */}
          <div className="flex items-center">
            <div className="relative group">
              <button className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-700">
                  {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
                </div>
                <span className="hidden md:inline-block text-sm font-medium">
                  {user?.first_name} {user?.last_name}
                </span>
              </button>
              
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  My Profile
                </Link>
                <Link to="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Settings
                </Link>
                <button 
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            </div>
            
            {/* Mobile Menu Button */}
            <button 
              className="ml-4 md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t">
            <div className="container mx-auto px-4 py-2 space-y-1">
              <Link 
                to="/dashboard" 
                className={`block py-2 px-3 rounded-md ${isActive('/dashboard') ? 'bg-gray-100 text-accent1' : 'text-gray-700'}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link 
                to="/campaigns" 
                className={`block py-2 px-3 rounded-md ${isActive('/campaigns') ? 'bg-gray-100 text-accent1' : 'text-gray-700'}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Campaigns
              </Link>
              <Link 
                to="/reviews" 
                className={`block py-2 px-3 rounded-md ${isActive('/reviews') ? 'bg-gray-100 text-accent1' : 'text-gray-700'}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Reviews
              </Link>
              <Link 
                to="/notifications" 
                className={`block py-2 px-3 rounded-md ${isActive('/notifications') ? 'bg-gray-100 text-accent1' : 'text-gray-700'}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Notifications {unreadNotifications > 0 && `(${unreadNotifications})`}
              </Link>
              <Link 
                to="/profile" 
                className={`block py-2 px-3 rounded-md ${isActive('/profile') ? 'bg-gray-100 text-accent1' : 'text-gray-700'}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                My Profile
              </Link>
              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="block w-full text-left py-2 px-3 rounded-md text-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </header>
      
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-6">
          {children}
        </div>
      </main>
      
      <footer className="bg-white border-t py-4">
        <div className="container mx-auto px-4">
          <div className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Condaura. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout; 