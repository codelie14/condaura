import React, { useState, useEffect } from 'react';

const StatusHeader: React.FC = () => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Update date and time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Listen to online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Format date and time
  const formattedDate = currentDateTime.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formattedTime = currentDateTime.toLocaleTimeString();

  return (
    <div className="bg-gray-800 text-white text-xs py-1 px-4">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        <div>
          {formattedDate} | {formattedTime}
        </div>
        <div className="flex items-center">
          <span className="mr-2">Connection Status:</span>
          {isOnline ? (
            <span className="flex items-center text-green-400">
              <span className="h-2 w-2 rounded-full bg-green-400 mr-1"></span>
              Online
            </span>
          ) : (
            <span className="flex items-center text-red-400">
              <span className="h-2 w-2 rounded-full bg-red-400 mr-1"></span>
              Offline
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusHeader; 