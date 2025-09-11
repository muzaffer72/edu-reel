import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Share2, CheckCircle } from 'lucide-react';

interface Post {
  id: number;
  user: {
    name: string;
    username: string;
    avatar: string;
  };
  content: string;
  timestamp: string;
  interests: string[];
  likes: number;
  comments: number;
  shares: number;
  isCorrectAnswer: boolean;
}

interface PostCardProps {
  post: Post;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const [liked, setLiked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(post.isCorrectAnswer);

  return (
    <Card className="p-6 shadow-md border-0 bg-gradient-card hover:shadow-lg transition-all duration-300">
      <div className="flex space-x-4">
        <Avatar>
          <AvatarFallback className="bg-primary text-primary-foreground">
            {post.user.avatar}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">{post.user.name}</h3>
              <p className="text-sm text-muted-foreground">{post.user.username} • {post.timestamp}</p>
            </div>
            {isCorrect && (
              <div className="flex items-center space-x-1 text-secondary">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Doğru Cevap</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="space-y-3">
            <p className="text-foreground leading-relaxed">{post.content}</p>
            
            {/* Interests */}
            <div className="flex flex-wrap gap-1">
              {post.interests.map((interest) => (
                <Badge key={interest} variant="outline" className="text-xs">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex space-x-6">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`text-muted-foreground hover:text-red-500 transition-colors ${liked ? 'text-red-500' : ''}`}
                onClick={() => setLiked(!liked)}
              >
                <Heart className={`w-4 h-4 mr-2 ${liked ? 'fill-current' : ''}`} />
                <span className="text-sm">{post.likes + (liked ? 1 : 0)}</span>
              </Button>
              
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary transition-colors">
                <MessageCircle className="w-4 h-4 mr-2" />
                <span className="text-sm">{post.comments}</span>
              </Button>
              
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-secondary transition-colors">
                <Share2 className="w-4 h-4 mr-2" />
                <span className="text-sm">{post.shares}</span>
              </Button>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className={`transition-all ${isCorrect ? 'text-secondary hover:text-secondary/80' : 'text-muted-foreground hover:text-secondary'}`}
              onClick={() => setIsCorrect(!isCorrect)}
            >
              <CheckCircle className={`w-4 h-4 mr-1 ${isCorrect ? 'fill-current' : ''}`} />
              <span className="text-xs font-medium">
                {isCorrect ? 'Doğru işaretli' : 'Doğru olarak işaretle'}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};