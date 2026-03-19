
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const geminiKey = process.env.VITE_GEMINI_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateNewIdeas(existingTitles: string[]) {
    console.log("🧠 Brainstorming novas ideias com Gemini...");
    
    const prompt = `
    Você é um estrategista de conteúdo místico. Com base nos ebooks que já temos: [${existingTitles.join(', ')}], 
    sugira 2 NOVOS títulos de mini ebooks e suas respectivas categorias (Amor, Prosperidade, Autoconhecimento, Numerologia ou Espiritualidade).
    Para cada um, sugira também uma palavra-chave em inglês para uma imagem de capa mística (ex: "stardust", "mystic-crystal", "celestial-map").
    O conteúdo deve ser inédito e não repetitivo.
    Retorne APENAS um JSON no formato: [{"title": "...", "category": "...", "keyword": "..."}, ...]
    `;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        if (data.error) {
            console.error("❌ Gemini Idea Error:", data.error.message);
            return [];
        }
        let rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
        // Clean markdown if Gemini wrapped it in ```json
        rawContent = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(rawContent);
    } catch (e) {
        console.error("❌ Error parsing ideas:", e);
        return [];
    }
}

async function generateEbookContent(idea: { title: string; category: string }) {
    console.log(`\n🎯 Planejando Estrutura: ${idea.title}`);
    
    // Step 1: Generate the Index
    const structurePrompt = `
    Crie a estrutura de capítulos para um ebook completo intitulado "${idea.title}" na categoria "${idea.category}".
    O tom deve ser de um mestre de numerologia e cabala.
    Retorne um JSON com a seguinte estrutura:
    {
        "introduction": "Breve parágrafo introdutório",
        "chapters": [
            {"title": "Título do Capítulo 1", "objective": "O que este capítulo deve cobrir"},
            ... (mínimo de 5 capítulos)
        ],
        "conclusion": "Resumo final esperado"
    }
    Retorne APENAS o JSON.
    `;

    const structureResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: structurePrompt }] }]
        })
    });

    const structureData = await structureResponse.json();
    let structureRaw = structureData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    structureRaw = structureRaw.replace(/```json/g, '').replace(/```/g, '').trim();
    const structure = JSON.parse(structureRaw);

    let fullContent = `# ${idea.title}\n\n${structure.introduction}\n\n---\n\n## Índice\n\n`;
    structure.chapters.forEach((ch: any, i: number) => {
        fullContent += `* **Capítulo ${i + 1}:** ${ch.title}\n`;
    });
    fullContent += `\n---\n\n`;

    // Step 2: Generate each chapter
    for (let i = 0; i < structure.chapters.length; i++) {
        const chapter = structure.chapters[i];
        console.log(`📖 Gerando Capítulo ${i + 1}/${structure.chapters.length}: ${chapter.title}...`);
        
        const chapterPrompt = `
        Escreva o conteúdo COMPLETO e PROFUNDO do Capítulo ${i + 1} para o ebook "${idea.title}".
        Título do Capítulo: ${chapter.title}
        Objetivo do Capítulo: ${chapter.objective}
        
        REQUISITOS:
        - Estilo de escrita: Místico, sábio, enriquecedor.
        - Comece o capítulo com: ![Banner](/src/assets/celestial_bg.png)
        - Use formatação Markdown rica (H2, H3, negrito, listas, blockquotes).
        - O texto deve ser longo e detalhado (mínimo de 800 palavras).
        - Se for um capítulo de rituais ou práticas, forneça passos detalhados.
        - Use quebras de linha frequentes.
        - Não coloque introduções ou conclusões gerais, foque apenas neste capítulo.
        `;

        const chResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: chapterPrompt }] }],
                systemInstruction: {
                    parts: [{ text: "Você é um autor místico especialista em Numerologia, Cabala e Espiritualidade. Escreva em Português do Brasil." }]
                },
                generationConfig: {
                    temperature: 0.8,
                    maxOutputTokens: 8192,
                }
            })
        });

        const chData = await chResponse.json();
        const chText = chData.candidates?.[0]?.content?.parts?.[0]?.text || "";
        fullContent += `\n\n${chText}\n\n---\n`;
    }

    // Step 3: Add Conclusion
    fullContent += `\n## Conclusão\n\n${structure.conclusion}\n`;

    return fullContent;
}

async function uploadCoverToStorage(url: string, title: string) {
    try {
        console.log(`🖼️ Baixando capa para: ${title}...`);
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        const fileName = `${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.jpg`;
        const filePath = `covers/${fileName}`;

        const { data, error } = await supabase.storage
            .from('Ebooks')
            .upload(filePath, buffer, {
                contentType: 'image/jpeg',
                upsert: true
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('Ebooks')
            .getPublicUrl(filePath);

        return publicUrl;
    } catch (e) {
        console.error("❌ Erro ao processar imagem:", e);
        return url; // Fallback to original URL
    }
}

async function main() {
    console.log("📚 Iniciando Sistema de Geração Dinâmica...");
    
    const { data: existing } = await supabase.from('ebooks').select('title');
    const existingTitles = existing?.map(e => e.title) || [];
    
    const newIdeas = await generateNewIdeas(existingTitles);
    console.log(`📝 Ideias selecionadas: ${newIdeas.map((i: any) => i.title).join(', ')}`);
    
    for (const idea of newIdeas) {
        const content = await generateEbookContent(idea);
        
        if (content) {
            const unsplashUrl = `https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400&auto=format&fit=crop&sig=${Math.random()}&${idea.keyword}`;
            
            // Upload to Supabase Storage
            const coverUrl = await uploadCoverToStorage(unsplashUrl, idea.title);

            const { error } = await supabase.from('ebooks').insert({
                title: idea.title,
                category: idea.category,
                content: content,
                image_url: coverUrl
            });
            
            if (error) {
                console.error(`❌ Erro ao salvar ${idea.title}:`, error);
            } else {
                console.log(`✅ ${idea.title} gerado e salvo com sucesso!`);
            }
        }
        
        await new Promise(r => setTimeout(r, 2000));
    }
    
    console.log("\n🎉 Processo Concluído!");
}

main();
