import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Trash2, Edit, Plus, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ExamCategory {
  id: string;
  main_category: string;
  sub_category: string;
  created_at: string;
}

export const CategoryManagement = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<ExamCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExamCategory | null>(null);
  const [formData, setFormData] = useState({
    main_category: '',
    sub_category: ''
  });

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

  const handleSave = async () => {
    if (!formData.main_category.trim() || !formData.sub_category.trim()) {
      toast({
        title: 'Hata',
        description: 'Lütfen tüm alanları doldurun',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('exam_categories')
          .update({
            main_category: formData.main_category,
            sub_category: formData.sub_category
          })
          .eq('id', editingCategory.id);

        if (error) throw error;
        
        toast({
          title: 'Başarılı',
          description: 'Kategori güncellendi',
        });
      } else {
        const { error } = await supabase
          .from('exam_categories')
          .insert({
            main_category: formData.main_category,
            sub_category: formData.sub_category,
            created_by: (await supabase.auth.getUser()).data.user?.id
          });

        if (error) throw error;
        
        toast({
          title: 'Başarılı',
          description: 'Kategori eklendi',
        });
      }

      setDialogOpen(false);
      setEditingCategory(null);
      setFormData({ main_category: '', sub_category: '' });
      fetchCategories();
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: editingCategory ? 'Kategori güncellenemedi' : 'Kategori eklenemedi',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('exam_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'Başarılı',
        description: 'Kategori silindi',
      });
      
      fetchCategories();
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: 'Kategori silinemedi',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (category: ExamCategory) => {
    setEditingCategory(category);
    setFormData({
      main_category: category.main_category,
      sub_category: category.sub_category
    });
    setDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingCategory(null);
    setFormData({ main_category: '', sub_category: '' });
    setDialogOpen(true);
  };

  const groupedCategories = categories.reduce((acc, category) => {
    if (!acc[category.main_category]) {
      acc[category.main_category] = [];
    }
    acc[category.main_category].push(category);
    return acc;
  }, {} as Record<string, ExamCategory[]>);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center">Kategoriler yükleniyor...</div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Kategori Yönetimi</h3>
        </div>
        <Button onClick={openAddDialog} className="bg-gradient-primary">
          <Plus className="w-4 h-4 mr-2" />
          Yeni Kategori
        </Button>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedCategories).map(([mainCategory, subCategories]) => (
          <div key={mainCategory} className="border rounded-lg p-4">
            <h4 className="font-medium text-primary mb-3">{mainCategory}</h4>
            <div className="flex flex-wrap gap-2">
              {subCategories.map((category) => (
                <div key={category.id} className="flex items-center gap-1 group">
                  <Badge variant="secondary" className="py-1">
                    {category.sub_category}
                  </Badge>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-primary/10"
                      onClick={() => openEditDialog(category)}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-destructive/10"
                      onClick={() => handleDelete(category.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Kategori Düzenle' : 'Yeni Kategori Ekle'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="main_category">Ana Kategori</Label>
              <Input
                id="main_category"
                placeholder="Örn: KPSS, TYT, AYT"
                value={formData.main_category}
                onChange={(e) => setFormData(prev => ({ ...prev, main_category: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="sub_category">Alt Kategori</Label>
              <Input
                id="sub_category"
                placeholder="Örn: Matematik, Türkçe"
                value={formData.sub_category}
                onChange={(e) => setFormData(prev => ({ ...prev, sub_category: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSave} className="bg-gradient-primary">
              {editingCategory ? 'Güncelle' : 'Ekle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};