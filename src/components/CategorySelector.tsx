import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ExamCategory {
  id: string;
  main_category: string;
  sub_category: string;
}

interface SelectedCategories {
  [mainCategory: string]: string[];
}

interface CategorySelectorProps {
  selectedCategories: SelectedCategories;
  onCategoriesChange: (categories: SelectedCategories) => void;
  onClose: () => void;
}

export const CategorySelector = ({ selectedCategories, onCategoriesChange, onClose }: CategorySelectorProps) => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<ExamCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [tempSelected, setTempSelected] = useState<SelectedCategories>(selectedCategories);

  useEffect(() => {
    fetchCategories();
  }, []);

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
      toast({
        title: 'Hata',
        description: 'Kategoriler yüklenemedi',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const groupedCategories = categories.reduce((acc, category) => {
    if (!acc[category.main_category]) {
      acc[category.main_category] = [];
    }
    acc[category.main_category].push(category);
    return acc;
  }, {} as Record<string, ExamCategory[]>);

  const handleMainCategoryChange = (mainCategory: string, checked: boolean) => {
    setTempSelected(prev => {
      const newSelected = { ...prev };
      if (checked) {
        newSelected[mainCategory] = groupedCategories[mainCategory]?.map(cat => cat.sub_category) || [];
      } else {
        delete newSelected[mainCategory];
      }
      return newSelected;
    });
  };

  const handleSubCategoryChange = (mainCategory: string, subCategory: string, checked: boolean) => {
    setTempSelected(prev => {
      const newSelected = { ...prev };
      if (!newSelected[mainCategory]) {
        newSelected[mainCategory] = [];
      }
      
      if (checked) {
        if (!newSelected[mainCategory].includes(subCategory)) {
          newSelected[mainCategory] = [...newSelected[mainCategory], subCategory];
        }
      } else {
        newSelected[mainCategory] = newSelected[mainCategory].filter(cat => cat !== subCategory);
        if (newSelected[mainCategory].length === 0) {
          delete newSelected[mainCategory];
        }
      }
      return newSelected;
    });
  };

  const isMainCategorySelected = (mainCategory: string) => {
    return tempSelected[mainCategory] && tempSelected[mainCategory].length > 0;
  };

  const isMainCategoryFullySelected = (mainCategory: string) => {
    const allSubCategories = groupedCategories[mainCategory]?.map(cat => cat.sub_category) || [];
    const selectedSubCategories = tempSelected[mainCategory] || [];
    return allSubCategories.length > 0 && allSubCategories.every(sub => selectedSubCategories.includes(sub));
  };

  const handleSave = () => {
    onCategoriesChange(tempSelected);
    onClose();
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-2">Kategoriler yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">İlgi Alanlarınızı Seçin</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="h-96">
        <div className="space-y-4 pr-4">
          {Object.entries(groupedCategories).map(([mainCategory, subCategories]) => (
            <div key={mainCategory} className="border rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <Checkbox
                  id={`main-${mainCategory}`}
                  checked={isMainCategoryFullySelected(mainCategory)}
                  onCheckedChange={(checked) => handleMainCategoryChange(mainCategory, checked as boolean)}
                  className="data-[state=checked]:bg-primary"
                />
                <label
                  htmlFor={`main-${mainCategory}`}
                  className="text-sm font-medium text-primary cursor-pointer"
                >
                  {mainCategory}
                </label>
              </div>
              
              <div className="grid grid-cols-2 gap-2 ml-6">
                {subCategories.map((category) => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`sub-${category.id}`}
                      checked={tempSelected[mainCategory]?.includes(category.sub_category) || false}
                      onCheckedChange={(checked) => 
                        handleSubCategoryChange(mainCategory, category.sub_category, checked as boolean)
                      }
                      className="data-[state=checked]:bg-primary"
                    />
                    <label
                      htmlFor={`sub-${category.id}`}
                      className="text-sm cursor-pointer hover:text-primary transition-colors"
                    >
                      {category.sub_category}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex flex-wrap gap-1">
          {Object.entries(tempSelected).map(([mainCat, subCats]) =>
            subCats.map((subCat) => (
              <Badge key={`${mainCat}-${subCat}`} variant="secondary" className="text-xs">
                {subCat}
              </Badge>
            ))
          )}
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button onClick={handleSave} className="bg-gradient-primary">
            Kaydet
          </Button>
        </div>
      </div>
    </div>
  );
};