import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Share2, CheckCircle, Video, Image as ImageIcon, Plus } from 'lucide-react';
import { PostCard } from '@/components/PostCard';
import { VideoPost } from '@/components/VideoPost';
import { InterestsSelection } from '@/components/InterestsSelection';

const Index = () => {
  const [showInterests, setShowInterests] = useState(true);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [newPost, setNewPost] = useState('');

  const interests = [
    'Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Tarih', 'Coğrafya',
    'Edebiyat', 'Felsefe', 'Programlama', 'Yapay Zeka', 'Dil Öğrenimi',
    'Sanat', 'Müzik', 'Psikoloji', 'Sosyoloji', 'Ekonomi'
  ];

  const samplePosts = [
    {
      id: 1,
      user: { name: 'Dr. Ayşe Kaya', username: '@ayse_edu', avatar: 'AK' },
      content: 'Matematik problemlerini çözerken görselleştirme tekniğini kullanmayı denediniz mi? Karmaşık konuları anlamak için çok etkili! 📊',
      timestamp: '2 saat önce',
      interests: ['Matematik', 'Eğitim'],
      likes: 45,
      comments: 12,
      shares: 8,
      isCorrectAnswer: true
    },
    {
      id: 2,
      user: { name: 'Mehmet Öz', username: '@mehmet_fizik', avatar: 'MÖ' },
      content: 'Newton\'un hareket yasalarını günlük hayattan örneklerle açıklayalım. Hangi durumları gözlemlediniz?',
      timestamp: '4 saat önce',
      interests: ['Fizik'],
      likes: 67,
      comments: 23,
      shares: 15,
      isCorrectAnswer: false
    }
  ];

  const handleInterestComplete = (selected: string[]) => {
    setSelectedInterests(selected);
    setShowInterests(false);
  };

  if (showInterests) {
    return <InterestsSelection interests={interests} onComplete={handleInterestComplete} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border backdrop-blur-sm bg-opacity-90">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                EduSocial
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              {selectedInterests.slice(0, 3).map((interest) => (
                <Badge key={interest} variant="secondary" className="text-xs">
                  {interest}
                </Badge>
              ))}
              {selectedInterests.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{selectedInterests.length - 3}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* New Post */}
          <Card className="p-6 shadow-md border-0 bg-gradient-card">
            <div className="flex space-x-4">
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">
                  Sen
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-4">
                <Textarea
                  placeholder="Bir soru sor veya bilgini paylaş..."
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="min-h-[100px] border-0 bg-transparent resize-none focus-visible:ring-0 placeholder:text-muted-foreground"
                />
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Resim
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-secondary">
                      <Video className="w-4 h-4 mr-2" />
                      Video
                    </Button>
                  </div>
                  <Button 
                    className="bg-gradient-primary hover:opacity-90 transition-all shadow-glow"
                    disabled={!newPost.trim()}
                  >
                    Paylaş
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Posts Feed */}
          <div className="space-y-4">
            {samplePosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
            
            <VideoPost
              id={3}
              user={{ name: 'Prof. Zeynep Yılmaz', username: '@zeynep_bio', avatar: 'ZY' }}
              title="Hücre Bölünmesi: Mitoz ve Mayoz Arasındaki Farklar"
              description="Bu videoda mitoz ve mayoz arasındaki temel farkları görsel animasyonlarla açıklıyorum."
              videoUrl="https://example.com/video.mp4"
              thumbnail="https://example.com/thumbnail.jpg"
              duration="8:45"
              timestamp="6 saat önce"
              interests={['Biyoloji']}
              likes={128}
              comments={34}
              shares={42}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;