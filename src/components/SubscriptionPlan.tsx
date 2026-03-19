import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { createCheckoutSession } from '../lib/stripe';
import { Check, Sparkles } from 'lucide-react';

interface Price {
  id: string;
  unit_amount: number;
  currency: string;
  interval: string;
  products: {
    name: string;
    description: string;
  };
}

export const SubscriptionPlans: React.FC<{ userEmail?: string; userName?: string }> = ({ userEmail, userName }) => {
  const [prices, setPrices] = useState<Price[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    try {
      const { data, error } = await supabase
        .from('prices')
        .select('*, products(*)')
        .eq('active', true)
        .order('unit_amount');

      if (error) throw error;
      setPrices(data || []);
    } catch (err) {
      console.error('Error fetching prices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (priceId: string) => {
    setSubscribing(priceId);
    try {
      await createCheckoutSession(priceId, userEmail, userName);
    } catch (err: any) {
      console.error('Subscription error:', err);
      alert(`Erro ao iniciar o checkout: ${err?.message || 'Tente novamente.'}`);
    } finally {
      setSubscribing(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8 text-indigo-200">Carregando planos...</div>;
  }

  if (prices.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 text-center">
        <p className="text-gray-400 mb-4">Nenhum plano disponível no momento.</p>
        <p className="text-xs text-gray-500">Certifique-se de configurar seus produtos no Stripe Dashboard.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-2 pb-8">
      {prices.map((price) => (
        <div 
          key={price.id}
          className="relative bg-gradient-to-br from-indigo-900/40 to-purple-900/40 backdrop-blur-xl rounded-3xl p-6 border border-white/10 hover:border-indigo-500/50 transition-all group"
        >
          {price.products.name.toLowerCase().includes('premium') && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
              Mais Popular
            </div>
          )}
          
          <div className="mb-4">
            <h3 className="text-xl font-bold text-white mb-1">{price.products.name}</h3>
            <p className="text-sm text-gray-400 leading-tight">{price.products.description}</p>
          </div>

          <div className="mb-6 flex items-baseline">
            <span className="text-3xl font-bold text-white">
              {(price.unit_amount / 100).toLocaleString('pt-BR', { style: 'currency', currency: price.currency })}
            </span>
            <span className="text-gray-400 text-sm ml-1">/{price.interval === 'month' ? 'mês' : 'ano'}</span>
          </div>

          <ul className="space-y-3 mb-8">
            <li className="flex items-start gap-3 text-sm text-gray-300">
              <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <span>Acesso a Todos os Livros da Biblioteca</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-gray-300">
              <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <span>2 Livros Novos Toda Semana</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-gray-300">
              <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <span>Tire suas dúvidas com o Oráculo</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-gray-300">
              <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <span>Previsões Diárias</span>
            </li>
          </ul>

          <button
            onClick={() => handleSubscribe(price.id)}
            disabled={subscribing !== null}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#f9d423] hover:from-[#f9d423] hover:to-[#d4af37] text-black font-bold shadow-xl shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {subscribing === price.id ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4 capitalize" />
                Assinar Agora
              </>
            )}
          </button>
        </div>
      ))}
    </div>
  );
};
