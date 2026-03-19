
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

import * as fs from 'fs';

async function uploadCoverToStorage(url: string, title: string) {
    try {
        if (url.includes('supabase.co')) {
            console.log(`⏩ Já está no Storage: ${title}`);
            return url;
        }

        let buffer: Buffer;
        let contentType = 'image/png'; // Default to png since current local ones are png

        if (url.startsWith('/src/assets/')) {
            const localPath = path.join(process.cwd(), url.replace(/^\//, ''));
            console.log(`📁 Lendo arquivo local: ${localPath}...`);
            if (fs.existsSync(localPath)) {
                buffer = fs.readFileSync(localPath);
                contentType = url.endsWith('.jpg') || url.endsWith('.jpeg') ? 'image/jpeg' : 'image/png';
            } else {
                console.warn(`⚠️ Arquivo não encontrado: ${localPath}`);
                return url;
            }
        } else if (url.startsWith('http')) {
            console.log(`🖼️ Baixando e subindo capa para: ${title}...`);
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
            contentType = 'image/jpeg';
        } else {
            console.warn(`🤔 URL desconhecida para ${title}: ${url}`);
            return url;
        }
        
        const sanitizedTitle = title
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
            
        const fileName = `${sanitizedTitle}-${Date.now()}.${contentType.split('/')[1]}`;
        const filePath = `covers/${fileName}`;

        const { error } = await supabase.storage
            .from('Ebooks')
            .upload(filePath, buffer, {
                contentType,
                upsert: true
            });

        if (error) {
            console.error(`❌ Erro no upload para ${title}:`, error);
            throw error;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('Ebooks')
            .getPublicUrl(filePath);

        return publicUrl;
    } catch (e) {
        console.error(`❌ Falha crítica em ${title}:`, e);
        return url;
    }
}

async function fixExisting() {
    console.log("🛠️ Iniciando migração de capas para o Storage...");
    
    const { data: ebooks, error } = await supabase.from('ebooks').select('id, title, image_url');
    
    if (error) {
        console.error("❌ Erro ao buscar ebooks:", error);
        return;
    }

    if (!ebooks) return;
    console.log(`📊 Total de ebooks no Banco: ${ebooks.length}`);
    console.dir(ebooks);

    for (const book of ebooks) {
        console.log(`🔍 Checando: ${book.title} | URL: ${book.image_url}`);
        if (book.image_url && !book.image_url.includes('supabase.co')) {
            console.log(`👉 Processando ${book.title}...`);
            const newUrl = await uploadCoverToStorage(book.image_url, book.title);
            
            if (newUrl !== book.image_url) {
                const { error: updateError } = await supabase
                    .from('ebooks')
                    .update({ image_url: newUrl })
                    .eq('id', book.id);
                
                if (updateError) console.error(`❌ Erro ao atualizar DB para ${book.title}:`, updateError);
                else console.log(`✅ ${book.title} atualizado!`);
            }
        } else {
            // console.log(`⏩ Pulando ${book.title} (já migrado ou sem capa)`);
        }
    }
    
    console.log("\n🎉 Migração concluída!");
}

fixExisting();
