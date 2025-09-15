import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Share2, CheckCircle, Video, Image as ImageIcon, Plus, User, LogOut, Paperclip, X, Bot, Settings, ChevronDown, Filter, TrendingUp, Sparkles } from 'lucide-react';
import { PostCard } from '@/components/PostCard';
import { VideoPost } from '@/components/VideoPost';
import { InterestsSelection } from '@/components/InterestsSelection';
import { useAuth } from '@/contexts/AuthContext';
import { usePosts } from '@/hooks/usePosts';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useFileUpload } from '@/hooks/useFileUpload';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { NotificationDropdown } from '@/components/NotificationDropdown';

interface SelectedCategories {
  [mainCategory: string]: string[];
}

const Index = () => {
  const { user, signOut } = useAuth();
  const { posts, loading, createPost, toggleLike, toggleCorrectAnswer, fetchPosts } = usePosts();
  const { isAdmin } = useAdmin();
  const { toast } = useToast();
  const { uploadFile, uploading } = useFileUpload();
  const [showInterests, setShowInterests] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<SelectedCategories>({});
  const [newPost, setNewPost] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [aiResponseEnabled, setAiResponseEnabled] = useState(false);
  const [selectedPostCategory, setSelectedPostCategory] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [editingPost, setEditingPost] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const examCategories = {
    'KPSS': ['Matematik', 'Geometri', 'Türkçe', 'Tarih', 'Coğrafya', 'Vatandaşlık', 'Genel Kültür', 'Anayasa'],
    'TYT': ['Matematik', 'Geometri', 'Türkçe', 'Tarih', 'Coğrafya', 'Felsefe', 'Fizik', 'Kimya', 'Biyoloji'],
    'AYT': ['Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Türk Dili ve Edebiyatı', 'Tarih-1', 'Coğrafya-1', 'Felsefe'],
    'DGS': ['Matematik', 'Türkçe', 'Sözel Mantık', 'Sayısal Mantık'],
    'ALES': ['Matematik', 'Türkçe', 'Sözel Mantık', 'Sayısal Mantık'],
    'YÖKDİL': ['İngilizce', 'Almanca', 'Fransızca', 'Rusça', 'Arapça'],
    'Öğretmenlik (KPSS)': ['ÖABT Matematik', 'ÖABT Türkçe', 'ÖABT Fen', 'ÖABT Sosyal', 'Eğitim Bilimleri', 'Genel Kültür'],
    'MSÜ': ['Matematik', 'Fizik', 'Kimya', 'Türkçe', 'Tarih', 'Coğrafya'],
    'PMYO': ['Matematik', 'Türkçe', 'Genel Kültür', 'IQ-Mantık']
  };

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setProfile(data);
      if (data.exam_categories && Object.keys(data.exam_categories).length > 0) {
        setSelectedCategories(data.exam_categories as SelectedCategories);
      } else {
        setShowInterests(true);
      }
      } else {
        setShowInterests(true);
      }
    } catch (error: any) {
      console.error('Profile fetch error:', error);
      setShowInterests(true);
    }
  };


  const handleInterestComplete = async (selected: SelectedCategories) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ exam_categories: selected })
        .eq('user_id', user?.id);

      if (error) throw error;

      setSelectedCategories(selected);
      setShowInterests(false);
      
      toast({
        title: 'Başarılı',
        description: 'İlgi alanlarınız kaydedildi',
      });
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: 'İlgi alanları kaydedilemedi',
        variant: 'destructive',
      });
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'file') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const bucket = type === 'image' || type === 'video' ? 'attachments' : 'attachments';
    const url = await uploadFile(file, bucket);
    
    if (url) {
      setAttachments(prev => [...prev, url]);
    }
    
    // Reset input
    event.target.value = '';
  };

  const handlePostSubmit = async () => {
    if (!newPost.trim() || !selectedPostCategory) {
      toast({
        title: 'Hata',
        description: 'Lütfen gönderi içeriği ve kategori seçin',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    const success = await createPost(newPost, [selectedPostCategory], attachments, aiResponseEnabled);
    
    if (success) {
      setNewPost('');
      setAttachments([]);
      setAiResponseEnabled(false);
      setSelectedPostCategory('');
    }
    setSubmitting(false);
  };

  const handleEditPost = (post: any) => {
    setEditingPost(post);
    setNewPost(post.content);
    setSelectedPostCategory(post.exam_categories?.[0] || '');
    setShowEditDialog(true);
  };

  const handleUpdatePost = async () => {
    if (!editingPost || !newPost.trim() || !selectedPostCategory) return;

    try {
      const { error } = await supabase
        .from('posts')
        .update({
          content: newPost,
          exam_categories: [selectedPostCategory],
          updated_at: new Date().toISOString()
        })
        .eq('id', editingPost.id);

      if (error) throw error;

      toast({
        title: 'Başarılı',
        description: 'Gönderi güncellendi',
      });

      setShowEditDialog(false);
      setEditingPost(null);
      setNewPost('');
      setSelectedPostCategory('');
      fetchPosts();
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: 'Gönderi güncellenemedi',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Bu gönderiyi silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: 'Başarılı',
        description: 'Gönderi silindi',
      });

      fetchPosts();
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: 'Gönderi silinemedi',
        variant: 'destructive',
      });
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Seçilen tüm kategorileri düz liste olarak al
  const getAllSelectedSubjects = () => {
    const subjects: string[] = [];
    Object.entries(selectedCategories).forEach(([mainCat, subCats]) => {
      subjects.push(...subCats);
    });
    return subjects;
  };

  // Filter posts by category
  const filteredPosts = categoryFilter === 'all' 
    ? posts 
    : posts.filter(post => 
        post.exam_categories?.some(cat => 
          cat.toLowerCase().includes(categoryFilter.toLowerCase())
        )
      );

  if (showInterests) {
    return <InterestsSelection examCategories={examCategories} onComplete={handleInterestComplete} />;
  }

  // Check if AI response should be available (only for text and image posts)
  const hasVideoFiles = attachments.some(url => 
    url.includes('/video/') || 
    url.toLowerCase().includes('.mp4') || 
    url.toLowerCase().includes('.webm') || 
    url.toLowerCase().includes('.mov')
  );
  
  const hasNonImageFiles = attachments.some(url => 
    !url.includes('/images/') && 
    !url.includes('/video/') &&
    !url.toLowerCase().includes('.jpg') &&
    !url.toLowerCase().includes('.jpeg') &&
    !url.toLowerCase().includes('.png') &&
    !url.toLowerCase().includes('.gif') &&
    !url.toLowerCase().includes('.webp')
  );

  const canEnableAiResponse = !hasVideoFiles && !hasNonImageFiles;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Modern Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border/50 shadow-elegant">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  EduSocial
                </h1>
              </div>
              
              {/* Modern Category Pills */}
              <div className="hidden md:flex items-center space-x-2">
                {Object.keys(selectedCategories).slice(0, 3).map((category) => (
                  <div key={category} className="group relative">
                    <Badge 
                      variant="secondary" 
                      className="text-xs hover:bg-primary/10 transition-all duration-200 hover-scale"
                    >
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {category}
                    </Badge>
                  </div>
                ))}
                {Object.keys(selectedCategories).length > 3 && (
                  <Badge variant="outline" className="text-xs hover:bg-muted/50 transition-colors">
                    +{Object.keys(selectedCategories).length - 3} daha
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Modern Action Buttons */}
            <div className="flex items-center space-x-2">
              <NotificationDropdown />
              
              <div className="flex items-center space-x-1 bg-muted/30 rounded-lg p-1">
                <Link to="/profile">
                  <Button variant="ghost" size="sm" className="hover:bg-background/80">
                    <User className="w-4 h-4 mr-1" />
                    Profil
                  </Button>
                </Link>
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="ghost" size="sm" className="hover:bg-background/80">
                      <Settings className="w-4 h-4 mr-1" />
                      Admin
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" size="sm" onClick={handleLogout} className="hover:bg-destructive/10 hover:text-destructive">
                  <LogOut className="w-4 h-4 mr-1" />
                  Çıkış
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Modern New Post Card */}
          <Card className="p-6 shadow-elegant border-0 bg-gradient-card hover:shadow-glow transition-all duration-300 animate-fade-in">
            <div className="flex space-x-4">
              <Avatar>
                {profile?.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt="Profil fotoğrafı" />
                ) : (
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {profile?.display_name ? getInitials(profile.display_name) : 'U'}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1 space-y-4">
                <Textarea
                  placeholder="Bir soru sor veya bilgini paylaş..."
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="min-h-[100px] border-0 bg-transparent resize-none focus-visible:ring-0 placeholder:text-muted-foreground"
                />
                {/* Attachments Preview */}
                {attachments.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {attachments.map((url, index) => (
                      <div key={index} className="relative">
                        <img src={url} alt="Ek" className="w-full h-32 object-cover rounded" />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-1 right-1 bg-black/50 text-white hover:bg-black/70"
                          onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* AI Response Checkbox - only show for text and image posts */}
                {canEnableAiResponse && (
                  <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg border border-border/50">
                    <Checkbox 
                      id="ai-response" 
                      checked={aiResponseEnabled}
                      onCheckedChange={(checked) => setAiResponseEnabled(checked as boolean)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    />
                    <label 
                      htmlFor="ai-response" 
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 cursor-pointer"
                    >
                      <Bot className="w-4 h-4 text-primary" />
                      Yapay zeka yanıt versin
                    </label>
                  </div>
                )}

                {/* Category Selection for Post */}
                <div className="space-y-2">
                  <Label htmlFor="postCategory">Kategori Seçin</Label>
                  <Select value={selectedPostCategory} onValueChange={setSelectedPostCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Gönderi kategorisi seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(examCategories).map(([mainCat, subCats]) => (
                        <div key={mainCat}>
                          <div className="px-2 py-1 text-sm font-semibold text-muted-foreground">
                            {mainCat}
                          </div>
                          {subCats.map((subCat) => (
                            <SelectItem key={`${mainCat}-${subCat}`} value={subCat}>
                              {subCat}
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <label className="cursor-pointer">
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary" asChild>
                        <span>
                          <ImageIcon className="w-4 h-4 mr-2" />
                          Resim
                        </span>
                      </Button>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'image')}
                        disabled={uploading}
                      />
                    </label>
                    
                    <label className="cursor-pointer">
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-secondary" asChild>
                        <span>
                          <Video className="w-4 h-4 mr-2" />
                          Video
                        </span>
                      </Button>
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'video')}
                        disabled={uploading}
                      />
                    </label>
                    
                    <label className="cursor-pointer">
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-accent" asChild>
                        <span>
                          <Paperclip className="w-4 h-4 mr-2" />
                          Dosya
                        </span>
                      </Button>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'file')}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                  <Button 
                    onClick={handlePostSubmit}
                    disabled={!newPost.trim() || !selectedPostCategory || submitting || uploading}
                    className="bg-gradient-primary hover:opacity-90 transition-all shadow-glow"
                  >
                    {uploading ? 'Yükleniyor...' : submitting ? 'Paylaşılıyor...' : 'Paylaş'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Modern Category Filter */}
          <Card className="p-4 border-0 bg-gradient-card shadow-elegant animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Filter className="w-5 h-5 text-primary" />
                <Label htmlFor="categoryFilter" className="font-medium">Kategori Filtrele:</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-48 border-border/50 hover:border-primary/50 transition-colors">
                    <SelectValue placeholder="Kategori seç" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-3 h-3" />
                        <span>Tüm Kategoriler</span>
                      </div>
                    </SelectItem>
                    {Object.entries(examCategories).map(([mainCat, subCats]) => (
                      <div key={mainCat}>
                        <div className="px-2 py-1 text-sm font-semibold text-primary bg-primary/5">
                          {mainCat}
                        </div>
                        {subCats.map((subCat) => (
                          <SelectItem key={`filter-${mainCat}-${subCat}`} value={subCat}>
                            <div className="flex items-center space-x-2">
                              <TrendingUp className="w-3 h-3 text-muted-foreground" />
                              <span>{subCat}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground bg-muted/30 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span>{filteredPosts.length} gönderi</span>
              </div>
            </div>
          </Card>

          {/* Modern Posts Feed */}
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <div className="text-muted-foreground">Gönderiler yükleniyor...</div>
                </div>
              </div>
            ) : filteredPosts.length === 0 ? (
              <Card className="p-12 text-center border-0 bg-gradient-card shadow-elegant">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium text-foreground">
                      {categoryFilter === 'all' 
                        ? 'Henüz gönderi bulunmuyor'
                        : `${categoryFilter} kategorisinde gönderi bulunmuyor`
                      }
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {categoryFilter === 'all' 
                        ? 'İlk gönderiyi sen paylaş ve topluluğu büyütmeye başla!'
                        : 'Bu kategoride ilk gönderiyi sen paylaş!'
                      }
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="space-y-6">
                {filteredPosts.map((post, index) => (
                <div key={post.id} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                  <PostCard
                    post={{
                    id: post.id,
                    user: {
                      name: post.profiles?.display_name || 'Anonim Kullanıcı',
                      username: '',
                      avatar: getInitials(post.profiles?.display_name || 'A'),
                      avatar_url: post.profiles?.avatar_url || undefined
                    },
                    content: post.content,
                    timestamp: new Date(post.created_at).toLocaleString('tr-TR'),
                    interests: post.exam_categories || [],
                    likes: post.likes_count || 0,
                    comments: post.comments_count || 0,
                    shares: post.shares_count || 0,
                    isCorrectAnswer: post.is_correct_answer || false,
                    user_liked: post.user_liked,
                    user_id: post.user_id,
                    attachments: post.image_url ? [post.image_url] : []
                    }}
                    onLike={() => toggleLike(post.id)}
                    onToggleCorrectAnswer={() => toggleCorrectAnswer(post.id)}
                    onEdit={() => handleEditPost(post)}
                    onDelete={() => handleDeletePost(post.id)}
                    currentUserId={user?.id}
                  />
                </div>
              ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modern Edit Post Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md border-0 shadow-glow">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-primary rounded flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              <span>Gönderiyi Düzenle</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editContent">İçerik</Label>
              <Textarea
                id="editContent"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="Gönderi içeriği..."
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editCategory">Kategori</Label>
              <Select value={selectedPostCategory} onValueChange={setSelectedPostCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(examCategories).map(([mainCat, subCats]) => (
                    <div key={mainCat}>
                      <div className="px-2 py-1 text-sm font-semibold text-muted-foreground">
                        {mainCat}
                      </div>
                      {subCats.map((subCat) => (
                        <SelectItem key={`edit-${mainCat}-${subCat}`} value={subCat}>
                          {subCat}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              İptal
            </Button>
            <Button onClick={handleUpdatePost} disabled={!newPost.trim() || !selectedPostCategory}>
              Güncelle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;