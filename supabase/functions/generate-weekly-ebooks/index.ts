
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

Deno.serve(async (req) => {
    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const geminiKey = Deno.env.get('GEMINI_API_KEY')!;

        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Fetch existing ebook titles
        const { data: existingEbooks } = await supabase
            .from('ebooks')
            .select('title');

        const existingTitles = existingEbooks?.map(e => e.title).join(', ') || "Nenhum ainda";

        // 2. Ask Gemini for NEW IDEAS (Title + Category + Image Keyword)
        const ideaPrompt = `
        Você é um estrategista de conteúdo místico. Com base nos ebooks que já temos: [${existingTitles}], 
        sugira 2 NOVOS títulos de mini ebooks e suas respectivas categorias (Amor, Prosperidade, Autoconhecimento, Numerologia ou Espiritualidade).
        Para cada um, sugira também uma palavra-chave em inglês para uma imagem de capa mística (ex: "stardust", "mystic-crystal", "celestial-map").
        O conteúdo deve ser inédito e não repetitivo.
        Retorne APENAS um JSON no formato: [{"title": "...", "category": "...", "keyword": "..."}, ...]
        `;

        const ideaResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: ideaPrompt }] }],
                generationConfig: { response_mime_type: "application/json" }
            })
        });

        const ideaData = await ideaResponse.json();
        const rawIdeas = ideaData.candidates?.[0]?.content?.parts?.[0]?.text;
        const selectedIdeas = JSON.parse(rawIdeas || "[]");

        if (selectedIdeas.length === 0) {
            return new Response(JSON.stringify({ message: "Gemini failed to generate ideas" }), { status: 500 });
        }

        const generatedEbooks = [];

        for (const idea of selectedIdeas) {
            console.log(`Generating: ${idea.title}`);

            const contentPrompt = `
            Escreva um mini ebook completo intitulado "${idea.title}" para a categoria "${idea.category}".
            O ebook deve ser profundo, sábio e acolhedor, no tom de um mestre de numerologia e cabala.
            
            REQUISITOS OBRIGATÓRIOS:
            - Mínimo de 5 capítulos ou seções bem desenvolvidas.
            - Formatação Markdown rica (títulos H1, H2, H3, negrito, itálico, blockquotes, listas).
            - **IMPORTANTE**: No início de CADA capítulo/seção (H1 ou H2), insira um banner de imagem usando: ![Banner](/src/assets/celestial_bg.png)
            - Use pelo menos uma tabela de correspondência ou referência.
            - Inclua rituais ou exercícios práticos.
            - Texto longo (5-10 páginas).
            - Use quebras de linha frequentes (double newlines).
            
            ESTRUTURA SUGERIDA:
            1. Introdução Inspiradora (com banner).
            2. Fundamentos Numerológicos/Espirituais (com banner).
            3. Aprofundamento e Simbolismo (com banner).
            4. Práticas, Rituais ou Exercícios (com banner).
            5. Conclusão e Mensagem Final (com banner).
            `;

            const contentResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: contentPrompt }] }],
                    systemInstruction: {
                        parts: [{ text: "Você é um autor místico especialista em Numerologia, Cabala e Espiritualidade. Escreva em Português do Brasil." }]
                    },
                    generationConfig: {
                        temperature: 0.8,
                        maxOutputTokens: 4096,
                    }
                })
            });

            const contentData = await contentResponse.json();
            const content = contentData.candidates?.[0]?.content?.parts?.[0]?.text;

            if (content) {
                // Construct a dynamic Unsplash URL using the keyword provided by Gemini
                const coverImage = `https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400&auto=format&fit=crop&sig=${Math.random()}&${idea.keyword}`;

                const { error } = await supabase.from('ebooks').insert({
                    title: idea.title,
                    category: idea.category,
                    content: content,
                    image_url: coverImage
                });

                if (!error) {
                    generatedEbooks.push(idea.title);
                }
            }
        }

        return new Response(JSON.stringify({
            status: "success",
            generated: generatedEbooks
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});
