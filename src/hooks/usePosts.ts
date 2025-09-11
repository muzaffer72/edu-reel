import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Post {
  id: string;
  content: string;
  image_url: string | null;
  video_url: string | null;
  video_thumbnail: string | null;
  video_duration: string | null;
  exam_categories: string[] | null;
  post_type: string;
  is_correct_answer: boolean | null;
  likes_count: number | null;
  comments_count: number | null;
  shares_count: number | null;
  created_at: string;
  user_id: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  user_liked?: boolean;
}

export const usePosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchPosts();
      
      // Real-time subscription for posts
      const channel = supabase
        .channel('posts-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'posts'
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              fetchPosts(); // Refresh posts when new post is added
            } else if (payload.eventType === 'UPDATE') {
              setPosts(prevPosts => 
                prevPosts.map(post => 
                  post.id === payload.new.id 
                    ? { ...post, ...payload.new }
                    : post
                )
              );
            } else if (payload.eventType === 'DELETE') {
              setPosts(prevPosts => 
                prevPosts.filter(post => post.id !== payload.old.id)
              );
            }
          }
        )
        .subscribe();

      // Real-time subscription for likes
      const likesChannel = supabase
        .channel('likes-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'likes'
          },
          () => {
            fetchPosts(); // Refresh posts when likes change
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
        supabase.removeChannel(likesChannel);
      };
    }
  }, [user]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (
            display_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Check which posts the user has liked
      if (user && postsData) {
        const postIds = postsData.map(post => post.id);
        const { data: likesData } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postIds);

        const likedPostIds = new Set(likesData?.map(like => like.post_id) || []);
        
        const postsWithLikes = postsData.map(post => ({
          ...post,
          user_liked: likedPostIds.has(post.id)
        }));

        setPosts(postsWithLikes as unknown as Post[]);
      } else {
        setPosts((postsData || []) as unknown as Post[]);
      }
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: 'Gönderiler yüklenemedi',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createPost = async (content: string, examCategories: string[] = []) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('posts')
        .insert([
          {
            content,
            exam_categories: examCategories,
            user_id: user.id,
            post_type: 'text'
          }
        ]);

      if (error) throw error;

      toast({
        title: 'Başarılı',
        description: 'Gönderi paylaşıldı',
      });

      return true;
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: 'Gönderi paylaşılamadı',
        variant: 'destructive',
      });
      return false;
    }
  };

  const toggleLike = async (postId: string) => {
    if (!user) return;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      if (post.user_liked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);

        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert([
            {
              user_id: user.id,
              post_id: postId
            }
          ]);

        if (error) throw error;
      }
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: 'İşlem başarısız',
        variant: 'destructive',
      });
    }
  };

  const toggleCorrectAnswer = async (postId: string) => {
    if (!user) return;

    const post = posts.find(p => p.id === postId);
    if (!post || post.user_id !== user.id) return;

    try {
      const { error } = await supabase
        .from('posts')
        .update({ is_correct_answer: !post.is_correct_answer })
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: 'Başarılı',
        description: post.is_correct_answer ? 'Doğru cevap işareti kaldırıldı' : 'Doğru cevap olarak işaretlendi',
      });
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: 'İşlem başarısız',
        variant: 'destructive',
      });
    }
  };

  return {
    posts,
    loading,
    createPost,
    toggleLike,
    toggleCorrectAnswer,
    fetchPosts
  };
};