'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { getUnreadNotifications, markNotificationRead, clearAllNotifications, syncStockNotifications } from '@/app/actions/notifications';

interface NotificationType {
  id: string;
  branchId: string;
  productId: string | null;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export default function NotificationDropdown({ branchId }: { branchId: string }) {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // Pre-sync so we get fresh data
      await syncStockNotifications(branchId);
      const res = await getUnreadNotifications(branchId);
      if (res.success && res.notifications) {
        setNotifications(res.notifications);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!branchId) return;

    fetchNotifications();

    // Poll every 5 minutes
    const interval = setInterval(() => {
      fetchNotifications();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [branchId]);

  const handleClear = async (id: string) => {
    await markNotificationRead(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleClearAll = async () => {
    await clearAllNotifications(branchId);
    setNotifications([]);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none"
      >
        <Bell className="w-6 h-6 text-gray-600" />
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
            {notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50 border border-gray-200">
          <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700">Notifications</h3>
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-xs text-blue-600 hover:text-blue-800 focus:outline-none"
              >
                Clear All
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">No new notifications</div>
            ) : (
              notifications.map((notification) => (
                <div key={notification.id} className="px-4 py-3 border-b border-gray-100 bg-red-50/50 hover:bg-red-50 transition-colors flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">{notification.message}</p>
                    <span className="text-xs text-gray-500 mt-1 block">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={() => handleClear(notification.id)}
                    className="text-xs text-gray-400 hover:text-gray-600 focus:outline-none shrink-0 border p-1 rounded-sm"
                    title="Mark as read"
                  >
                    Clear
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
