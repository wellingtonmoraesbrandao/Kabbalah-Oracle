/**
 * Script para adicionar capas aos ebooks que não têm image_url
 * Execute: npx ts-node scripts/add-covers-to-ebooks.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const categoryImages: Record<string, string> = {
  'amor': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80',
  'prosperidade': 'https://images.unsplash.com/photo-1530973428-5bf2db2e4d71?w=400&q=80',
  'numerologia': 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&q=80',
  'espiritualidade': 'https://images.unsplash.com/photo-1505506874110-6a7a69069a08?w=400&q=80',
  'default': 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&q=80'
};

async function addCovers() {
  console.log('📚 Adicionando capas aos ebooks...\n');

  try {
    const { data: ebooks, error } = await supabase
      .from('ebooks')
      .select('id, title, category');

    if (error) throw error;
    if (!ebooks || ebooks.length === 0) {
      console.log('Nenhum ebook encontrado.');
      return;
    }

    console.log(`Encontrados ${ebooks.length} ebooks\n`);

    for (const book of ebooks) {
      const category = book.category?.toLowerCase() || '';
      const imageUrl = categoryImages[category] || categoryImages['default'];

      const { error: updateError } = await supabase
        .from('ebooks')
        .update({ image_url: imageUrl })
        .eq('id', book.id);

      if (updateError) {
        console.log(`❌ Erro ao atualizar ${book.title}:`, updateError.message);
      } else {
        console.log(`✅ ${book.title}`);
      }
    }

    console.log('\n🎉 Processo concluído!');
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

addCovers();
