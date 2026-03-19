/**
 * Script para testar a geração do Artigo da Semana manualmente
 * Execute: npx ts-node scripts/test-weekly-article.ts
 */

async function testWeeklyArticle() {
    const functionUrl = 'https://bvtkplkxlgqqwikfuoya.supabase.co/functions/v1/generate-weekly-article';

    console.log('🚀 Disparando geração do Artigo da Semana...\n');

    try {
        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        console.log('✅ Resposta:', JSON.stringify(data, null, 2));

        if (data.status === 'success') {
            console.log('\n🎉 Artigo gerado com sucesso!');
            console.log(`📌 Título: ${data.article?.title}`);
        } else if (data.status === 'skipped') {
            console.log('\n⏭️ Artigo já existe para esta semana');
        } else if (data.error) {
            console.log('\n❌ Erro:', data.error);
        }
    } catch (error) {
        console.error('❌ Erro na requisição:', error);
    }
}

testWeeklyArticle();
