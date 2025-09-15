import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  read_at: string | null;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Subscribe to new notifications
      const channel = supabase
        .channel('notifications')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'notifications',
        }, () => {
          fetchNotifications();
        })
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      // Get notifications for this user
      const { data: notificationData, error: notificationError } = await supabase
        .from('notifications')
        .select('*')
        .or(`target_users.is.null,target_users.cs.{${user.id}}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (notificationError) throw notificationError;

      // Get user notification status
      const notificationIds = notificationData?.map(n => n.id) || [];
      const { data: userNotifications, error: userNotificationError } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .in('notification_id', notificationIds);

      if (userNotificationError) {
        console.error('Error fetching user notifications:', userNotificationError);
      }

      // Combine notifications with read status
      const enrichedNotifications = notificationData?.map(notification => ({
        ...notification,
        read_at: userNotifications?.find(un => un.notification_id === notification.id)?.read_at || null
      })) || [];

      setNotifications(enrichedNotifications);
      setUnreadCount(enrichedNotifications.filter(n => !n.read_at).length);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_notifications')
        .upsert({
          user_id: user.id,
          notification_id: notificationId,
          read_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,notification_id'
        });

      if (error) throw error;

      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const unreadNotifications = notifications.filter(n => !n.read_at);
      
      const { error } = await supabase
        .from('user_notifications')
        .upsert(
          unreadNotifications.map(n => ({
            user_id: user.id,
            notification_id: n.id,
            read_at: new Date().toISOString()
          })),
          { onConflict: 'user_id,notification_id' }
        );

      if (error) throw error;

      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    fetchNotifications
  };
};