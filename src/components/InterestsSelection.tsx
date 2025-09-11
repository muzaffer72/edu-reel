import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, GraduationCap, ChevronDown, ChevronRight } from 'lucide-react';

interface SelectedCategories {
  [mainCategory: string]: string[];
}

interface InterestsSelectionProps {
  examCategories: { [key: string]: string[] };
  onComplete: (selected: SelectedCategories) => void;
}

export const InterestsSelection: React.FC<InterestsSelectionProps> = ({ examCategories, onComplete }) => {
  const [selectedCategories, setSelectedCategories] = useState<SelectedCategories>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleMainCategory = (mainCategory: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(mainCategory)) {
      newExpanded.delete(mainCategory);
      // Ana kategori kapatılırken seçimi de kaldır
      const newSelected = { ...selectedCategories };
      delete newSelected[mainCategory];
      setSelectedCategories(newSelected);
    } else {
      newExpanded.add(mainCategory);
      // Ana kategori açılırken boş array ile başlat
      if (!selectedCategories[mainCategory]) {
        setSelectedCategories(prev => ({ ...prev, [mainCategory]: [] }));
      }
    }
    setExpandedCategories(newExpanded);
  };

  const toggleSubCategory = (mainCategory: string, subCategory: string) => {
    setSelectedCategories(prev => {
      const currentSubs = prev[mainCategory] || [];
      const newSubs = currentSubs.includes(subCategory)
        ? currentSubs.filter(s => s !== subCategory)
        : [...currentSubs, subCategory];
      
      if (newSubs.length === 0) {
        const newSelected = { ...prev };
        delete newSelected[mainCategory];
        return newSelected;
      }
      
      return { ...prev, [mainCategory]: newSubs };
    });
  };

  const handleComplete = () => {
    const hasMainCategory = Object.keys(selectedCategories).length >= 1;
    if (hasMainCategory) {
      onComplete(selectedCategories);
    }
  };

  const getTotalSelected = () => {
    return Object.values(selectedCategories).reduce((total, subs) => total + subs.length, 0);
  };

  const getMainCategoriesCount = () => {
    return Object.keys(selectedCategories).length;
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl p-8 shadow-glow border-0 bg-gradient-card max-h-[90vh] overflow-y-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="p-3 bg-gradient-primary rounded-full">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Sınav Kategorilerini Seç
            </h1>
            <p className="text-muted-foreground text-lg">
              Hangi sınavlara hazırlanıyorsun? İlgili konuları seçebilirsin.
            </p>
            <p className="text-sm text-muted-foreground">
              En az 1 ana kategori seçmelisin
            </p>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            {Object.entries(examCategories).map(([mainCategory, subCategories]) => {
              const isExpanded = expandedCategories.has(mainCategory);
              const isSelected = selectedCategories[mainCategory];
              const selectedCount = isSelected ? selectedCategories[mainCategory].length : 0;

              return (
                <div key={mainCategory} className="border border-border rounded-lg overflow-hidden">
                  {/* Main Category Header */}
                  <Button
                    variant="ghost"
                    className={`w-full p-4 h-auto justify-between transition-all duration-200 ${
                      isSelected ? 'bg-primary/5 border-primary/20' : 'hover:bg-accent'
                    }`}
                    onClick={() => toggleMainCategory(mainCategory)}
                  >
                    <div className="flex items-center space-x-3">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-primary" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      )}
                      <span className="font-semibold text-lg">{mainCategory}</span>
                      {selectedCount > 0 && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                          {selectedCount} seçili
                        </Badge>
                      )}
                    </div>
                    {isSelected && (
                      <CheckCircle className="w-5 h-5 text-primary" />
                    )}
                  </Button>

                  {/* Sub Categories */}
                  {isExpanded && (
                    <div className="p-4 bg-accent/30 border-t border-border">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {subCategories.map((subCategory) => {
                          const isSubSelected = selectedCategories[mainCategory]?.includes(subCategory);
                          return (
                            <Button
                              key={subCategory}
                              variant={isSubSelected ? "default" : "outline"}
                              size="sm"
                              className={`transition-all duration-200 ${
                                isSubSelected 
                                  ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md' 
                                  : 'hover:border-primary hover:text-primary'
                              }`}
                              onClick={() => toggleSubCategory(mainCategory, subCategory)}
                            >
                              {isSubSelected && <CheckCircle className="w-3 h-3 mr-1" />}
                              <span className="text-sm">{subCategory}</span>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selection Summary */}
          <div className="flex justify-center space-x-4">
            <Badge 
              variant={getMainCategoriesCount() >= 1 ? "default" : "secondary"}
              className={getMainCategoriesCount() >= 1 ? "bg-secondary text-secondary-foreground" : ""}
            >
              {getMainCategoriesCount()} ana kategori
            </Badge>
            <Badge variant="outline">
              {getTotalSelected()} konu seçildi
            </Badge>
          </div>

          {/* Continue Button */}
          <Button
            onClick={handleComplete}
            disabled={getMainCategoriesCount() < 1}
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