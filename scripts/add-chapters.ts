import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const geminiKey = process.env.VITE_GEMINI_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateChapters() {
    console.log("🔮 Gerando capítulos faltantes...");
    
    const promptText = "Escreva o Capitulo 3, Capitulo 4 e Capitulo 5 de um ebook sobre 'Os Melhores Dias Espirituais do Mes'. Cada capitulo deve ter pelo menos 3-4 paragrafos ricos em conteudo espiritual e numerologico. Use ## para titulos de capitulo.";
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
        })
    });

    const data = await response.json();
    const newContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!newContent) {
        console.error("Erro:", data);
        return;
    }
    
    console.log("📄 Capítulos gerados!");
    
    // Get current content
    const { data: ebook } = await supabase
        .from('ebooks')
        .select('content')
        .eq('id', '7c9af3e8-8b93-4a15-8488-cc9229fe28b6')
        .single();
    
    if (ebook) {
        const updatedContent = ebook.content + "\n\n" + newContent;
        
        const { error } = await supabase
            .from('ebooks')
            .update({ content: updatedContent })
            .eq('id', '7c9af3e8-8b93-4a15-8488-cc9229fe28b6');
        
        if (error) {
            console.error("Erro ao salvar:", error);
        } else {
            console.log("✅ Capítulos 3, 4 e 5 adicionados!");
        }
    }
}

generateChapters();
