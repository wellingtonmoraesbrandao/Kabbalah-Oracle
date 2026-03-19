
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// Load from .env.local explicitly
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const geminiKey = process.env.VITE_GEMINI_API_KEY;

if (!supabaseUrl || !supabaseKey || !geminiKey) {
    console.error("Missing environment variables in .env.local. Found:");
    console.log("URL:", !!supabaseUrl);
    console.log("KEY:", !!supabaseKey);
    console.log("GEMINI:", !!geminiKey);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenAI(geminiKey);

async function generateAndSeed() {
    console.log("Generating article content via Gemini...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    Escreva um artigo místico e inspirador para um aplicativo espiritual chamado "Mística".
    Título: O Grande Alinhamento de Vênus e Marte
    Assunto: Como o encontro desses dois planetas influencia o amor, a paixão e a ação nesta semana.
    Tom: Positivo, sábio, poético.
    Formato: Markdown.
    Estrutura: 
    - Uma introdução envolvente sobre a dança cósmica entre o Feminino Sagrado (Vênus) e o Masculino Divino (Marte).
    - Como harmonizar sentimentos e desejos.
    - Como usar essa energia para impulsionar novos projetos.
    - Um conselho final de luz.
    Máximo de 350 palavras.
  `;

    try {
        const result = await model.generateContent(prompt);
        const content = result.response.text();
        console.log("Content generated successfully.");

        const article = {
            title: "O Grande Alinhamento de Vênus e Marte",
            content: content,
            event_type: "Planetário",
            image_url: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=1000&auto=format&fit=crop",
        };

        console.log("Cleaning old articles...");
        await supabase.from('weekly_articles').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        console.log("Inserting into Supabase...");
        const { data, error } = await supabase
            .from('weekly_articles')
            .insert([article])
            .select();

        if (error) throw error;

        console.log("Article seeded successfully:", data[0].id);
    } catch (error) {
        console.error("Error during seeding:", error);
    }
}

generateAndSeed();
