import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface AdminSettings {
  app_name: string;
  app_logo: string | null;
  ai_enabled: boolean;
  ai_model: string;
  max_posts_per_day: number;
  registration_enabled: boolean;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'user';
  created_at: string;
}

export interface BlockedUser {
  id: string;
  user_id: string;
  blocked_by: string;
  reason: string | null;
  blocked_at: string;
  profiles?: {
    display_name: string | null;
  };
}

export const useAdmin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      checkAdminRole();
      fetchSettings();
    }
  }, [user]);

  const checkAdminRole = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) throw error;
      setIsAdmin(!!data);
    } catch (error: any) {
      console.error('Error checking admin role:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*');

      if (error) throw error;

      const settingsObj: any = {};
      data?.forEach(setting => {
        settingsObj[setting.key] = setting.value;
      });

      setSettings(settingsObj);
    } catch (error: any) {
      console.error('Error fetching settings:', error);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    if (!isAdmin) return;

    try {
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          key,
          value: JSON.stringify(value)
        });

      if (error) throw error;

      setSettings(prev => prev ? { ...prev, [key]: value } : null);
      
      toast({
        title: 'Başarılı',
        description: 'Ayar güncellendi',
      });
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: 'Ayar güncellenemedi',
        variant: 'destructive',
      });
    }
  };

  const blockUser = async (userId: string, reason?: string) => {
    if (!isAdmin || !user) return;

    try {
      const { error } = await supabase
        .from('blocked_users')
        .insert({
          user_id: userId,
          blocked_by: user.id,
          reason
        });

      if (error) throw error;

      toast({
        title: 'Başarılı',
        description: 'Kullanıcı engellendi',
      });
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: 'Kullanıcı engellenemedi',
        variant: 'destructive',
      });
    }
  };

  const unblockUser = async (userId: string) => {
    if (!isAdmin) return;

    try {
      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Başarılı',
        description: 'Kullanıcı engeli kaldırıldı',
      });
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: 'Engel kaldırılamadı',
        variant: 'destructive',
      });
    }
  };

  const assignRole = async (userId: string, role: 'admin' | 'moderator' | 'user') => {
    if (!isAdmin) return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role
        });

      if (error) throw error;

      toast({
        title: 'Başarılı',
        description: 'Rol atandı',
      });
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: 'Rol atanamadı',
        variant: 'destructive',
      });
    }
  };

  const sendNotification = async (title: string, message: string, targetUsers?: string[]) => {
    if (!isAdmin || !user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          title,
          message,
          target_users: targetUsers || null,
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: 'Başarılı',
        description: 'Bildirim gönderildi',
      });
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: 'Bildirim gönderilemedi',
        variant: 'destructive',
      });
    }
  };

  const getBlockedUsers = async (): Promise<any[]> => {
    if (!isAdmin) return [];

    try {
      const { data: blockedData, error } = await supabase
        .from('blocked_users')
        .select('*')
        .order('blocked_at', { ascending: false });

      if (error) throw error;

      // Get profile data separately
      if (blockedData && blockedData.length > 0) {
        const userIds = blockedData.map(b => b.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', userIds);

        return blockedData.map(blocked => ({
          ...blocked,
          profiles: profilesData?.find(p => p.user_id === blocked.user_id) || null
        }));
      }

      return blockedData || [];
    } catch (error: any) {
      console.error('Error fetching blocked users:', error);
      return [];
    }
  };

  const getAllUsers = async () => {
    if (!isAdmin) return [];

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles (role)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching users:', error);
      return [];
    }
  };

  return {
    isAdmin,
    loading,
    settings,
    updateSetting,
    blockUser,
    unblockUser,
    assignRole,
    sendNotification,
    getBlockedUsers,
    getAllUsers,
    fetchSettings
  };
};