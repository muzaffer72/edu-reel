-- Create table for managing exam categories
CREATE TABLE public.exam_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  main_category text NOT NULL,
  sub_category text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  UNIQUE(main_category, sub_category)
);

-- Enable RLS
ALTER TABLE public.exam_categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Categories are viewable by everyone" 
ON public.exam_categories 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage categories" 
ON public.exam_categories 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for timestamps
CREATE TRIGGER update_exam_categories_updated_at
BEFORE UPDATE ON public.exam_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default categories
INSERT INTO public.exam_categories (main_category, sub_category, created_by) VALUES
('KPSS', 'Matematik', (SELECT id FROM auth.users LIMIT 1)),
('KPSS', 'Geometri', (SELECT id FROM auth.users LIMIT 1)),
('KPSS', 'Türkçe', (SELECT id FROM auth.users LIMIT 1)),
('KPSS', 'Tarih', (SELECT id FROM auth.users LIMIT 1)),
('KPSS', 'Coğrafya', (SELECT id FROM auth.users LIMIT 1)),
('KPSS', 'Vatandaşlık', (SELECT id FROM auth.users LIMIT 1)),
('KPSS', 'Genel Kültür', (SELECT id FROM auth.users LIMIT 1)),
('KPSS', 'Anayasa', (SELECT id FROM auth.users LIMIT 1)),
('TYT', 'Matematik', (SELECT id FROM auth.users LIMIT 1)),
('TYT', 'Geometri', (SELECT id FROM auth.users LIMIT 1)),
('TYT', 'Türkçe', (SELECT id FROM auth.users LIMIT 1)),
('TYT', 'Tarih', (SELECT id FROM auth.users LIMIT 1)),
('TYT', 'Coğrafya', (SELECT id FROM auth.users LIMIT 1)),
('TYT', 'Felsefe', (SELECT id FROM auth.users LIMIT 1)),
('TYT', 'Fizik', (SELECT id FROM auth.users LIMIT 1)),
('TYT', 'Kimya', (SELECT id FROM auth.users LIMIT 1)),
('TYT', 'Biyoloji', (SELECT id FROM auth.users LIMIT 1)),
('AYT', 'Matematik', (SELECT id FROM auth.users LIMIT 1)),
('AYT', 'Fizik', (SELECT id FROM auth.users LIMIT 1)),
('AYT', 'Kimya', (SELECT id FROM auth.users LIMIT 1)),
('AYT', 'Biyoloji', (SELECT id FROM auth.users LIMIT 1)),
('AYT', 'Türk Dili ve Edebiyatı', (SELECT id FROM auth.users LIMIT 1)),
('AYT', 'Tarih-1', (SELECT id FROM auth.users LIMIT 1)),
('AYT', 'Coğrafya-1', (SELECT id FROM auth.users LIMIT 1)),
('AYT', 'Felsefe', (SELECT id FROM auth.users LIMIT 1)),
('DGS', 'Matematik', (SELECT id FROM auth.users LIMIT 1)),
('DGS', 'Türkçe', (SELECT id FROM auth.users LIMIT 1)),
('DGS', 'Sözel Mantık', (SELECT id FROM auth.users LIMIT 1)),
('DGS', 'Sayısal Mantık', (SELECT id FROM auth.users LIMIT 1)),
('ALES', 'Matematik', (SELECT id FROM auth.users LIMIT 1)),
('ALES', 'Türkçe', (SELECT id FROM auth.users LIMIT 1)),
('ALES', 'Sözel Mantık', (SELECT id FROM auth.users LIMIT 1)),
('ALES', 'Sayısal Mantık', (SELECT id FROM auth.users LIMIT 1)),
('YÖKDİL', 'İngilizce', (SELECT id FROM auth.users LIMIT 1)),
('YÖKDİL', 'Almanca', (SELECT id FROM auth.users LIMIT 1)),
('YÖKDİL', 'Fransızca', (SELECT id FROM auth.users LIMIT 1)),
('YÖKDİL', 'Rusça', (SELECT id FROM auth.users LIMIT 1)),
('YÖKDİL', 'Arapça', (SELECT id FROM auth.users LIMIT 1)),
('Öğretmenlik (KPSS)', 'ÖABT Matematik', (SELECT id FROM auth.users LIMIT 1)),
('Öğretmenlik (KPSS)', 'ÖABT Türkçe', (SELECT id FROM auth.users LIMIT 1)),
('Öğretmenlik (KPSS)', 'ÖABT Fen', (SELECT id FROM auth.users LIMIT 1)),
('Öğretmenlik (KPSS)', 'ÖABT Sosyal', (SELECT id FROM auth.users LIMIT 1)),
('Öğretmenlik (KPSS)', 'Eğitim Bilimleri', (SELECT id FROM auth.users LIMIT 1)),
('Öğretmenlik (KPSS)', 'Genel Kültür', (SELECT id FROM auth.users LIMIT 1)),
('MSÜ', 'Matematik', (SELECT id FROM auth.users LIMIT 1)),
('MSÜ', 'Fizik', (SELECT id FROM auth.users LIMIT 1)),
('MSÜ', 'Kimya', (SELECT id FROM auth.users LIMIT 1)),
('MSÜ', 'Türkçe', (SELECT id FROM auth.users LIMIT 1)),
('MSÜ', 'Tarih', (SELECT id FROM auth.users LIMIT 1)),
('MSÜ', 'Coğrafya', (SELECT id FROM auth.users LIMIT 1)),
('PMYO', 'Matematik', (SELECT id FROM auth.users LIMIT 1)),
('PMYO', 'Türkçe', (SELECT id FROM auth.users LIMIT 1)),
('PMYO', 'Genel Kültür', (SELECT id FROM auth.users LIMIT 1)),
('PMYO', 'IQ-Mantık', (SELECT id FROM auth.users LIMIT 1));