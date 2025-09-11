import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Save, X, Calendar, BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PostCard } from '@/components/PostCard';

interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  exam_categories: any;
  created_at: string;
}

interface Post {
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
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

const Profile = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editForm, setEditForm] = useState({
    display_name: '',
    bio: '',
  });

  const isOwnProfile = !userId || userId === user?.id;

  useEffect(() => {
    fetchProfile();
    fetchUserPosts();
  }, [userId, user]);

  const fetchProfile = async () => {
    try {
      const targetUserId = userId || user?.id;
      if (!targetUserId) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      if (error) throw error;

      setProfile(data);
      setEditForm({
        display_name: data.display_name || '',
        bio: data.bio || '',
      });
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: 'Profil bilgileri alınamadı',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const targetUserId = userId || user?.id;
      if (!targetUserId) return;

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (
            display_name,
            avatar_url
          )
        `)
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPosts((data || []) as unknown as Post[]);
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: 'Gönderiler alınamadı',
        variant: 'destructive',
      });
    }
  };

  const handleSaveProfile = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: editForm.display_name,
          bio: editForm.bio,
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      setProfile(prev => prev ? {
        ...prev,
        display_name: editForm.display_name,
        bio: editForm.bio,
      } : null);

      setIsEditing(false);
      toast({
        title: 'Başarılı',
        description: 'Profil güncellendi',
      });
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: 'Profil güncellenemedi',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">Yükleniyor...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Profil bulunamadı</p>
          <Link to="/" className="text-primary hover:underline mt-4 inline-block">
            Ana sayfaya dön
          </Link>
        </Card>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getExamCategoriesArray = () => {
    if (!profile.exam_categories) return [];
    if (typeof profile.exam_categories === 'object') {
      return Object.keys(profile.exam_categories);
    }
    return [];
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border backdrop-blur-sm bg-opacity-90">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center text-muted-foreground hover:text-primary">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Ana Sayfa
            </Link>
            <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Profil
            </h1>
            <div className="w-16"></div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Profile Card */}
        <Card className="p-6 shadow-md border-0 bg-gradient-card mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex justify-center md:justify-start">
              <Avatar className="w-24 h-24">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {getInitials(profile.display_name || 'U')}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-4">
              {isEditing ? (
                <div className="space-y-3">
                  <Input
                    placeholder="İsim Soyisim"
                    value={editForm.display_name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, display_name: e.target.value }))}
                  />
                  <Textarea
                    placeholder="Hakkında..."
                    value={editForm.bio}
                    onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                    rows={3}
                  />
                  <div className="flex space-x-2">
                    <Button onClick={handleSaveProfile} size="sm" className="bg-gradient-primary">
                      <Save className="w-4 h-4 mr-1" />
                      Kaydet
                    </Button>
                    <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">
                      <X className="w-4 h-4 mr-1" />
                      İptal
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">{profile.display_name}</h1>
                    {isOwnProfile && (
                      <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-1" />
                        Düzenle
                      </Button>
                    )}
                  </div>
                  
                  {profile.bio && (
                    <p className="text-muted-foreground">{profile.bio}</p>
                  )}

                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 mr-1" />
                    Katılım: {new Date(profile.created_at).toLocaleDateString('tr-TR')}
                  </div>

                  {/* Exam Categories */}
                  {getExamCategoriesArray().length > 0 && (
                    <div>
                      <div className="flex items-center mb-2">
                        <BookOpen className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">İlgi Alanları:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {getExamCategoriesArray().map((category) => (
                          <Badge key={category} variant="secondary">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Posts */}
        <div>
          <h2 className="text-xl font-bold mb-4">
            {isOwnProfile ? 'Gönderileriniz' : 'Gönderiler'}
            <span className="ml-2 text-muted-foreground text-sm">({posts.length})</span>
          </h2>
          
          {posts.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Henüz gönderi bulunmuyor</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={{
                    id: post.id,
                    user: {
                      name: post.profiles?.display_name || 'Anonim Kullanıcı',
                      username: '',
                      avatar: getInitials(post.profiles?.display_name || 'U')
                    },
                    content: post.content,
                    timestamp: new Date(post.created_at).toLocaleDateString('tr-TR'),
                    interests: post.exam_categories || [],
                    likes: post.likes_count || 0,
                    comments: post.comments_count || 0,
                    shares: post.shares_count || 0,
                    isCorrectAnswer: post.is_correct_answer || false
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;