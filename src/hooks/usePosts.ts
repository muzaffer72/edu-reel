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
  correct_comment_id: string | null;
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
      
      // First get posts
      const { data: postsData, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Then get profiles for each post
      if (postsData && postsData.length > 0) {
        const userIds = [...new Set(postsData.map(post => post.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', userIds);

        // Merge profile data with posts
        const postsWithProfiles = postsData.map(post => ({
          ...post,
          profiles: profilesData?.find(profile => profile.user_id === post.user_id) || null
        }));

        // Check which posts the user has liked
        if (user) {
          const postIds = postsWithProfiles.map(post => post.id);
          const { data: likesData } = await supabase
            .from('likes')
            .select('post_id')
            .eq('user_id', user.id)
            .in('post_id', postIds);

          const likedPostIds = new Set(likesData?.map(like => like.post_id) || []);
          
          const postsWithLikes = postsWithProfiles.map(post => ({
            ...post,
            user_liked: likedPostIds.has(post.id)
          }));

          setPosts(postsWithLikes as unknown as Post[]);
        } else {
          setPosts(postsWithProfiles as unknown as Post[]);
        }
      } else {
        setPosts([]);
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

  const createPost = async (content: string, examCategories: string[] = [], attachments: string[] = [], aiResponseEnabled: boolean = false) => {
    if (!user) return;

    try {
      const insertData: any = {
        content,
        exam_categories: examCategories,
        user_id: user.id,
        post_type: 'text',
        ai_response_enabled: aiResponseEnabled
      };

      // Handle different types of attachments
      if (attachments.length > 0) {
        const firstAttachment = attachments[0];
        
        // Check if it's an image
        if (firstAttachment.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          insertData.image_url = firstAttachment;
          insertData.post_type = 'image';
        }
        // Check if it's a video
        else if (firstAttachment.match(/\.(mp4|webm|ogg|mov)$/i)) {
          insertData.video_url = firstAttachment;
          insertData.post_type = 'video';
        }
        // For other files, treat as attachment
        else {
          insertData.image_url = firstAttachment;
        }
      }

      const { data: postData, error } = await supabase
        .from('posts')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;

      // If AI response is enabled, trigger the AI response function
      if (aiResponseEnabled && postData) {
        try {
          const imageUrl = insertData.image_url || null;
          
          await supabase.functions.invoke('ai-response', {
            body: {
              postId: postData.id,
              content: content,
              imageUrl: imageUrl
            }
          });
        } catch (aiError) {
          console.error('AI response error:', aiError);
          // Don't fail the post creation if AI response fails
        }
      }

      toast({
        title: 'Başarılı',
        description: aiResponseEnabled ? 'Gönderi paylaşıldı, AI yanıt hazırlanıyor...' : 'Gönderi paylaşıldı',
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