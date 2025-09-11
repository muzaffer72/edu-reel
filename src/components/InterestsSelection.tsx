import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, GraduationCap } from 'lucide-react';

interface InterestsSelectionProps {
  interests: string[];
  onComplete: (selected: string[]) => void;
}

export const InterestsSelection: React.FC<InterestsSelectionProps> = ({ interests, onComplete }) => {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleComplete = () => {
    if (selectedInterests.length >= 3) {
      onComplete(selectedInterests);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8 shadow-glow border-0 bg-gradient-card">
        <div className="text-center space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex justify-center">
              <div className="p-3 bg-gradient-primary rounded-full">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Hoş Geldin!
            </h1>
            <p className="text-muted-foreground text-lg">
              Hangi konularda öğrenmek ve paylaşımda bulunmak istiyorsun?
            </p>
            <p className="text-sm text-muted-foreground">
              En az 3 alan seçmelisin
            </p>
          </div>

          {/* Interests Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {interests.map((interest) => {
              const isSelected = selectedInterests.includes(interest);
              return (
                <Button
                  key={interest}
                  variant={isSelected ? "default" : "outline"}
                  className={`p-4 h-auto transition-all duration-200 ${
                    isSelected 
                      ? 'bg-gradient-primary hover:opacity-90 text-white shadow-md transform scale-105' 
                      : 'hover:border-primary hover:text-primary hover:shadow-sm'
                  }`}
                  onClick={() => toggleInterest(interest)}
                >
                  <div className="flex items-center justify-center space-x-2">
                    {isSelected && <CheckCircle className="w-4 h-4" />}
                    <span className="font-medium">{interest}</span>
                  </div>
                </Button>
              );
            })}
          </div>

          {/* Selected Count */}
          <div className="flex justify-center">
            <Badge 
              variant={selectedInterests.length >= 3 ? "default" : "secondary"}
              className={selectedInterests.length >= 3 ? "bg-secondary text-secondary-foreground" : ""}
            >
              {selectedInterests.length} / {interests.length} seçildi
            </Badge>
          </div>

          {/* Continue Button */}
          <Button
            onClick={handleComplete}
            disabled={selectedInterests.length < 3}
            className="w-full bg-gradient-primary hover:opacity-90 transition-all shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
            size="lg"
          >
            Devam Et
          </Button>
        </div>
      </Card>
    </div>
  );
};