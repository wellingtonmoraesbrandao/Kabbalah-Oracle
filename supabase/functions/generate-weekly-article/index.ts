
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

Deno.serve(async (req) => {
    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const geminiKey = Deno.env.get('GEMINI_API_KEY')!;

        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Check if we already have an article this week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const { data: existingArticle } = await supabase
            .from('weekly_articles')
            .select('created_at')
            .gte('created_at', oneWeekAgo.toISOString())
            .limit(1);

        if (existingArticle && existingArticle.length > 0) {
            return new Response(JSON.stringify({ 
                status: "skipped", 
                message: "Article already generated this week" 
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 2. Get current astrological context (you can customize this based on real data)
        const currentDate = new Date();
        const monthNames = [
            "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
        ];
        const currentMonth = monthNames[currentDate.getMonth()];
        
        // Get day of month
        const dayOfMonth = currentDate.getDate();

        // 3. Generate article theme based on date
        const themePrompt = `
        Como um estrategista de conteúdo místico, sugira um tema para o "Artigo da Semana" baseado no momento atual: ${currentMonth} (dia ${dayOfMonth}).
        
        Considere:
        - Fenômenos astrológicos do período
        - Energias numerológicas do momento
        - Tradições espirituais do mês (se houver)
        
        Retorne APENAS um JSON com:
        {
            "theme": "tema geral do artigo",
            "event_type": "tipo do evento (Planetário, Numerológico, Ritual, etc)",
            "title": "título inspirador e místico",
            "intro_hook": "gancho introdutório intrigante"
        }
        `;

        const themeResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: themePrompt }] }],
                generationConfig: { response_mime_type: "application/json" }
            })
        });

        const themeData = await themeResponse.json();
        const rawTheme = themeData.candidates?.[0]?.content?.parts?.[0]?.text;
        const theme = JSON.parse(rawTheme || "{}");

        // 4. Generate the full article content
        const contentPrompt = `
        Escreva um artigo completo e inspirador para a seção "Artigo da Semana" do app Kabbalah Oracle.

        TEMA: ${theme.theme || "O Poder Transformador das Estrelas"}
        TÍTULO: ${theme.title || "A Influência Cósmica da Semana"}
        TIPO: ${theme.event_type || "Celestial"}
        GANCHO: ${theme.intro_hook || "Prepare-se para uma semana de revelações"}

        REQUISITOS:
        1. Escreva em PORTUGUÊS DO BRASIL
        2. Use formatação Markdown rica (H1, H2, H3, negrito, blockquotes)
        3. Mínimo de 3 seções principais bem desenvolvidas
        4. Inclua uma seção de "Ação do Dia" ou "Prática Recomendada"
        5. Inclua uma reflexão ou mensagem final inspiradora
        6. Use tom místico, poético e sábio de um maestro numerólogo
        7. Máximo de 800 palavras
        8. Inclua correspondências numéricas quando relevante

        Estrutura sugerida:
        - Título H1
        - Parágrafo introdutório inspirador
        - Seção: A Energia da Semana (H2)
        - Seção: O Que Esperar (H2)
        - Seção: Prática Recomendada (H2)
        - Reflexão Final (H2)
        `;

        const contentResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: contentPrompt }] }],
                systemInstruction: {
                    parts: [{ text: "Você é um sábio místico especialista em Numerologia Kabbalística, Astrologia e Tradições Espirituais. Escreva em Português do Brasil com tom poético e inspirador." }]
                },
                generationConfig: {
                    temperature: 0.8,
                    maxOutputTokens: 2048,
                }
            })
        });

        const contentData = await contentResponse.json();
        const content = contentData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!content) {
            throw new Error("Failed to generate article content");
        }

        // 5. Select a mystical background image from Unsplash
        const imageKeywords = [
            "celestial-universe-stars",
            "mystical-night-sky",
            "cosmic-constellation",
            "spiritual-light-rays",
            "sacred-geometry-stars"
        ];
        const randomKeyword = imageKeywords[Math.floor(Math.random() * imageKeywords.length)];
        const imageUrl = `https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000&auto=format&fit=crop&sig=${Date.now()}`;

        // 6. Delete old articles and insert new one
        await supabase.from('weekly_articles').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        const { data, error } = await supabase
            .from('weekly_articles')
            .insert({
                title: theme.title || "A Influência Cósmica da Semana",
                content: content,
                event_type: theme.event_type || "Celestial",
                image_url: imageUrl
            })
            .select()
            .single();

        if (error) throw error;

        return new Response(JSON.stringify({
            status: "success",
            article: {
                id: data.id,
                title: data.title,
                event_type: data.event_type
            }
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error generating weekly article:', error);
        return new Response(JSON.stringify({ 
            error: error.message 
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});
