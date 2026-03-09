import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Moon, Sun, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';

export const AuthScreen = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                        }
                    }
                });

                if (error) throw error;
                setSuccess('Confira seu email para confirmar o cadastro!');
            }
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro cósmico.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-mystic-bg flex flex-col items-center justify-center p-4 relative overflow-hidden text-slate-200 font-sans">
            {/* Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-mystic-primary rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-mystic-gold rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-pulse delay-1000"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10"
            >
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-mystic-primary to-mystic-gold flex items-center justify-center mb-4 shadow-lg shadow-mystic-primary/30">
                        {isLogin ? <Moon size={32} className="text-white" /> : <Sun size={32} className="text-white" />}
                    </div>
                    <h1 className="text-3xl font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-mystic-gold to-white">
                        {isLogin ? 'Retornar ao Cosmos' : 'Inicie sua Jornada'}
                    </h1>
                    <p className="text-slate-400 text-sm mt-2 text-center">
                        {isLogin ? 'Conecte-se com sua essência e os astros.' : 'Crie sua conta e descubra seu caminho místico.'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <AnimatePresence mode="wait">
                        {!isLogin && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        required={!isLogin}
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Seu nome"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm placeholder:text-slate-500 focus:ring-2 focus:ring-mystic-gold focus:border-transparent transition-all outline-none"
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Seu email"
                            className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm placeholder:text-slate-500 focus:ring-2 focus:ring-mystic-gold focus:border-transparent transition-all outline-none"
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Sua senha secreta"
                            className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm placeholder:text-slate-500 focus:ring-2 focus:ring-mystic-gold focus:border-transparent transition-all outline-none"
                        />
                    </div>

                    {error && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs text-center font-medium bg-red-400/10 p-2 rounded-lg border border-red-400/20">
                            {error}
                        </motion.p>
                    )}

                    {success && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-emerald-400 text-xs text-center font-medium bg-emerald-400/10 p-2 rounded-lg border border-emerald-400/20">
                            {success}
                        </motion.p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-mystic-primary to-purple-600 hover:from-mystic-primary/90 hover:to-purple-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-6 shadow-lg shadow-mystic-primary/25 disabled:opacity-70 disabled:cursor-not-allowed group"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <>
                                {isLogin ? 'Entrar' : 'Manifestar Conta'}
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm">
                    <p className="text-slate-400">
                        {isLogin ? 'Novo explorador das estrelas?' : 'Já possui as chaves do santuário?'}
                    </p>
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="mt-2 text-mystic-gold font-bold hover:text-white flex items-center justify-center gap-1 mx-auto transition-colors"
                    >
                        <Sparkles size={16} />
                        {isLogin ? 'Criar minha conta' : 'Acessar minha conta'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
