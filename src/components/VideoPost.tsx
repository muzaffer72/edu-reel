import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Share2, Play, Clock } from 'lucide-react';

interface VideoPostProps {
  id: number;
  user: {
    name: string;
    username: string;
    avatar: string;
  };
  title: string;
  description: string;
  videoUrl: string;
  thumbnail: string;
  duration: string;
  timestamp: string;
  interests: string[];
  likes: number;
  comments: number;
  shares: number;
}

export const VideoPost: React.FC<VideoPostProps> = ({ 
  user, 
  title, 
  description, 
  duration, 
  timestamp, 
  interests, 
  likes, 
  comments, 
  shares 
}) => {
  const [liked, setLiked] = useState(false);

  return (
    <Card className="overflow-hidden shadow-md border-0 bg-gradient-card hover:shadow-lg transition-all duration-300">
      {/* Video Thumbnail */}
      <div className="relative aspect-video bg-gradient-primary/10">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/20 backdrop-blur-sm rounded-full p-4">
            <Play className="w-8 h-8 text-white fill-current" />
          </div>
        </div>
        <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm flex items-center">
          <Clock className="w-3 h-3 mr-1" />
          {duration}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        <div className="flex space-x-4">
          <Avatar>
            <AvatarFallback className="bg-secondary text-secondary-foreground">
              {user.avatar}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-3">
            {/* Header */}
            <div>
              <h3 className="font-semibold text-foreground">{user.name}</h3>
              <p className="text-sm text-muted-foreground">{user.username} • {timestamp}</p>
            </div>

            {/* Video Info */}
            <div className="space-y-2">
              <h4 className="font-bold text-foreground text-lg leading-tight">{title}</h4>
              <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
              
              {/* Interests */}
              <div className="flex flex-wrap gap-1">
                {interests.map((interest) => (
                  <Badge key={interest} variant="outline" className="text-xs">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-6 pt-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`text-muted-foreground hover:text-red-500 transition-colors ${liked ? 'text-red-500' : ''}`}
                onClick={() => setLiked(!liked)}
              >
                <Heart className={`w-4 h-4 mr-2 ${liked ? 'fill-current' : ''}`} />
                <span className="text-sm">{likes + (liked ? 1 : 0)}</span>
              </Button>
              
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary transition-colors">
                <MessageCircle className="w-4 h-4 mr-2" />
                <span className="text-sm">{comments}</span>
              </Button>
              
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-secondary transition-colors">
                <Share2 className="w-4 h-4 mr-2" />
                <span className="text-sm">{shares}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};