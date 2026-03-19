
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const geminiKey = process.env.VITE_GEMINI_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function completeEbook(id: string, title: string, currentContent: string) {
    console.log(`\n🛠️  Completando: ${title} (${id})`);
    
    const prompt = `
    Você é um mestre místico especialista em Numerologia e Cabala.
    O ebook intitulado "${title}" está incompleto. 
    Aqui está o conteúdo atual:
    
    ---
    ${currentContent}
    ---
    
    ESCREVA O RESTANTE DO EBOOK. 
    Certifique-se de:
    1. Continuar exatamente de onde o texto parou (se houver uma frase incompleta, complete-a).
    2. Seguir o índice ou a estrutura sugerida no início do texto.
    3. Garantir que TODOS os capítulos mencionados no índice sejam escritos de forma PROFUNDA e COMPLETA.
    4. Usar banners ![Banner](/src/assets/celestial_bg.png) no início de cada novo capítulo.
    5. Terminar com uma Conclusão poderosa.
    6. Retornar APENAS o novo texto que deve ser anexado (não repita o que já foi enviado, exceto o final da última frase para garantir a continuidade, se necessário).
    `;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                systemInstruction: {
                    parts: [{ text: "Você é um autor místico especialista em Numerologia, Cabala e Espiritualidade. Escreva em Português do Brasil." }]
                },
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 8192,
                }
            })
        });

        const data = await response.json();
        const continuation = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        
        if (continuation) {
            const finalContent = currentContent.trim() + "\n\n" + continuation.trim();
            const { error } = await supabase.from('ebooks').update({ content: finalContent }).eq('id', id);
            
            if (error) console.error(`❌ Erro ao atualizar ${title}:`, error);
            else console.log(`✅ ${title} completado e atualizado!`);
        }
    } catch (e) {
        console.error(`❌ Falha ao processar ${title}:`, e);
    }
}

async function run() {
    const { data: books } = await supabase
        .from('ebooks')
        .select('id, title, content')
        .order('created_at', { ascending: false })
        .limit(4);

    if (!books) return;

    for (const book of books) {
        await completeEbook(book.id, book.title, book.content);
        await new Promise(r => setTimeout(r, 2000));
    }
}

run();
