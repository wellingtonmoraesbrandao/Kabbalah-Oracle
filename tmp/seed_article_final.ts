
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// Load from .env.local explicitly
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing environment variables in .env.local.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const articleContent = `
# O Grande Alinhamento de Vênus e Marte: A Dança do Equilíbrio

Nesta semana, o cosmos nos presenteia com um espetáculo de rara beleza e poder: o alinhamento entre **Vênus**, a soberana do amor e da harmonia, e **Marte**, o guerreiro da ação e do desejo. Esta "Dança Celestial" marca um momento de síntese profunda entre o sentir e o realizar.

## O Despertar do Coração (Vênus)
Vênus nos convida a suavizar as arestas. Em seu alinhamento, ela banha nossas intenções com uma luz de diplomacia e afeto. É o momento ideal para curar feridas em relacionamentos e redescobrir o que realmente traz prazer à sua alma. Pergunte-se: *O que meu coração deseja manifestar agora?*

## O Impulso da Realização (Marte)
Enquanto Vênus traz a visão, Marte oferece o motor. Este guerreiro espiritual nos dá a coragem necessária para tirar os sonhos do papel. Projetos que estavam estagnados ganham um novo fôlego. A energia de Marte, quando temperada pela doçura de Vênus, torna-se uma força imparável de criação consciente.

## Harmonizando as Energias
O segredo desta semana é o **Equilíbrio**. Não se trata apenas de desejar (Vênus) nem de agir impulsivamente (Marte), mas de agir com amor. Quando nossas ações são guiadas pelos valores do coração, o universo conspira a nosso favor.

### Conselho das Estrelas
Aproveite esta vibração para iniciar algo que exija tanto paixão quanto persistência. Seja uma conversa difícil ou um novo empreendimento, faça-o com a certeza de que o céu está alinhado para o seu sucesso.

*Que as luzes de Vênus e Marte iluminem seu caminho com amor e coragem.*
`;

async function seed() {
    console.log("Seeding hardcoded article...");

    try {
        const article = {
            title: "O Grande Alinhamento de Vênus e Marte",
            content: articleContent,
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

seed();
