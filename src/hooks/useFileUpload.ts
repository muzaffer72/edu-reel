import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const uploadFile = async (file: File, bucket: 'avatars' | 'attachments') => {
    if (!user) {
      toast({
        title: 'Hata',
        description: 'Dosya yüklemek için giriş yapmanız gerekiyor',
        variant: 'destructive',
      });
      return null;
    }

    if (file.size > 20 * 1024 * 1024) { // 20MB limit
      toast({
        title: 'Hata',
        description: 'Dosya boyutu 20MB\'dan büyük olamaz',
        variant: 'destructive',
      });
      return null;
    }

    setUploading(true);
    
    try {
      // Create file name with user folder
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      toast({
        title: 'Başarılı',
        description: 'Dosya yüklendi',
      });

      return publicUrl;
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: 'Dosya yüklenemedi: ' + error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadFile,
    uploading
  };
};