
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const geminiKey = process.env.VITE_GEMINI_API_KEY!;

async function test() {
    const prompt = `
    Você é um estrategista de conteúdo místico. Sugira 2 títulos de mini ebooks.
    Retorne APENAS um JSON no formato: [{"title": "...", "category": "...", "keyword": "..."}]
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });

    const data = await response.json();
    console.log("RAW DATA:", JSON.stringify(data, null, 2));
}

test();
