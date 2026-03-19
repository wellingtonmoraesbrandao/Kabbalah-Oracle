
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/genai";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const geminiKey = process.env.VITE_GEMINI_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(geminiKey);
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: "Você é um autor místico especialista em Numerologia, Cabala e Espiritualidade. Escreva em Português do Brasil."
});

async function generateEbookContent(idea) {
    console.log(`\n🎯 Planejando Estrutura: ${idea.title}`);
    
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

    const structureResult = await model.generateContent(structurePrompt);
    let structureRaw = structureResult.response.text();
    console.log("--- Raw Structure ---");
    console.log(structureRaw);
    console.log("---------------------");
    structureRaw = structureRaw.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let structure;
    try {
        structure = JSON.parse(structureRaw);
    } catch (e) {
        const match = structureRaw.match(/\{[\s\S]*\}/);
        if (match) structure = JSON.parse(match[0]);
        else throw new Error("Could not parse JSON structure");
    }

    let fullContent = `# ${idea.title}\n\n${structure.introduction || ""}\n\n---\n\n## Índice\n\n`;
    structure.chapters.forEach((ch, i) => {
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

        const chResult = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: chapterPrompt }] }],
            generationConfig: {
                maxOutputTokens: 8192,
                temperature: 0.8,
            }
        });
        const chText = chResult.response.text();
        fullContent += `\n\n${chText}\n\n---\n`;
    }

    fullContent += `\n## Conclusão\n\n${structure.conclusion || ""}\n`;
    return fullContent;
}

async function run() {
    const brokenBooks = [
        { id: "7c9af3e8-8b93-4a15-8488-cc9229fe28b6", title: "Os Melhores Dias Espirituais do Mês", category: "Previsões e Energia do Mês" },
        { id: "f20ca847-f72f-4df0-b307-eed5df55db20", title: "Guia Rápido da Numerologia Cabalística", category: "Numerologia" },
        { id: "8b8310e9-bbc0-494e-aa91-1135e6d15a98", title: "Números Mestres: O Poder do 11, 22 e 33", category: "Numerologia" },
        { id: "26d4767e-091f-4218-afef-cad628752d26", title: "A Proteção Espiritual Através dos Números", category: "Espiritualidade" }
    ];

    for (const book of brokenBooks) {
        console.log(`\n⏳ RE-GERANDO COMPLETAMENTE: ${book.title}`);
        try {
            const fullContent = await generateEbookContent(book);
            
            if (fullContent) {
                const { error } = await supabase.from('ebooks').update({ content: fullContent }).eq('id', book.id);
                if (error) console.error(`❌ Erro ao atualizar ${book.title}:`, error.message);
                else console.log(`✅ ${book.title} ATUALIZADO com sucesso!`);
            }
        } catch (e) {
            console.error(`❌ Falha no processamento de ${book.title}:`, e.message);
        }
        await new Promise(r => setTimeout(r, 2000));
    }
}

run();
