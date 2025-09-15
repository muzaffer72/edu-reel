import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Share2, CheckCircle, Video, Image as ImageIcon, Plus, User, LogOut, LogIn, Paperclip, X, Bot, Settings, ChevronDown, Filter, TrendingUp, Sparkles, MessageSquare, GraduationCap } from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { PostFilter } from '@/components/PostFilter';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SelectedCategories {
  [mainCategory: string]: string[];
}

interface ExamCategory {
  id: string;
  main_category: string;
  sub_category: string;
}

interface FilterOptions {
  categories: string[];
  status: 'all' | 'solved' | 'unsolved';
  timeframe: 'all' | 'week' | 'month';
}

const PostForm = ({ onPostAdded }: { onPostAdded: () => void }) => {
  const { user } = useAuth();
  const { createPost } = usePosts();
  const { toast } = useToast();
  const { uploadFile, uploading } = useFileUpload();
  
  const [newPost, setNewPost] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [aiResponseEnabled, setAiResponseEnabled] = useState(false);
  const [selectedPostCategory, setSelectedPostCategory] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [availableCategories, setAvailableCategories] = useState<ExamCategory[]>([]);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  useEffect(() => {
    fetchAvailableCategories();
  }, [profile]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) setProfile(data);
    } catch (error: any) {
      console.error('Profile fetch error:', error);
    }
  };

  const fetchAvailableCategories = async () => {
    try {
      if (!profile?.exam_categories) return;
      
      const userCategories = Object.keys(profile.exam_categories);
      
      const { data, error } = await supabase
        .from('exam_categories')
        .select('*')
        .in('main_category', userCategories)
        .order('main_category', { ascending: true })
        .order('sub_category', { ascending: true });

      if (error) throw error;
      setAvailableCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'file') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const bucket = 'attachments';
    const url = await uploadFile(file, bucket);
    
    if (url) {
      setAttachments(prev => [...prev, url]);
    }
    
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
      onPostAdded();
    }
    setSubmitting(false);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

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
    <Card className="p-6 shadow-lg border-0 bg-gradient-card hover:shadow-glow transition-all duration-300">
      <div className="flex space-x-4">
        <Avatar className="ring-2 ring-primary/20">
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
            className="min-h-[100px] border-0 bg-transparent resize-none focus-visible:ring-0 placeholder:text-muted-foreground text-base"
          />
          
          {attachments.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {attachments.map((url, index) => (
                <div key={index} className="relative group">
                  <img src={url} alt="Ek" className="w-full h-32 object-cover rounded-lg shadow-md" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          {canEnableAiResponse && (
            <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg border border-primary/20">
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

          <div className="flex gap-4">
            {canEnableAiResponse && (
              <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20 flex-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center space-x-2">
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
                          AI Yanıt
                        </label>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Yapay zeka gönderinize otomatik yanıt verir</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
            
            <div className="flex-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Label htmlFor="postCategory" className="text-sm font-medium flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" />
                        Kategori
                      </Label>
                      <Select value={selectedPostCategory} onValueChange={setSelectedPostCategory}>
                        <SelectTrigger className="border-border/50 hover:border-primary/50 transition-colors mt-1">
                          <SelectValue placeholder="Kategori seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCategories.length === 0 ? (
                            <div className="px-2 py-1 text-sm text-muted-foreground">
                              Önce profil sayfasından ilgi alanlarınızı seçin
                            </div>
                          ) : (
                            availableCategories.map((category) => (
                              <SelectItem key={category.id} value={category.sub_category}>
                                <span className="text-xs text-muted-foreground mr-2">
                                  {category.main_category}
                                </span>
                                {category.sub_category}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Sadece profilde seçtiğiniz ana kategorilerin alt kategorileri görünür</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <label className="cursor-pointer">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full" asChild>
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
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-secondary hover:bg-secondary/10 rounded-full" asChild>
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
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-accent-foreground hover:bg-accent/10 rounded-full" asChild>
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
              className="bg-gradient-primary hover:opacity-90 transition-all shadow-md hover:shadow-lg rounded-full px-6"
            >
              {uploading ? 'Yükleniyor...' : submitting ? 'Paylaşılıyor...' : 'Paylaş'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

const Index = () => {
  const { user, signOut } = useAuth();
  const { posts, loading, fetchPosts } = usePosts();
  const { isAdmin } = useAdmin();
  const { toast } = useToast();
  const [showInterests, setShowInterests] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<SelectedCategories>({});
  const [profile, setProfile] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    categories: [],
    status: 'all',
    timeframe: 'all'
  });
  const [categories, setCategories] = useState<ExamCategory[]>([]);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
    fetchCategories();
  }, [user]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('exam_categories')
        .select('*')
        .order('main_category', { ascending: true })
        .order('sub_category', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
    }
  };

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

  const logout = async () => {
    await signOut();
  };

  const handlePostAdded = () => {
    fetchPosts();
  };

  const handlePostUpdated = () => {
    fetchPosts();
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilterOptions(newFilters);
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Şimdi';
    if (diffInMinutes < 60) return `${diffInMinutes}dk önce`;
    if (diffInHours < 24) return `${diffInHours}sa önce`;
    if (diffInDays < 7) return `${diffInDays}g önce`;
    
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const mainCategories = Array.from(new Set(categories.map(cat => cat.main_category)));

  // Filter posts by category and other filters
  const filteredPosts = posts.filter(post => {
    // Category filter
    if (selectedCategory !== 'all') {
      if (!post.exam_categories?.some(cat => 
        cat.toLowerCase().includes(selectedCategory.toLowerCase())
      )) return false;
    }

    // Additional filters
    if (filterOptions.categories.length > 0) {
      if (!post.exam_categories?.some(cat => 
        filterOptions.categories.includes(cat)
      )) return false;
    }

    // Status filter
    if (filterOptions.status === 'solved' && !post.is_correct_answer) return false;
    if (filterOptions.status === 'unsolved' && post.is_correct_answer) return false;

    // Timeframe filter
    if (filterOptions.timeframe !== 'all') {
      const postDate = new Date(post.created_at);
      const now = new Date();
      const diffInDays = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (filterOptions.timeframe === 'week' && diffInDays > 7) return false;
      if (filterOptions.timeframe === 'month' && diffInDays > 30) return false;
    }

    return true;
  });

  if (showInterests) {
    return (
      <InterestsSelection 
        examCategories={categories.reduce((acc, cat) => {
          if (!acc[cat.main_category]) {
            acc[cat.main_category] = [];
          }
          acc[cat.main_category].push(cat.sub_category);
          return acc;
        }, {} as Record<string, string[]>)} 
        onComplete={handleInterestComplete} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-gradient-to-r from-background/95 via-background/98 to-accent/10 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80 shadow-sm">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Sınav Yardımcısı
              </h1>
            </div>
            
            <div className="hidden lg:flex items-center gap-2">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-full transition-all hover:scale-105 shadow-sm"
                onClick={() => setSelectedCategory('all')}
              >
                <Filter className="w-4 h-4 mr-2" />
                Tümü
              </Button>
              {mainCategories.slice(0, 4).map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-full transition-all hover:scale-105 shadow-sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {category}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <NotificationDropdown />
            {user ? (
              <>
                {isAdmin && (
                  <Button variant="outline" size="sm" className="rounded-full shadow-sm hover:shadow-md transition-all" asChild>
                    <Link to="/admin">
                      <Settings className="h-4 w-4 mr-2" />
                      Admin
                    </Link>
                  </Button>
                )}
                <Button variant="outline" size="sm" className="rounded-full shadow-sm hover:shadow-md transition-all" asChild>
                  <Link to="/profile">
                    <User className="h-4 w-4 mr-2" />
                    Profil
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full shadow-sm hover:shadow-md transition-all"
                  onClick={logout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Çıkış
                </Button>
              </>
            ) : (
              <Button variant="default" size="sm" className="rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105" asChild>
                <Link to="/auth">
                  <LogIn className="h-4 w-4 mr-2" />
                  Giriş Yap
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Category Filter */}
      <div className="lg:hidden px-4 py-3 border-b bg-card/50 backdrop-blur-sm">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-full transition-all hover:scale-105"
              onClick={() => setSelectedCategory('all')}
            >
              Tümü
            </Button>
            {mainCategories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'ghost'}
                size="sm"
                className="rounded-full transition-all hover:scale-105"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Posts Column */}
          <div className="lg:col-span-2 space-y-8">
            {user && (
              <div className="space-y-4">
                <PostForm onPostAdded={handlePostAdded} />
                <div className="flex justify-start">
                  <PostFilter 
                    onFilterChange={handleFilterChange} 
                    activeFilters={filterOptions} 
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto shadow-glow"></div>
                  <p className="text-muted-foreground mt-4 text-lg">Gönderiler yükleniyor...</p>
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="text-center py-16 bg-gradient-card rounded-xl border">
                  <MessageSquare className="h-16 w-16 text-primary/60 mx-auto mb-6" />
                  <h3 className="text-xl font-semibold mb-2">Henüz gönderi yok</h3>
                  <p className="text-muted-foreground">
                    {selectedCategory === 'all' 
                      ? 'İlk gönderinizi oluşturun ve topluluğun bir parçası olun!'
                      : `${selectedCategory} kategorisinde henüz gönderi yok.`
                    }
                  </p>
                </div>
              ) : (
                filteredPosts.map((post) => {
                  // Transform post data to match PostCard interface
                  const transformedPost = {
                    ...post,
                    user: {
                      name: post.profiles?.display_name || 'Anonim',
                      username: post.profiles?.display_name || 'user',
                      avatar: post.profiles?.avatar_url || '',
                      avatar_url: post.profiles?.avatar_url
                    },
                    timestamp: formatRelativeTime(post.created_at),
                    interests: post.exam_categories || [],
                    likes: post.likes_count || 0,
                    comments: post.comments_count || 0,
                    shares: post.shares_count || 0,
                    isCorrectAnswer: post.is_correct_answer || false
                  };
                  
                  return (
                    <div key={post.id} className="bg-gradient-card rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border backdrop-blur-sm">
                      <PostCard 
                        post={transformedPost} 
                        currentUserId={user?.id}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-gradient-card rounded-xl shadow-lg border backdrop-blur-sm p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                İlgi Alanlarınız
              </h3>
              <div className="space-y-2">
                {Object.keys(selectedCategories).length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Henüz ilgi alanı seçmediniz
                  </p>
                ) : (
                  Object.entries(selectedCategories).map(([mainCat, subCats]) => (
                    <div key={mainCat}>
                      <h4 className="font-medium text-sm text-primary">{mainCat}</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {subCats.map((subCat) => (
                          <Badge key={subCat} variant="secondary" className="text-xs">
                            {subCat}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;