import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Filter, X, CheckCircle, Clock, Calendar, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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

interface PostFilterProps {
  onFilterChange: (filters: FilterOptions) => void;
  activeFilters: FilterOptions;
}

export const PostFilter = ({ onFilterChange, activeFilters }: PostFilterProps) => {
  const [categories, setCategories] = useState<ExamCategory[]>([]);
  const [tempFilters, setTempFilters] = useState<FilterOptions>(activeFilters);
  const [open, setOpen] = useState(false);

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
      console.error('Error fetching categories:', error);
    }
  };

  const groupedCategories = categories.reduce((acc, category) => {
    if (!acc[category.main_category]) {
      acc[category.main_category] = [];
    }
    acc[category.main_category].push(category);
    return acc;
  }, {} as Record<string, ExamCategory[]>);

  const handleCategoryToggle = (subCategory: string, checked: boolean) => {
    setTempFilters(prev => ({
      ...prev,
      categories: checked
        ? [...prev.categories, subCategory]
        : prev.categories.filter(cat => cat !== subCategory)
    }));
  };

  const handleStatusChange = (status: FilterOptions['status']) => {
    setTempFilters(prev => ({ ...prev, status }));
  };

  const handleTimeframeChange = (timeframe: FilterOptions['timeframe']) => {
    setTempFilters(prev => ({ ...prev, timeframe }));
  };

  const handleApplyFilters = () => {
    onFilterChange(tempFilters);
    setOpen(false);
  };

  const handleClearFilters = () => {
    const clearedFilters: FilterOptions = {
      categories: [],
      status: 'all',
      timeframe: 'all'
    };
    setTempFilters(clearedFilters);
    onFilterChange(clearedFilters);
    setOpen(false);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (activeFilters.categories.length > 0) count++;
    if (activeFilters.status !== 'all') count++;
    if (activeFilters.timeframe !== 'all') count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative rounded-full shadow-sm hover:shadow-md transition-all"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filtrele
          {activeFilterCount > 0 && (
            <Badge className="ml-2 h-5 w-5 p-0 text-xs bg-primary text-primary-foreground rounded-full flex items-center justify-center">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtreler
            </h4>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <ScrollArea className="h-80">
            <div className="space-y-4">
              {/* Status Filter */}
              <div>
                <h5 className="font-medium mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Durum
                </h5>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="status-all"
                      checked={tempFilters.status === 'all'}
                      onCheckedChange={() => handleStatusChange('all')}
                    />
                    <label htmlFor="status-all" className="text-sm cursor-pointer">
                      Tümü
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="status-solved"
                      checked={tempFilters.status === 'solved'}
                      onCheckedChange={() => handleStatusChange('solved')}
                    />
                    <label htmlFor="status-solved" className="text-sm cursor-pointer flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      Çözülmüş Sorular
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="status-unsolved"
                      checked={tempFilters.status === 'unsolved'}
                      onCheckedChange={() => handleStatusChange('unsolved')}
                    />
                    <label htmlFor="status-unsolved" className="text-sm cursor-pointer flex items-center gap-1">
                      <Clock className="w-3 h-3 text-orange-500" />
                      Çözülmemiş Sorular
                    </label>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Timeframe Filter */}
              <div>
                <h5 className="font-medium mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Zaman
                </h5>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="time-all"
                      checked={tempFilters.timeframe === 'all'}
                      onCheckedChange={() => handleTimeframeChange('all')}
                    />
                    <label htmlFor="time-all" className="text-sm cursor-pointer">
                      Tüm Zamanlar
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="time-week"
                      checked={tempFilters.timeframe === 'week'}
                      onCheckedChange={() => handleTimeframeChange('week')}
                    />
                    <label htmlFor="time-week" className="text-sm cursor-pointer flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-primary" />
                      Bu Hafta
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="time-month"
                      checked={tempFilters.timeframe === 'month'}
                      onCheckedChange={() => handleTimeframeChange('month')}
                    />
                    <label htmlFor="time-month" className="text-sm cursor-pointer">
                      Bu Ay
                    </label>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Categories Filter */}
              <div>
                <h5 className="font-medium mb-2">Kategoriler</h5>
                <div className="space-y-3">
                  {Object.entries(groupedCategories).map(([mainCategory, subCategories]) => (
                    <div key={mainCategory}>
                      <h6 className="text-xs font-medium text-primary mb-1">{mainCategory}</h6>
                      <div className="space-y-1 ml-2">
                        {subCategories.map((category) => (
                          <div key={category.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`cat-${category.id}`}
                              checked={tempFilters.categories.includes(category.sub_category)}
                              onCheckedChange={(checked) => 
                                handleCategoryToggle(category.sub_category, checked as boolean)
                              }
                            />
                            <label 
                              htmlFor={`cat-${category.id}`} 
                              className="text-xs cursor-pointer hover:text-primary transition-colors"
                            >
                              {category.sub_category}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="flex-1"
            >
              Temizle
            </Button>
            <Button
              onClick={handleApplyFilters}
              size="sm"
              className="flex-1 bg-gradient-primary"
            >
              Uygula
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};