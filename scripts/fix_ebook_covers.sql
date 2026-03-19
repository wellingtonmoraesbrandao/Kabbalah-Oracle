-- Script SQL para adicionar capas aos ebooks no Supabase
-- Execute este código no SQL Editor do Supabase

-- Atualizar capas berdasarkan kategori
UPDATE public.ebooks
SET image_url = CASE 
    WHEN LOWER(category) LIKE '%amor%' THEN 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80'
    WHEN LOWER(category) LIKE '%prosperidade%' THEN 'https://images.unsplash.com/photo-1530973428-5bf2db2e4d71?w=400&q=80'
    WHEN LOWER(category) LIKE '%numerologia%' THEN 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&q=80'
    WHEN LOWER(category) LIKE '%espiritualidade%' THEN 'https://images.unsplash.com/photo-1505506874110-6a7a69069a08?w=400&q=80'
    ELSE 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&q=80'
END
WHERE image_url IS NULL OR image_url = '';

-- Verificar resultado
SELECT id, title, category, image_url FROM public.ebooks LIMIT 10;
