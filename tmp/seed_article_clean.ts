
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing environment variables in .env.local.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const articleContent = `
Nesta semana, o cosmos nos presenteia com um espetáculo de rara beleza e poder: o alinhamento entre **Vênus**, a soberana do amor, e **Marte**, o guerreiro da ação. Esta "Dança Celestial" marca um momento de síntese profunda entre o sentir e o realizar.

### O Despertar do Coração
Vênus nos convida a suavizar as arestas. É o momento ideal para curar feridas em relacionamentos e redescobrir o que realmente traz prazer à sua alma.

### O Impulso da Realização
Enquanto Vênus traz a visão, Marte oferece o motor. Este guerreiro espiritual nos dá a coragem necessária para tirar os sonhos do papel. 

### Harmonizando as Energias
O segredo desta semana é o **Equilíbrio**. Não se trata apenas de desejar, mas de agir com amor. Quando nossas ações são guiadas pelos valores do coração, o universo conspira a nosso favor.

*Que as luzes de Vênus e Marte iluminem seu caminho.*
`;

async function seed() {
    console.log("Updating article with professional layout...");

    try {
        const article = {
            title: "O Grande Alinhamento de Vênus e Marte",
            content: articleContent,
            event_type: "Portal Astral",
            // Using a high-quality mystical astronomy image from Unsplash
            image_url: "https://images.unsplash.com/photo-1464802686167-b939a6910659?q=80&w=2000&auto=format&fit=crop",
        };

        await supabase.from('weekly_articles').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        const { data, error } = await supabase
            .from('weekly_articles')
            .insert([article])
            .select();

        if (error) throw error;
        console.log("Article updated successfully.");
    } catch (error) {
        console.error("Error:", error);
    }
}

seed();
