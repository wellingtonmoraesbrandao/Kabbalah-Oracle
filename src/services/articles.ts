import { supabase } from '../lib/supabase';
import { chatWithIA } from './gemini';

export interface WeeklyArticle {
    id: string;
    title: string;
    content: string;
    event_type: string;
    image_url: string;
    created_at: string;
}

export const fetchLatestWeeklyArticle = async (): Promise<WeeklyArticle | null> => {
    const { data, error } = await supabase
        .from('weekly_articles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        console.error('Error fetching weekly article:', error);
        return null;
    }

    return data;
};

export const generatePersonalInfluence = async (
    articleTitle: string,
    articleContent: string,
    destinyNumber: number,
    destinyMeaning: string
) => {
    const prompt = `
    Como um Guia Estelar, analise o seguinte artigo semanal:
    Título: ${articleTitle}
    Conteúdo: ${articleContent}

    Agora, gere uma breve mensagem de "Influência Estelar" (máximo 2 parágrafos pequenos) especificamente para alguém com o Número de Destino ${destinyNumber} (${destinyMeaning}).
    
    A mensagem deve ser EXTREMAMENTE POSITIVA e motivadora, explicando como os eventos descritos no artigo podem ser usados como um ponto de influência favorável para essa pessoa.
    Use um tom místico, poético e sábio.
  `;


    return await chatWithIA(prompt, []);
};

export const generateDailyForecast = async (
    destinyNumber: number,
    destinyMeaning: string,
    zodiacSign: string
) => {
    const prompt = `
    Como um Guia Estelar e Oráculo de Numerologia Kabbalística, gere uma "Previsão Diária" personalizada para hoje.
    Dados do Buscador:
    - Número de Destino: ${destinyNumber} (${destinyMeaning})
    - Signo: ${zodiacSign}

    A mensagem deve ser:
    1. Mística, profunda e encorajadora.
    2. Focar em uma "vibração do dia" específica (ex: clareza, proteção, expansão, colheita).
    3. Conter um curto conselho prático baseado na energia numerológica.
    4. Ter no máximo 2 parágrafos curtos.
    
    Responda apenas com o texto da previsão, sem introduções ou saudações formais.
  `;

    return await chatWithIA(prompt, []);
};
