import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Settings, Users, MessageSquare, Shield, Upload, Image, RefreshCw, Key } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CategoryManagement } from '@/components/CategoryManagement';

const Admin = () => {
  const { user } = useAuth();
  const { isAdmin, loading, settings, updateSetting, blockUser, unblockUser, assignRole, sendNotification, getBlockedUsers, getAllUsers } = useAdmin();
  const { toast } = useToast();
  
  const [appName, setAppName] = useState('');
  const [appLogo, setAppLogo] = useState('');
  const [aiEnabled, setAiEnabled] = useState(true);
  const [aiModel, setAiModel] = useState('gemini-1.5-flash');
  const [aiProvider, setAiProvider] = useState('google');
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [maxPostsPerDay, setMaxPostsPerDay] = useState(50);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  useEffect(() => {
    if (settings) {
      setAppName(settings.app_name || '');
      setAppLogo(settings.app_logo || '');
      setAiEnabled(settings.ai_enabled || false);
      setAiModel(settings.ai_model || 'gemini-1.5-flash');
      setAiProvider(settings.ai_provider || 'google');
      setMaxPostsPerDay(settings.max_posts_per_day || 50);
      setRegistrationEnabled(settings.registration_enabled || true);
      setOpenaiApiKey(settings.openai_api_key || '');
      setGeminiApiKey(settings.gemini_api_key || '');
    }
  }, [settings]);

  useEffect(() => {
    if (aiProvider) {
      fetchAvailableModels();
    }
  }, [aiProvider]);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    const blocked = await getBlockedUsers();
    const all = await getAllUsers();
    setBlockedUsers(blocked);
    setAllUsers(all);
  };

  const fetchAvailableModels = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-ai-models', {
        body: { provider: aiProvider }
      });

      if (error) throw error;
      setAvailableModels(data.models || []);
    } catch (error: any) {
      console.error('Error fetching models:', error);
      toast({
        title: 'Uyarı',
        description: 'Modeller yüklenemedi, varsayılan modeller gösteriliyor',
        variant: 'destructive',
      });
      // Set default models based on provider
      if (aiProvider === 'google') {
        setAvailableModels([
          { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Fast and versatile' },
          { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Advanced reasoning' },
          { id: 'gemma-2-2b', name: 'Gemma 2 2B', description: 'Lightweight model' },
          { id: 'gemma-2-9b', name: 'Gemma 2 9B', description: 'Balanced model' }
        ]);
      } else if (aiProvider === 'openai') {
        setAvailableModels([
          { id: 'gpt-4o', name: 'GPT-4o', description: 'Most capable model' },
          { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Fast and efficient' }
        ]);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/auth" replace />;
  }

  const handleSaveSettings = async () => {
    await updateSetting('app_name', appName);
    await updateSetting('app_logo', appLogo);
    await updateSetting('ai_enabled', aiEnabled);
    await updateSetting('ai_model', aiModel);
    await updateSetting('ai_provider', aiProvider);
    await updateSetting('max_posts_per_day', maxPostsPerDay);
    await updateSetting('registration_enabled', registrationEnabled);
    await updateSetting('openai_api_key', openaiApiKey);
    await updateSetting('gemini_api_key', geminiApiKey);
  };

  const handleSendNotification = async () => {
    if (!notificationTitle.trim() || !notificationMessage.trim()) {
      toast({
        title: 'Hata',
        description: 'Başlık ve mesaj gerekli',
        variant: 'destructive',
      });
      return;
    }

    await sendNotification(
      notificationTitle,
      notificationMessage,
      selectedUsers.length > 0 ? selectedUsers : undefined
    );
    
    setNotificationTitle('');
    setNotificationMessage('');
    setSelectedUsers([]);
  };

  const handleBlockUser = async (userId: string) => {
    const reason = prompt('Engelleme sebebi (isteğe bağlı):');
    await blockUser(userId, reason || undefined);
    loadUsers();
  };

  const handleUnblockUser = async (userId: string) => {
    await unblockUser(userId);
    loadUsers();
  };

  const handleAssignRole = async (userId: string, role: 'admin' | 'moderator' | 'user') => {
    await assignRole(userId, role);
    loadUsers();
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Paneli</h1>
        <p className="text-muted-foreground">Sistem ayarlarını ve kullanıcıları yönetin</p>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Ayarlar
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Kategoriler
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Kullanıcılar
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Bildirimler
          </TabsTrigger>
          <TabsTrigger value="blocked" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Engelliler
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Sistem Ayarları</CardTitle>
              <CardDescription>
                Uygulamanın genel ayarlarını buradan yönetebilirsiniz
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="appName">Uygulama Adı</Label>
                  <Input
                    id="appName"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="Sınav Yardımcısı"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="appLogo">Logo URL</Label>
                  <Input
                    id="appLogo"
                    value={appLogo}
                    onChange={(e) => setAppLogo(e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxPosts">Günlük Maksimum Gönderi</Label>
                  <Input
                    id="maxPosts"
                    type="number"
                    value={maxPostsPerDay}
                    onChange={(e) => setMaxPostsPerDay(parseInt(e.target.value))}
                    min="1"
                    max="1000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aiProvider">AI Sağlayıcı</Label>
                  <Select value={aiProvider} onValueChange={setAiProvider}>
                    <SelectTrigger>
                      <SelectValue placeholder="AI Sağlayıcı seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google">Google (Gemini/Gemma)</SelectItem>
                      <SelectItem value="openai">OpenAI (GPT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="aiModel">AI Model</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchAvailableModels}
                      className="h-8 px-2"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Yenile
                    </Button>
                  </div>
                  <Select value={aiModel} onValueChange={setAiModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="AI Model seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex flex-col">
                            <span>{model.name}</span>
                            {model.description && (
                              <span className="text-xs text-muted-foreground">{model.description}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="aiEnabled">AI Yanıtları</Label>
                    <p className="text-sm text-muted-foreground">
                      AI asistanın otomatik yanıt vermesini etkinleştir
                    </p>
                  </div>
                  <Switch
                    id="aiEnabled"
                    checked={aiEnabled}
                    onCheckedChange={setAiEnabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="registrationEnabled">Yeni Kayıtlar</Label>
                    <p className="text-sm text-muted-foreground">
                      Yeni kullanıcı kayıtlarını etkinleştir
                    </p>
                  </div>
                  <Switch
                    id="registrationEnabled"
                    checked={registrationEnabled}
                    onCheckedChange={setRegistrationEnabled}
                  />
                </div>
              </div>

              <Button onClick={handleSaveSettings} className="w-full">
                Ayarları Kaydet
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API Anahtarları</CardTitle>
              <CardDescription>
                AI sağlayıcılarının API anahtarlarını yönetin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="openaiKey">OpenAI API Anahtarı</Label>
                <Input
                  id="openaiKey"
                  type="password"
                  value={openaiApiKey}
                  onChange={(e) => setOpenaiApiKey(e.target.value)}
                  placeholder="sk-..."
                />
                <p className="text-sm text-muted-foreground">
                  GPT modelleri için gerekli
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="geminiKey">Google Gemini API Anahtarı</Label>
                <Input
                  id="geminiKey"
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="AIza..."
                />
                <p className="text-sm text-muted-foreground">
                  Gemini modelleri için gerekli
                </p>
              </div>

              <Button onClick={handleSaveSettings} className="w-full">
                API Anahtarlarını Kaydet
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <CategoryManagement />
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Kullanıcı Yönetimi</CardTitle>
              <CardDescription>
                Tüm kullanıcıları görüntüleyin ve rollerini yönetin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">{user.display_name || 'İsimsiz Kullanıcı'}</p>
                        <p className="text-sm text-muted-foreground">{user.user_id}</p>
                      </div>
                      <Badge variant={user.user_roles?.[0]?.role === 'admin' ? 'default' : 'secondary'}>
                        {user.user_roles?.[0]?.role || 'user'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        defaultValue={user.user_roles?.[0]?.role || 'user'}
                        onValueChange={(role) => handleAssignRole(user.user_id, role as any)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Kullanıcı</SelectItem>
                          <SelectItem value="moderator">Moderatör</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleBlockUser(user.user_id)}
                      >
                        Engelle
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Toplu Bildirim Gönder</CardTitle>
              <CardDescription>
                Tüm kullanıcılara veya seçili kullanıcılara bildirim gönderin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notifTitle">Başlık</Label>
                <Input
                  id="notifTitle"
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                  placeholder="Bildirim başlığı"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notifMessage">Mesaj</Label>
                <Textarea
                  id="notifMessage"
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  placeholder="Bildirim mesajı"
                  rows={4}
                />
              </div>

              <Button onClick={handleSendNotification}>
                Bildirimi Gönder
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blocked">
          <Card>
            <CardHeader>
              <CardTitle>Engellenen Kullanıcılar</CardTitle>
              <CardDescription>
                Engellenen kullanıcıları görüntüleyin ve engellerini kaldırın
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {blockedUsers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Henüz engellenen kullanıcı yok
                  </p>
                ) : (
                  blockedUsers.map((blockedUser) => (
                    <div key={blockedUser.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          {blockedUser.profiles?.display_name || 'İsimsiz Kullanıcı'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Engelleme tarihi: {new Date(blockedUser.blocked_at).toLocaleDateString('tr-TR')}
                        </p>
                        {blockedUser.reason && (
                          <p className="text-sm text-muted-foreground">
                            Sebep: {blockedUser.reason}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnblockUser(blockedUser.user_id)}
                      >
                        Engeli Kaldır
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;