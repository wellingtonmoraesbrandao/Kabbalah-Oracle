
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!; // Note: if RLS blocks this, I will use SQL execution via tool later if needed.
const geminiKey = process.env.VITE_GEMINI_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

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

async function run() {
    const brokenBooks = [
        { id: "7c9af3e8-8b93-4a15-8488-cc9229fe28b6", title: "Os Melhores Dias Espirituais do Mês", category: "Previsões e Energia do Mês" },
        // ... I'll do others one by one
    ];

    for (const book of brokenBooks.slice(0, 1)) {
        console.log(`\n⏳ RE-GERANDO COMPLETAMENTE (1/1): ${book.title}`);
        const fullContent = await generateEbookContent(book);
        
        if (fullContent) {
            const { error } = await supabase.from('ebooks').update({ content: fullContent }).eq('id', book.id);
            
            if (error) {
                console.error(`❌ Erro ao atualizar ${book.title} via SDK:`, error.message);
                // I'll use execute_sql tool if this happens
            } else {
                console.log(`✅ ${book.title} ATUALIZADO com sucesso!`);
            }
        }
    }
}

run();
