import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { createCheckoutSession, getSavedPremiumEmail, savePremiumEmail } from '../lib/stripe';
import { Check, Sparkles, Mail, User, LogIn, AlertCircle, Send } from 'lucide-react';

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

export const SubscriptionPlans: React.FC<{
  userEmail?: string;
  userName?: string;
  onLoginSuccess?: () => void;
}> = ({ userEmail, userName, onLoginSuccess }) => {
  const [prices, setPrices] = useState<Price[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  useEffect(() => {
    fetchPrices();
    const savedEmail = getSavedPremiumEmail();
    if (savedEmail) {
      setLoginEmail(savedEmail);
    }
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
    const email = loginEmail || userEmail;
    if (email) savePremiumEmail(email);

    setSubscribing(priceId);
    try {
      await createCheckoutSession(priceId, email, userName);
    } catch (err: any) {
      console.error('Subscription error:', err);
      alert(`Erro ao iniciar o checkout: ${err?.message || 'Tente novamente.'}`);
    } finally {
      setSubscribing(null);
    }
  };

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginEmail) {
      setLoginError('Digite seu email');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(loginEmail)) {
      setLoginError('Digite um email válido');
      return;
    }

    setLoginLoading(true);
    setLoginError('');
    setLoginSuccess(false);
    setMagicLinkSent(false);

    try {
      // Check if user has active subscription first by calling our edge function
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        body: { email: loginEmail.toLowerCase() }
      });

      if (error) {
        throw new Error('Erro ao verificar assinatura. Tente novamente.');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.hasActiveSubscription) {
        throw new Error('Nenhuma assinatura ativa encontrada para este email. Assine primeiro!');
      }

      // User has active subscription - send magic link for instant login
      // The magic link will redirect back to the app and log them in
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: loginEmail.toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/?welcome=true`,
        },
      });

      if (signInError) throw signInError;

      // Show success message
      setMagicLinkSent(true);
      setLoginSuccess(true);
      savePremiumEmail(loginEmail.toLowerCase());

    } catch (err: any) {
      console.error('Login error:', err);
      setLoginError(err.message || 'Erro ao fazer login. Tente novamente.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleGuestLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginEmail) {
      setLoginError('Digite seu email');
      return;
    }

    setLoginLoading(true);
    setLoginError('');
    setLoginSuccess(false);
    setMagicLinkSent(false);

    try {
      // For guest users (no subscription), send magic link for newsletter/free content
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: loginEmail.toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/?welcome=true`,
        },
      });

      if (signInError) throw signInError;

      setMagicLinkSent(true);
      setLoginSuccess(true);

    } catch (err: any) {
      console.error('Guest login error:', err);
      setLoginError(err.message || 'Erro ao fazer login. Tente novamente.');
    } finally {
      setLoginLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8 text-indigo-200">Carregando...</div>;
  }

  return (
    <div className="flex flex-col gap-6 px-1 pb-4">
      {/* Planos de Assinatura */}
      <div>
        <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
          <Sparkles size={14} className="text-mystic-gold" />
          Assinar Premium
        </h3>
        <div className="flex flex-col gap-4">
          {prices.map((price) => (
            <div
              key={price.id}
              className="relative bg-gradient-to-br from-indigo-900/40 to-purple-900/40 backdrop-blur-xl rounded-xl p-5 border border-white/10 hover:border-indigo-500/50 transition-all"
            >
              {price.products.name.toLowerCase().includes('premium') && (
                <div className="absolute -top-2.5 left-4 bg-gradient-to-r from-amber-400 to-orange-500 text-black text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-lg">
                  Popular
                </div>
              )}

              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-base font-bold text-white">{price.products.name}</h4>
                  <p className="text-xs text-gray-400 leading-tight">{price.products.description}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-white">
                    {(price.unit_amount / 100).toLocaleString('pt-BR', { style: 'currency', currency: price.currency })}
                  </span>
                  <span className="text-gray-400 text-xs block">/{price.interval === 'month' ? 'mês' : 'ano'}</span>
                </div>
              </div>

              <ul className="space-y-1.5 mb-4">
                <li className="flex items-center gap-2 text-xs text-gray-300">
                  <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>Biblioteca Completa</span>
                </li>
                <li className="flex items-center gap-2 text-xs text-gray-300">
                  <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>Oráculo Ilimitado</span>
                </li>
                <li className="flex items-center gap-2 text-xs text-gray-300">
                  <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>Previsões Diárias</span>
                </li>
              </ul>

              <button
                onClick={() => handleSubscribe(price.id)}
                disabled={subscribing !== null}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#f9d423] hover:from-[#f9d423] hover:to-[#d4af37] text-black font-bold text-sm shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {subscribing === price.id ? (
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Assinar Agora
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Login para Assinantes */}
      <div className="border-t border-white/10 pt-5">
        <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
          <User size={14} className="text-mystic-gold" />
          Já sou Assinante
        </h3>

        {!magicLinkSent ? (
          <form onSubmit={handleMagicLinkLogin} className="space-y-3">
            <div>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => {
                    setLoginEmail(e.target.value);
                    setLoginError('');
                    setMagicLinkSent(false);
                  }}
                  placeholder="Seu email cadastrado"
                  className="w-full bg-mystic-bg/50 border border-mystic-primary/30 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:ring-1 focus:ring-mystic-gold outline-none"
                />
              </div>
              {loginError && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {loginError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-2.5 rounded-lg bg-mystic-primary/30 hover:bg-mystic-primary/50 border border-mystic-primary/30 text-mystic-gold font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loginLoading ? (
                <div className="w-4 h-4 border-2 border-mystic-gold/30 border-t-mystic-gold rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={16} />
                  Enviar Link de Acesso
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center">
              Enviaremos um link de acesso para seu email
            </p>
          </form>
        ) : (
          <div className="text-center py-4">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Check className="w-6 h-6 text-emerald-400" />
            </div>
            <h4 className="text-white font-bold mb-1">Link Enviado!</h4>
            <p className="text-xs text-gray-400">
              Verifique seu email <span className="text-mystic-gold">{loginEmail}</span> e clique no link para acessar sua conta.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
