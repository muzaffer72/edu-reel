import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Share2, CheckCircle } from 'lucide-react';

interface Post {
  id: string;
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
  user_liked?: boolean;
  user_id?: string;
}

interface PostCardProps {
  post: Post;
  onLike?: () => void;
  onToggleCorrectAnswer?: () => void;
  currentUserId?: string;
}

export const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  onLike, 
  onToggleCorrectAnswer, 
  currentUserId 
}) => {
  const isOwnPost = currentUserId === post.user_id;
  const [liked, setLiked] = useState(post.user_liked || false);
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
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center space-x-6">
            <button 
              onClick={onLike}
              className={`flex items-center space-x-2 transition-colors group ${
                post.user_liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
              }`}
            >
              <Heart className={`w-4 h-4 ${post.user_liked ? 'fill-red-500' : 'group-hover:fill-red-500'}`} />
              <span className="text-sm">{post.likes}</span>
            </button>
            <button className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors">
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">{post.comments}</span>
            </button>
            <button className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors">
              <Share2 className="w-4 h-4" />
              <span className="text-sm">{post.shares}</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            {isOwnPost && (
              <button
                onClick={onToggleCorrectAnswer}
                className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                  post.isCorrectAnswer 
                    ? 'bg-green-500/20 text-green-700 hover:bg-green-500/30' 
                    : 'bg-gray-100 text-gray-600 hover:bg-green-500/20 hover:text-green-700'
                }`}
              >
                <CheckCircle className="w-3 h-3" />
                <span>{post.isCorrectAnswer ? 'Doğru Cevap' : 'Doğru İşaretle'}</span>
              </button>
            )}
            {!isOwnPost && post.isCorrectAnswer && (
              <div className="flex items-center space-x-1 bg-green-500/20 text-green-700 px-2 py-1 rounded-full">
                <CheckCircle className="w-3 h-3" />
                <span className="text-xs font-medium">Doğru Cevap</span>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </Card>
  );
};