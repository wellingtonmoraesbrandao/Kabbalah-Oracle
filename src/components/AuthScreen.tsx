import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Moon, Mail, ArrowRight, Loader2, CheckCircle, Lock, User, Eye, EyeOff } from 'lucide-react';

type AuthMode = 'login' | 'register' | 'forgot' | 'verify';

export const AuthScreen = () => {
    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sent, setSent] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    React.useEffect(() => {
        const saved = localStorage.getItem('mystic_profile');
        if (saved) {
            const { email: savedEmail } = JSON.parse(saved);
            if (savedEmail) setEmail(savedEmail);
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
        } catch (err: any) {
            setError(err.message || 'Erro ao fazer login');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Use production URL to avoid localhost redirect issues
            const productionUrl = 'https://kabbalah-oraclel.vercel.app';

            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                    },
                    emailRedirectTo: productionUrl,
                },
            });

            if (error) throw error;
            setMessage('Conta criada! Verifique seu email para confirmar.');
            setMode('login');
        } catch (err: any) {
            setError(err.message || 'Erro ao criar conta');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);

        try {
            // Use production URL to avoid localhost redirect issues
            const productionUrl = 'https://kabbalah-oraclel.vercel.app';

            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: productionUrl,
                },
            });

            if (error) throw error;
        } catch (err: any) {
            setError(err.message || 'Erro com Google');
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Use production URL to avoid localhost redirect issues
            const productionUrl = 'https://kabbalah-oraclel.vercel.app';

            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${productionUrl}/reset-password`,
            });

            if (error) throw error;
            setSent(true);
        } catch (err: any) {
            setError(err.message || 'Erro ao enviar email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen celestial-bg flex flex-col items-center justify-center p-4 relative overflow-hidden text-slate-200 font-sans">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#181e26] rounded-full mix-blend-screen filter blur-[120px] opacity-40 animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#d4af37] rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-pulse delay-1000"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10"
            >
                <div className="flex flex-col mb-10 w-full pt-4">
                    <div className="flex items-center gap-2 mb-8">
                        <Sparkles className="text-mystic-gold" size={16} />
                        <span className="text-mystic-gold text-[10px] tracking-[0.2em] font-bold uppercase">
                            The Sacred Curator
                        </span>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-[1px] w-8 bg-mystic-gold/50"></div>
                        <span className="text-mystic-gold text-xs tracking-[0.15em] font-bold uppercase">
                            Portal da Sabedoria
                        </span>
                    </div>

                    <h1 className="text-5xl md:text-6xl font-black font-display text-white leading-[1.1] mb-6 drop-shadow-lg tracking-tight">
                        Desvende os<br />
                        Segredos da<br />
                        <span className="italic text-mystic-gold font-medium font-display tracking-normal pl-1">Alma</span>
                    </h1>

                    <p className="text-slate-300 text-[15px] leading-[1.7] max-w-sm mb-2">
                        Acesse a sabedoria ancestral da Kabbalah para iluminar seu caminho diário através de insights profundos e conexões espirituais autênticas.
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {mode === 'verify' && sent ? (
                        <motion.div
                            key="sent"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-4"
                        >
                            <div className="flex justify-center">
                                <CheckCircle size={64} className="text-emerald-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Email enviado!</h2>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Verifique sua caixa em <span className="text-mystic-gold font-bold">{email}</span>
                            </p>
                            <button
                                onClick={() => { setSent(false); setMode('login'); }}
                                className="text-xs text-slate-500 hover:text-mystic-gold transition-colors mt-4"
                            >
                                Voltar ao login
                            </button>
                        </motion.div>
                    ) : mode === 'forgot' ? (
                        <motion.div
                            key="forgot"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <button
                                onClick={() => setMode('login')}
                                className="text-xs text-slate-500 hover:text-mystic-gold mb-4 flex items-center gap-1"
                            >
                                <ArrowRight size={12} className="rotate-180" /> Voltar
                            </button>

                            {sent ? (
                                <div className="text-center space-y-4">
                                    <CheckCircle size={48} className="text-emerald-400 mx-auto" />
                                    <p className="text-slate-300 text-sm">Email de recuperação enviado!</p>
                                    <button
                                        onClick={() => { setSent(false); setMode('login'); }}
                                        className="text-xs text-mystic-gold hover:underline"
                                    >
                                        Voltar ao login
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleForgotPassword} className="space-y-4">
                                    <p className="text-slate-300 text-sm mb-4">Digite seu email para receber o link de recuperação.</p>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="seu@email.com"
                                            className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm placeholder:text-slate-500 focus:ring-2 focus:ring-mystic-gold focus:border-transparent transition-all outline-none"
                                        />
                                    </div>
                                    {error && <p className="text-red-400 text-xs">{error}</p>}
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full btn-gold py-3 rounded-xl flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={18} /> : 'Enviar Email'}
                                    </button>
                                </form>
                            )}
                        </motion.div>
                    ) : mode === 'register' ? (
                        <motion.div
                            key="register"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <button
                                onClick={() => setMode('login')}
                                className="text-xs text-slate-500 hover:text-mystic-gold mb-4 flex items-center gap-1"
                            >
                                <ArrowRight size={12} className="rotate-180" /> Voltar ao login
                            </button>

                            <form onSubmit={handleRegister} className="space-y-4">
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Seu nome"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm placeholder:text-slate-500 focus:ring-2 focus:ring-mystic-gold focus:border-transparent transition-all outline-none"
                                    />
                                </div>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="seu@email.com"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm placeholder:text-slate-500 focus:ring-2 focus:ring-mystic-gold focus:border-transparent transition-all outline-none"
                                    />
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        minLength={6}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Senha (mín. 6 caracteres)"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-12 text-sm placeholder:text-slate-500 focus:ring-2 focus:ring-mystic-gold focus:border-transparent transition-all outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {error && <p className="text-red-400 text-xs">{error}</p>}
                                {message && <p className="text-emerald-400 text-xs">{message}</p>}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full btn-gold py-3 rounded-xl flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={18} /> : <>Criar Conta</>}
                                </button>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="login"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Email"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm placeholder:text-slate-500 focus:ring-2 focus:ring-mystic-gold focus:border-transparent transition-all outline-none"
                                    />
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Senha"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-12 text-sm placeholder:text-slate-500 focus:ring-2 focus:ring-mystic-gold focus:border-transparent transition-all outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setMode('forgot')}
                                    className="text-xs text-slate-500 hover:text-mystic-gold transition-colors"
                                >
                                    Esqueceu a senha?
                                </button>
                                {error && <p className="text-red-400 text-xs">{error}</p>}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full btn-gold py-3 rounded-xl flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={18} /> : <>Entrar</>}
                                </button>
                            </form>

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-white/10"></div>
                                </div>
                                <div className="relative flex justify-center text-xs">
                                    <span className="bg-transparent px-3 text-slate-500">ou</span>
                                </div>
                            </div>

                            <button
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                className="w-full bg-white text-slate-800 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors"
                            >
                                <svg viewBox="0 0 24 24" className="w-5 h-5">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Continuar com Google
                            </button>

                            <p className="text-center text-sm text-slate-400 mt-6">
                                Não tem conta?{' '}
                                <button
                                    onClick={() => setMode('register')}
                                    className="text-mystic-gold hover:underline font-bold"
                                >
                                    Criar conta
                                </button>
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};
