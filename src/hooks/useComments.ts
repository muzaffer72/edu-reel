import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface Profile {
  display_name: string | null;
  avatar_url: string | null;
}

export interface CommentItem {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  attachment_url: string | null;
  created_at: string;
  parent_id: string | null;
  proposed_as_correct: boolean;
  profiles: Profile | null;
}

export const useComments = (postId: string) => {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptedCommentId, setAcceptedCommentId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('comments')
        .select(`*, profiles(display_name, avatar_url)`)  
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments((data as unknown as CommentItem[]) || []);
    } catch (e) {
      toast({ title: 'Hata', description: 'Yorumlar yüklenemedi', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [postId, toast]);

  const fetchAccepted = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('correct_comment_id')
        .eq('id', postId)
        .maybeSingle();
      if (error) throw error;
      setAcceptedCommentId((data as any)?.correct_comment_id ?? null);
    } catch (e) {
      // noop
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
    fetchAccepted();

    const commentsChannel = supabase
      .channel(`comments-${postId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` }, () => {
        fetchComments();
      })
      .subscribe();

    const postsChannel = supabase
      .channel(`posts-accepted-${postId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'posts', filter: `id=eq.${postId}` }, (payload: any) => {
        setAcceptedCommentId(payload.new.correct_comment_id || null);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(postsChannel);
    };
  }, [postId, fetchComments, fetchAccepted]);

  const addComment = async (content: string, attachment_url: string | null = null, parent_id: string | null = null) => {
    if (!user) return false;
    try {
      const { error } = await supabase.from('comments').insert([
        { post_id: postId, user_id: user.id, content, attachment_url, parent_id }
      ]);
      if (error) throw error;
      return true;
    } catch (e: any) {
      toast({ title: 'Hata', description: 'Yorum gönderilemedi', variant: 'destructive' });
      return false;
    }
  };

  const toggleProposed = async (commentId: string, value: boolean) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('comments')
        .update({ proposed_as_correct: value })
        .eq('id', commentId)
        .eq('user_id', user.id);
      if (error) throw error;
    } catch (e) {
      toast({ title: 'Hata', description: 'İşlem başarısız', variant: 'destructive' });
    }
  };

  const acceptAsCorrect = async (commentId: string | null) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('posts')
        .update({ correct_comment_id: commentId, is_correct_answer: !!commentId })
        .eq('id', postId)
        .eq('user_id', user.id);
      if (error) throw error;
      toast({ title: 'Başarılı', description: commentId ? 'Doğru cevap belirlendi' : 'Doğru cevap kaldırıldı' });
    } catch (e) {
      toast({ title: 'Hata', description: 'İşlem başarısız', variant: 'destructive' });
    }
  };

  return { comments, loading, addComment, toggleProposed, acceptAsCorrect, acceptedCommentId };
};
