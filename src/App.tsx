import React, { useState, useEffect, useRef, useMemo } from 'react';
// @ts-ignore
import ReactPlayer from 'react-player';
import {
  Home,
  Map as MapIcon,
  MessageSquare,
  Library,
  User,
  Bell,
  Star,
  Sun,
  Moon,
  Heart,
  Zap,
  Search,
  Menu,
  ArrowLeft,
  Settings,
  ChevronRight,
  LogOut,
  BookOpen,
  Sparkles,
  Wand2,
  Mic,
  Send,
  MoreHorizontal,
  ThumbsUp,
  MessageCircle,
  Share2,
  Bookmark,
  Flame,
  Camera,
  Compass,
  Lock as LockIcon,
  Play,
  Pause,
  Repeat,
  Volume2,
  RefreshCw,
  Music,
  Quote
} from 'lucide-react';

import { supabase } from './lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { chatWithIA } from './services/gemini';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthScreen } from './components/AuthScreen';
import { generatePdfCover } from './lib/pdfHelper';
import * as pdfjsLib from 'pdfjs-dist';
import { calculateDestinyNumber, getDestinyMeaning } from './lib/numerology';
import { calculateZodiacSign } from './lib/zodiac';
import { getMoonPhase } from './lib/moon';
import { fetchLatestWeeklyArticle, generatePersonalInfluence, WeeklyArticle, generateDailyForecast } from './services/articles';
import { SubscriptionPlans } from './components/SubscriptionPlan';
import { getSubscription } from './lib/stripe';
import { CabalisticTree } from './components/CabalisticTree';
import { generateFullCabalisticMap, calculateCabalisticNumbers } from './lib/cabalisticMap';
import { toPng } from 'html-to-image';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// --- Types ---
type View = 'home' | 'map' | 'chat' | 'library' | 'music' | 'profile';

const MUSIC_PLAYLIST = [
  {
    title: "Spleen & Lymphatic Support • Sacred Geometry, Sigil & Gentle Lo-Fi",
    id: "s0CgIWigGiI",
    thumb: "https://i.ytimg.com/vi/s0CgIWigGiI/hqdefault.jpg",
    duration: "1:00:00"
  },
  {
    title: "Clear the Fog • Joyful Daytime Focus & Study Lo-Fi",
    id: "mKgrUTayLXk",
    thumb: "https://i.ytimg.com/vi/mKgrUTayLXk/hqdefault.jpg",
    duration: "1:20:00"
  },
  {
    title: "Aura Cleanse • Deep Rest & Sleep Lo-Fi for Peaceful Nights",
    id: "Er6AYI4FfZs",
    thumb: "https://i.ytimg.com/vi/Er6AYI4FfZs/hqdefault.jpg",
    duration: "1:20:00"
  },
  {
    title: "Gentle Vitality • Happy Lo-Fi for Focus, Cleaning & Calm Productivity",
    id: "wB90Tmqng84",
    thumb: "https://i.ytimg.com/vi/wB90Tmqng84/hqdefault.jpg",
    duration: "1:20:00"
  },
  {
    title: "Dusk at the Sanctuary – Lo-fi ",
    id: "N3J5roHoi-o",
    thumb: "https://i.ytimg.com/vi/N3J5roHoi-o/hqdefault.jpg",
    duration: "1:00:05"
  },
  {
    title: "Lo-Fi Nettle Radiance",
    id: "c-mkeAgzFg4",
    thumb: "https://i.ytimg.com/vi/c-mkeAgzFg4/hqdefault.jpg",
    duration: "59:51"
  },
  {
    title: "Where the night listens lofi",
    id: "q2y0nuTTa1E",
    thumb: "https://i.ytimg.com/vi/q2y0nuTTa1E/hqdefault.jpg",
    duration: "1:00:00"
  },
  {
    title: "Sleep ✦ Study✦ Relax",
    id: "zrc-lJCoDqo",
    thumb: "https://i.ytimg.com/vi/zrc-lJCoDqo/hqdefault.jpg",
    duration: "1:00:00"
  },
  {
    title: "432 Hz Music for Anxiety & Stress Relief | Relaxing Instrumental (1 Hour)",
    id: "vEpqk4U3IzY",
    thumb: "https://i.ytimg.com/vi/vEpqk4U3IzY/hqdefault.jpg",
    duration: "1:00:00"
  },
  {
    title: "1 Hour Cortisol Relief | Nervous System Reset (432 Hz) | Reduce Stress & Anxiety",
    id: "J_0JN35Kqcw",
    thumb: "https://i.ytimg.com/vi/J_0JN35Kqcw/hqdefault.jpg",
    duration: "1:00:00"
  },
  {
    title: "Study With Echo 🦉🌙 1 Hour Night Focus Lo-Fi | Calm Retention & Quiet Clarity",
    id: "h7EudRJTkVI",
    thumb: "https://i.ytimg.com/vi/h7EudRJTkVI/hqdefault.jpg",
    duration: "1:00:00"
  },
  {
    title: "Study With Atlas 🐾📚 1 Hour Lo-Fi | Calm Focus",
    id: "RpHG5kEHI_8",
    thumb: "https://i.ytimg.com/vi/RpHG5kEHI_8/hqdefault.jpg",
    duration: "1:00:00"
  },
  {
    title: "Cramp Bark | Deep Cramp Release + Muscle Reset (1 Hour Grounded Relief)",
    id: "qrVDzsbKwgE",
    thumb: "https://i.ytimg.com/vi/qrVDzsbKwgE/hqdefault.jpg",
    duration: "1:00:00"
  },
  {
    title: "Deep Sleep in Darkness 🌙 1 Hour Night Sky Ambient Soundscape for Rest & Pain Relief",
    id: "fTgCMcKwV68",
    thumb: "https://i.ytimg.com/vi/fTgCMcKwV68/hqdefault.jpg",
    duration: "1:00:00"
  },
  {
    title: "Gentle Eye Ease & Lymphatic Calm | 30-Minute Ambient Rest",
    id: "2WVDeh-Spyg",
    thumb: "https://i.ytimg.com/vi/2WVDeh-Spyg/hqdefault.jpg",
    duration: "30:00"
  },
  {
    title: "Nighttime Circulatory Recovery | Gentle Flow for Legs, Ankles & Feet | 30 Minutes",
    id: "n54eyKzbZ5I",
    thumb: "https://i.ytimg.com/vi/n54eyKzbZ5I/hqdefault.jpg",
    duration: "30:00"
  },
  {
    title: "Morning Alignment 🌞 Lo-Fi R&B for Calm Confidence (30 Min)",
    id: "u0fH8X6_BKc",
    thumb: "https://i.ytimg.com/vi/u0fH8X6_BKc/hqdefault.jpg",
    duration: "30:00"
  },
  {
    title: "Cozy Confidence Vibes ✨ | 1 Hour Lo-Fi R&B / Chillhop for Focus & Flow",
    id: "NuDFC2ZPx3w",
    thumb: "https://i.ytimg.com/vi/NuDFC2ZPx3w/hqdefault.jpg",
    duration: "1:00:00"
  },
  {
    title: "Gentle Face Depuffing & Lymphatic Ease | 1 Hour Ambient Support for Relaxation",
    id: "YAHY4OAcN0A",
    thumb: "https://i.ytimg.com/vi/YAHY4OAcN0A/hqdefault.jpg",
    duration: "1:00:00"
  },
  {
    title: "30 Minutes of Grounding | Calm Nervous System & Gentle Presence",
    id: "xLnaHxjxQHU",
    thumb: "https://i.ytimg.com/vi/xLnaHxjxQHU/hqdefault.jpg",
    duration: "30:00"
  },
  {
    title: "Deep Sleep in 60 Minutes | Black Tourmaline + Occiput Release (174Hz)",
    id: "sl7wNhNQDU8",
    thumb: "https://i.ytimg.com/vi/sl7wNhNQDU8/hqdefault.jpg",
    duration: "1:00:00"
  }
];



const CHAT_CATEGORIES = [
  {
    id: 'missao',
    icon: '🔮',
    title: 'Missão de Vida',
    questions: [
      'Qual é minha missão de vida?',
      'Por que nasci com esse número de destino?',
      'Quais são meus maiores talentos espirituais?',
      'Que tipo de propósito minha alma busca?',
      'Como posso evoluir espiritualmente?',
      'Qual caminho profissional combina comigo?',
      'O que meu número de destino revela sobre mim?',
      'Qual lição espiritual preciso aprender nesta vida?',
      'Como posso usar meus talentos para ajudar outras pessoas?',
      'O que devo focar para crescer espiritualmente?'
    ]
  },
  {
    id: 'amor',
    icon: '❤️',
    title: 'Amor',
    questions: [
      'Como será minha vida amorosa?',
      'Estou atraindo o tipo certo de relacionamento?',
      'Como posso melhorar minha energia no amor?',
      'O que meu número revela sobre meus relacionamentos?',
      'Por que meus relacionamentos enfrentam desafios?',
      'Como posso atrair um amor verdadeiro?',
      'Qual tipo de pessoa combina mais comigo?',
      'O que devo aprender no amor neste momento?',
      'Minha energia está aberta para um relacionamento?',
      'Como posso fortalecer meu relacionamento atual?'
    ]
  },
  {
    id: 'dinheiro',
    icon: '💰',
    title: 'Dinheiro',
    questions: [
      'Como posso melhorar minha vida financeira?',
      'Meu número tem relação com prosperidade?',
      'Qual é meu potencial para riqueza?',
      'Que energia financeira está ativa na minha vida?',
      'Como posso desbloquear prosperidade?',
      'Estou no caminho certo para sucesso profissional?',
      'O que devo focar para crescer financeiramente?',
      'Minha energia favorece novos negócios?',
      'Que atitude pode melhorar minha prosperidade?',
      'Como alinhar espiritualidade e dinheiro?'
    ]
  },
  {
    id: 'espiritualidade',
    icon: '🧘',
    title: 'Espiritualidade',
    questions: [
      'Qual energia espiritual está presente na minha vida hoje?',
      'O que o universo quer me ensinar neste momento?',
      'Que tipo de energia espiritual me acompanha?',
      'Como posso fortalecer minha conexão espiritual?',
      'O que devo refletir neste momento da minha vida?',
      'Qual mensagem espiritual preciso ouvir hoje?',
      'Como posso equilibrar minha mente e minha energia?',
      'Que lição espiritual estou vivendo agora?',
      'O que minha alma precisa neste momento?',
      'Que conselho espiritual posso seguir hoje?'
    ]
  },
  {
    id: 'energia',
    icon: '🌙',
    title: 'Energia do Dia',
    questions: [
      'Qual é a energia espiritual do meu dia hoje?',
      'O que devo focar hoje para ter um bom dia?',
      'Que tipo de energia está influenciando minha vida hoje?',
      'Qual conselho espiritual para hoje?',
      'O que devo evitar hoje?'
    ]
  }
];

// --- Components ---

const Navbar = ({ currentView, setView }: { currentView: View, setView: (v: View) => void }) => {
  const navItems: { id: View, icon: any, label: string }[] = [
    { id: 'home', icon: Home, label: 'Início' },
    { id: 'map', icon: Compass, label: 'Mapas' },
    { id: 'chat', icon: BookOpen, label: 'Oráculo' },
    { id: 'library', icon: Library, label: 'Biblioteca' },
    { id: 'music', icon: Music, label: 'Músicas' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#10141a]/80 backdrop-blur-2xl border-t border-mystic-gold/10 px-4 pb-8 pt-3 flex justify-around items-center">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setView(item.id)}
          className={`flex flex-col items-center gap-1 transition-all duration-500 ${currentView === item.id ? 'text-mystic-gold scale-110 gold-glow' : 'text-slate-500 hover:text-slate-300'
            }`}
        >
          <item.icon size={24} fill={currentView === item.id ? "currentColor" : "none"} />
          <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

// --- Views ---

const HomeView = ({ setView, onOpenNotifications, user, isPlaying, dailyForecast, fetchingForecast }: { setView: (v: View) => void, onOpenNotifications: () => void, user: any, isPlaying: boolean, dailyForecast: string, fetchingForecast: boolean }) => {
  const defaultName = user?.user_metadata?.full_name || 'Buscador Espiritual';
  const defaultDate = user?.user_metadata?.birth_date || '2000-01-01';
  const cabalisticNums = calculateCabalisticNumbers(defaultName, defaultDate);
  const destinyNumber = cabalisticNums.destino;
  const destinyMeaning = user?.user_metadata?.birth_date ? getDestinyMeaning(destinyNumber) : 'Introspecção';
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  return (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="flex flex-col gap-6 p-4 pb-24"
  >
    <header className="flex items-center justify-between">
      <button
        onClick={() => setView('profile')}
        className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
      >
        <div className="relative">
          <div className="size-14 rounded-full border-2 border-mystic-primary p-0.5">
            <img
              src={user?.user_metadata?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=mystic"}
              alt="Profile"
              className="rounded-full size-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-mystic-gold text-mystic-bg size-6 rounded-full flex items-center justify-center border-2 border-mystic-bg">
            <Star size={12} fill="currentColor" />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold font-display line-clamp-1">{user?.user_metadata?.full_name || 'Buscador Solitário'}</h2>
          <div className="flex items-center gap-1.5 text-mystic-gold">
            <Sun size={14} />
            <p className="text-xs font-semibold uppercase tracking-wider">
              {calculateZodiacSign(user?.user_metadata?.birth_date || "")}
            </p>
          </div>
        </div>
      </button>
      <div className="flex items-center gap-2">
        {isPlaying && (
          <button
            onClick={() => setView('music')}
            className="size-11 flex items-center justify-center rounded-xl bg-mystic-gold/10 border border-mystic-gold/30 text-mystic-gold animate-pulse hover:bg-mystic-gold/20 transition-colors"
          >
            <Music size={20} />
          </button>
        )}
        <button
          onClick={onOpenNotifications}
          className="size-11 flex items-center justify-center rounded-xl bg-mystic-primary/20 border border-mystic-primary/30 hover:bg-mystic-primary/30 transition-colors"
        >
          <Bell size={20} />
        </button>
      </div>
    </header>

    <section className="flex flex-col items-center justify-center py-6">
      <div className={`perspective-[1500px] w-[280px] h-[440px] ${!isCardFlipped ? 'cursor-pointer' : ''}`} onClick={() => !fetchingForecast && !isCardFlipped && setIsCardFlipped(true)}>
        <motion.div
          className="relative w-full h-full"
          animate={{ rotateY: isCardFlipped ? 1980 : 0 }}
          transition={{ duration: 3, ease: 'easeInOut' }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Frente da Carta (Design Dark/Gold) */}
          <div className="absolute inset-0 rounded-[1.5rem] border-2 border-mystic-gold bg-[#10141a] shadow-[0_0_25px_rgba(226,189,91,0.25)] overflow-hidden flex flex-col items-center" style={{ backfaceVisibility: 'hidden' }}>
            <div className="absolute inset-2 border border-mystic-gold/40 rounded-xl p-4 flex flex-col items-center justify-between">
              <div className="w-full flex justify-between items-center px-2">
                <span className="text-mystic-gold text-lg font-display font-bold">ר</span>
                <span className="text-mystic-gold text-sm tracking-[0.2em] font-display font-bold">XIX</span>
                <span className="text-mystic-gold text-lg font-display font-bold">ס</span>
              </div>
              
              <div className="relative w-full aspect-square flex items-center justify-center">
                 {/* Representação Estilizada (Árvore/Sol) */}
                 <div className="absolute w-32 h-32 rounded-full border-[1px] border-mystic-gold/40 border-dashed animate-[spin_30s_linear_infinite]"></div>
                 <div className="absolute w-24 h-24 rounded-full border-[0.5px] border-mystic-gold/60"></div>
                 <div className="absolute w-16 h-16 rounded-full bg-mystic-gold/5 flex items-center justify-center backdrop-blur-sm border border-mystic-gold/80 z-10 shadow-[0_0_15px_rgba(226,189,91,0.4)]">
                   <Sun size={32} className="text-mystic-gold" />
                 </div>
                 
                 <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                   <circle cx="50" cy="15" r="4" fill="#e2bd5b" fillOpacity="0.8" />
                   <circle cx="20" cy="40" r="4" fill="#e2bd5b" fillOpacity="0.8" />
                   <circle cx="80" cy="40" r="4" fill="#e2bd5b" fillOpacity="0.8" />
                   <circle cx="50" cy="65" r="4" fill="#e2bd5b" fillOpacity="0.8" />
                   <circle cx="50" cy="85" r="4" fill="#e2bd5b" fillOpacity="0.8" />
                   <line x1="50" y1="19" x2="50" y2="61" stroke="#e2bd5b" strokeWidth="0.5" strokeOpacity="0.5" />
                   <line x1="50" y1="15" x2="20" y2="40" stroke="#e2bd5b" strokeWidth="0.5" strokeOpacity="0.5" />
                   <line x1="50" y1="15" x2="80" y2="40" stroke="#e2bd5b" strokeWidth="0.5" strokeOpacity="0.5" />
                   <line x1="20" y1="40" x2="80" y2="40" stroke="#e2bd5b" strokeWidth="0.5" strokeOpacity="0.5" />
                   <line x1="20" y1="40" x2="50" y2="65" stroke="#e2bd5b" strokeWidth="0.5" strokeOpacity="0.5" />
                   <line x1="80" y1="40" x2="50" y2="65" stroke="#e2bd5b" strokeWidth="0.5" strokeOpacity="0.5" />
                   <line x1="50" y1="69" x2="50" y2="81" stroke="#e2bd5b" strokeWidth="0.5" strokeOpacity="0.5" />
                 </svg>
              </div>

              <div className="mb-2 w-full animate-pulse text-center flex flex-col space-y-2 z-10">
                 <p className="text-mystic-gold text-[11px] font-bold tracking-[0.2em] gold-glow uppercase px-2">
                   Energia do Dia
                 </p>
                 <p className="text-mystic-gold/60 text-[9px] tracking-[0.1em] uppercase">
                   {fetchingForecast ? "Sintonizando Astros..." : "Toque para Revelar"}
                 </p>
              </div>

              <div className="w-full flex justify-center pb-1 border-t border-mystic-gold/30 pt-3">
                <span className="text-mystic-gold text-[9px] tracking-[0.3em] uppercase">The Sun</span>
              </div>
            </div>
          </div>

          {/* Verso da Carta (Conteúdo Revelado) */}
          <div 
            ref={cardRef}
            className="absolute inset-0 rounded-[1.5rem] border-2 border-mystic-gold bg-[#181e26] shadow-[0_0_30px_rgba(226,189,91,0.2)] flex flex-col items-center p-6 overflow-hidden" 
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="absolute inset-0 bg-[url('./assets/oracle_mystic_bg.jpeg')] opacity-10 mix-blend-overlay"></div>
            
            {/* Botão de Compartilhar (Gera Imagem) */}
            <button
              onClick={async (e) => {
                e.stopPropagation();
                if (isGeneratingImage) return;

                const forecastText = dailyForecast || "O sol ilumina seu caminho hoje. Confie na sua intuição e brilhe.";
                const shareText = `✨ 🔮 MINHA ENERGIA DO DIA 🔮 ✨\n\n🌟 Destino: ${destinyNumber}\n\n💫 ${forecastText}\n\n🌙 Compartilhado via Kabbalah Oracle`;

                if (!cardRef.current) return;

                try {
                  setIsGeneratingImage(true);
                  
                  // Gerar imagem do Card
                  const dataUrl = await toPng(cardRef.current, {
                    cacheBust: true,
                    backgroundColor: '#181e26',
                    style: {
                      transform: 'scale(1)',
                      borderRadius: '1.5rem'
                    }
                  });

                  // Converter dataUrl para Blob
                  const blob = await (await fetch(dataUrl)).blob();
                  const file = new File([blob], 'meu-destino-hoje.png', { type: 'image/png' });

                  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                      title: 'Minha Previsão Astral 🔮',
                      text: shareText,
                      files: [file]
                    });
                  } else {
                    // Fallback para download se não houver navigator.share compatible
                    const link = document.createElement('a');
                    link.download = 'meu-destino-hoje.png';
                    link.href = dataUrl;
                    link.click();
                    alert('Imagem gerada! Compartilhe agora com seus amigos. ✨');
                  }
                } catch (err: any) {
                  console.error('Error sharing image:', err);
                  // Fallback para texto se falhar
                  if (navigator.share) {
                    await navigator.share({ title: 'Minha Previsão Astral 🔮', text: shareText });
                  }
                } finally {
                  setIsGeneratingImage(false);
                }
              }}
              className="absolute top-4 right-4 z-20 text-mystic-gold/60 hover:text-mystic-gold transition-all p-2 bg-mystic-gold/5 rounded-full border border-mystic-gold/10 flex items-center justify-center min-w-[36px] min-h-[36px]"
              title="Compartilhar Energia"
              disabled={isGeneratingImage}
            >
              {isGeneratingImage ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <Share2 size={18} />
              )}
            </button>

            <div className="relative z-10 w-full flex flex-col items-center flex-1">
              <h4 className="text-mystic-gold text-[10px] tracking-[0.25em] uppercase font-bold mb-4">Sua Sabedoria</h4>
              
              <div className="w-16 h-16 rounded-full border border-mystic-gold flex items-center justify-center bg-[#10141a] mb-2 shadow-inner relative">
                <div className="absolute -inset-1 border border-mystic-gold/30 rounded-full animate-spin-slow"></div>
                <span className="text-mystic-gold text-3xl font-display font-black gold-glow">{destinyNumber || 7}</span>
              </div>

              <div className="flex-1 w-full flex flex-col items-center justify-center px-2 py-4 relative">
                <div className="absolute top-2 left-4 opacity-20 text-mystic-gold">
                  <Quote size={20} fill="currentColor" />
                </div>
                
                <p className="text-slate-100 text-[14px] leading-relaxed font-medium text-center drop-shadow-md relative z-10 px-4">
                  {fetchingForecast ? (
                    <span className="flex items-center gap-2 animate-pulse justify-center">
                      <Sparkles size={14} className="text-mystic-gold" /> Captando astrais...
                    </span>
                  ) : (
                    (dailyForecast?.slice(0, 200) || (user?.user_metadata?.birth_date
                      ? "O sol ilumina seu caminho hoje. Confie na sua intuição e brilhe."
                      : "Sintonize-se com a luz interior. Novas descobertas aguardam você."))
                  )}
                </p>

                <div className="mt-4 flex flex-col items-center gap-1 opacity-60">
                  <div className="w-8 h-[0.5px] bg-mystic-gold/50"></div>
                  <span className="text-[10px] uppercase tracking-[0.2em] font-black text-mystic-gold italic">
                    - Oráculo
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>

    <section>
      <h2 className="text-xl font-bold font-display mb-4">Seus Números Core</h2>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Destino', val: cabalisticNums.destino, icon: Compass },
          { label: 'Alma', val: cabalisticNums.alma, icon: Heart },
          { label: 'Missão', val: cabalisticNums.caminhoDeVida, icon: Zap },
        ].map((n: any) => (
          <div key={n.label} className="flex flex-col items-center justify-center p-4 rounded-xl bg-mystic-primary/10 border border-mystic-primary/20">
            <n.icon size={20} className="text-mystic-gold mb-2" fill="currentColor" />
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">{n.label}</p>
            <p className="text-2xl font-black text-white">{n.val}</p>
          </div>
        ))}
      </div>
    </section>

    {(() => {
      const moon = getMoonPhase();
      return (
        <section className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 shadow-inner">
          <div className="size-16 flex-shrink-0 bg-mystic-bg rounded-full flex items-center justify-center shadow-inner relative overflow-hidden border border-mystic-primary/20">
            <div className="absolute inset-0 bg-gradient-to-tr from-mystic-primary/40 to-transparent"></div>
            <Moon size={32} className="text-slate-100 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Fase da Lua</p>
            <h4 className="text-xl font-black text-white">{moon.name}</h4>
            <p className="text-xs text-mystic-gold font-medium italic">{moon.desc}</p>
          </div>
        </section>
      );
    })()}
  </motion.div>
  );
};

const MapView = ({ user, onOpenNotifications, setView, isPlaying, onOpenTreeMap, isPremium, onOpenPremium }: { user: any, onOpenNotifications: () => void, setView: (v: any) => void, isPlaying: boolean, onOpenTreeMap: () => void, isPremium: boolean, onOpenPremium: () => void }) => {
  const fullName = user?.user_metadata?.full_name || 'Usuário';
  const birthDate = user?.user_metadata?.birth_date || "";
  const [showIntroPopup, setShowIntroPopup] = useState(false);

  useEffect(() => {
    const hasSeenMapIntro = localStorage.getItem('mystic_map_intro');
    if (!hasSeenMapIntro) {
      setShowIntroPopup(true);
      localStorage.setItem('mystic_map_intro', 'true');
    }
  }, []);

  const handleTreeMapClick = () => {
    if (!isPremium) {
      onOpenPremium();
      return;
    }
    onOpenTreeMap();
  };

  const cabalMap = useMemo(() => {
    if (fullName && birthDate) {
      return generateFullCabalisticMap(fullName, birthDate);
    }
    return null;
  }, [fullName, birthDate]);

  const d = cabalMap?.destino || 9;
  const a = cabalMap?.alma || 4;
  const p = cabalMap?.personalidade || 1;
  const cv = cabalMap?.caminhoDeVida || d;
  const m = cabalMap?.expressao || 5;

  // All positions in SVG viewBox 0 0 100 100 — perfectly symmetric
  const nodes = [
    { id: 'destino',       label: 'DESTINO',         val: d,  cx: 50, cy: 12 },
    { id: 'personalidade', label: 'PERSONALIDADE',   val: p,  cx: 78, cy: 35 },
    { id: 'missao',        label: 'MISSÃO',          val: m,  cx: 78, cy: 65 },
    { id: 'expressao',     label: 'EXPRESSÃO',       val: m,  cx: 50, cy: 88 },
    { id: 'caminho',       label: 'CAMINHO',         val: cv, cx: 22, cy: 65 },
    { id: 'alma',          label: 'ALMA',            val: a,  cx: 22, cy: 35 },
  ];

  const meanings: Record<string, { label: string, icon: any, desc: string }> = {
    destino:       { label: 'NÚMERO DE DESTINO', icon: Compass,  desc: 'Humanitarismo, compaixão e conclusão. Você está aqui para servir ao mundo.' },
    alma:          { label: 'ENERGIA DA ALMA',   icon: Heart,    desc: 'Deseja segurança, ordem e uma vida estruturada.' },
    personalidade: { label: 'PERSONALIDADE',     icon: User,     desc: 'Independência, liderança e originalidade. Como o mundo te vê.' },
    caminho:       { label: 'CAMINHO DE VIDA',   icon: BookOpen, desc: 'O caminho do mestre. Desafios que exigem desapego e amor.' },
    missao:        { label: 'MISSÃO',            icon: Zap,      desc: 'Liberdade, mudança e aventura. Sua tarefa nesta existência.' },
    expressao:     { label: 'EXPRESSÃO',         icon: Sparkles, desc: 'Comunicação, criatividade e otimismo. Seus talentos naturais.' },
  };

  const NODE_R = 7.5;
  const LABEL_OFFSETS: Record<string, { dx: number; dy: number; anchor: 'start' | 'middle' | 'end' }> = {
    destino:       { dx: 0,   dy: -10, anchor: 'middle' },
    expressao:     { dx: 0,   dy:  13, anchor: 'middle' },
    personalidade: { dx:  7,  dy:   0, anchor: 'start'  },
    missao:        { dx:  7,  dy:   0, anchor: 'start'  },
    alma:          { dx: -7,  dy:   0, anchor: 'end'    },
    caminho:       { dx: -7,  dy:   0, anchor: 'end'    },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col gap-8 pb-32 items-center min-h-screen bg-mystic-bg overflow-x-hidden"
    >
      {/* Intro Popup */}
      <AnimatePresence>
        {showIntroPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowIntroPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-gradient-to-br from-indigo-900/90 to-purple-900/90 backdrop-blur-xl border border-mystic-gold/30 rounded-3xl p-8 max-w-sm text-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-20 h-20 rounded-full bg-mystic-gold/20 flex items-center justify-center mx-auto mb-6">
                <Sparkles size={40} className="text-mystic-gold" />
              </div>
              <h2 className="text-2xl font-black text-white mb-4">Bem-vindo ao<br/><span className="text-mystic-gold">Mapa Cabalístico</span></h2>
              <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                Descubra os números que definem sua jornada espiritual: destino, alma, personalidade e muito mais.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setShowIntroPopup(false)}
                  className="w-full py-3 rounded-xl bg-mystic-gold text-black font-bold"
                >
                  Começar Jornada
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="w-full flex items-center justify-between px-4 py-4">
        <div className="size-10 w-10" />
        <h2 className="text-xl font-bold font-display text-mystic-gold tracking-[0.2em] uppercase">Mapa Cabalístico</h2>
        <div className="flex items-center gap-2">
          {isPlaying && (
            <button
              onClick={() => setView('music')}
              className="p-2 rounded-full bg-mystic-gold/10 text-mystic-gold animate-pulse hover:bg-mystic-gold/20 transition-colors"
            >
              <Music size={20} />
            </button>
          )}
          <button onClick={onOpenNotifications} className="p-2 rounded-full bg-mystic-primary/20 text-mystic-gold hover:bg-mystic-primary/30 transition-colors">
            <Bell size={20} />
          </button>
        </div>
      </header>

      {/* Árvore da Vida Button */}
      <div className="w-full px-4 mb-4">
        <button
          onClick={handleTreeMapClick}
          className="w-full p-4 rounded-2xl bg-gradient-to-r from-purple-900/40 via-indigo-900/40 to-purple-900/40 border border-purple-500/30 backdrop-blur-xl hover:from-purple-900/50 hover:via-indigo-900/50 hover:to-purple-900/50 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-400/30 group-hover:border-purple-400/50 transition-colors">
                <Sparkles size={24} className="text-purple-400" />
              </div>
              <div className="text-left">
                <p className="text-xs text-purple-400 font-bold uppercase tracking-widest">Nova Experiência</p>
                <h3 className="text-white font-bold">Árvore da Vida Cabalística</h3>
              </div>
            </div>
            <ChevronRight size={24} className="text-purple-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="mt-3 text-xs text-slate-400 text-left">
            Explore os 10 sefirot e 22 caminhos da tradição cabalística. Uma jornada visual única através dos números que definem sua essência.
          </p>
        </button>
      </div>

      <div className="w-full max-w-[320px] mx-auto px-1">
        <style>{`
          @keyframes crystalRotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes crystalPulse  { 0%,100% { opacity: .12; } 50% { opacity: .22; } }
          @keyframes nodePulse     { 0%,100% { filter: drop-shadow(0 0 4px #D4AF37aa); } 50% { filter: drop-shadow(0 0 12px #f9d423ee); } }
          .crystal-rotate { transform-origin: 50px 50px; animation: crystalRotate 40s linear infinite; }
          .crystal-pulse  { animation: crystalPulse 6s ease-in-out infinite; }
          .node-pulse     { animation: nodePulse 3s ease-in-out infinite; }
        `}</style>

        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="#D4AF37" stopOpacity="0.15" />
              <stop offset="50%"  stopColor="#f9d423" stopOpacity="0.5"  />
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.15" />
            </linearGradient>
            <radialGradient id="nodeGrad" cx="40%" cy="35%" r="60%">
              <stop offset="0%"   stopColor="#181e26" />
              <stop offset="100%" stopColor="#10141a" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="1.2" result="blur" />
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          <g className="crystal-rotate crystal-pulse">
            <polygon points="50,4 61,24 83,24 69,40 76,62 50,50 24,62 31,40 17,24 39,24" fill="none" stroke="#D4AF37" strokeWidth="0.35" strokeOpacity="0.6" />
            <polygon points="50,96 61,76 83,76 69,60 76,38 50,50 24,38 31,60 17,76 39,76" fill="none" stroke="#D4AF37" strokeWidth="0.35" strokeOpacity="0.6" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="#D4AF37" strokeWidth="0.2" strokeOpacity="0.4" />
            <circle cx="50" cy="50" r="35" fill="none" stroke="#f9d423" strokeWidth="0.15" strokeOpacity="0.3" />
            <circle cx="50" cy="50" r="28" fill="none" stroke="#D4AF37" strokeWidth="0.1" strokeOpacity="0.25" />
          </g>

          <path
            d="M 50 12 L 78 35 L 78 65 L 50 88 L 22 65 L 22 35 Z"
            fill="none" stroke="url(#goldGrad)" strokeWidth="0.7"
          />

          <g stroke="url(#goldGrad)" strokeWidth="0.25" strokeOpacity="0.5">
            <line x1="50" y1="12" x2="22" y2="65" />
            <line x1="50" y1="12" x2="78" y2="65" />
            <line x1="50" y1="88" x2="22" y2="35" />
            <line x1="50" y1="88" x2="78" y2="35" />
            <line x1="22" y1="35" x2="78" y2="35" />
            <line x1="22" y1="65" x2="78" y2="65" />
            <line x1="22" y1="35" x2="78" y2="65" />
            <line x1="78" y1="35" x2="22" y2="65" />
            <line x1="50" y1="12" x2="50" y2="88" />
          </g>

          {nodes.map((node) => {
            const off = (LABEL_OFFSETS as any)[node.id];
            return (
              <g 
                key={node.id} 
                className="node-pulse cursor-pointer"
                onClick={() => {
                  document.getElementById(`report-${node.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
              >
                <circle cx={node.cx} cy={node.cy} r={NODE_R + 1.5}
                  fill="none" stroke="#D4AF37" strokeWidth="0.4" strokeOpacity="0.25" />
                <circle cx={node.cx} cy={node.cy} r={NODE_R}
                  fill="url(#nodeGrad)" stroke="#D4AF37" strokeWidth="0.8" />
                <circle cx={node.cx} cy={node.cy} r={NODE_R - 1.8}
                  fill="none" stroke="#D4AF37" strokeWidth="0.3" strokeOpacity="0.4" />
                <text x={node.cx} y={node.cy} textAnchor="middle" dominantBaseline="central"
                  fontSize="6" fontWeight="900" fill="white" fontFamily="serif"
                  filter="url(#glow)">
                  {node.val}
                </text>
                <text
                  x={node.cx + off.dx} y={node.cy + off.dy}
                  textAnchor={off.anchor} dominantBaseline="middle"
                  fontSize="2.4" fontWeight="800" fill="#D4AF37"
                  letterSpacing="0.4" fontFamily="sans-serif">
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <section className="w-full flex flex-col gap-6 px-4">
        <div className="text-center space-y-2 mb-2">
          <h2 className="text-3xl font-bold font-display text-white tracking-widest leading-tight">
            RELATÓRIO<br /><span className="text-mystic-gold gold-glow">CABALÍSTICO</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">Uma análise profunda da sua jornada espiritual</p>
        </div>

        <div className="space-y-4">
          {Object.entries(meanings).map(([key, data]) => {
            const value = nodes.find(n => n.id === key)?.val;
            return (
              <div key={key} id={`report-${key}`} className="bg-mystic-card rounded-3xl p-5 border border-mystic-primary/10 flex items-center gap-5 shadow-xl transition-all active:scale-[0.98] hover:border-mystic-gold/30 scroll-mt-20">
                <div className="size-14 rounded-2xl bg-mystic-primary/20 flex items-center justify-center text-mystic-gold shrink-0 border border-mystic-gold/20">
                  {data.icon ? <data.icon size={24} /> : <Sparkles size={24} />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-[10px] font-black text-mystic-gold uppercase tracking-widest">{data.label}</h4>
                    <span className="text-2xl font-black text-white">{value}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">{data.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="w-full px-4 mt-4">
        <div className="p-8 rounded-[3rem] bg-gradient-to-b from-mystic-primary/10 to-transparent border border-mystic-primary/20 relative overflow-hidden">
          <div className="absolute top-0 left-0 p-6 opacity-5"><Sparkles size={120} /></div>
          <div className="text-center space-y-6 relative z-10">
            <h3 className="text-2xl font-bold font-display text-mystic-gold uppercase tracking-[0.2em]">Interpretação Geral</h3>
            <p className="text-lg text-slate-100 italic leading-relaxed font-medium">
              "Seu mapa revela uma combinação única de energias. O número {d} como seu destino indica que sua vida é regida por humanitarismo e compaixão. Com a alma {a}, seu desejo mais profundo é {meanings.alma.desc.toLowerCase().replace('.', '')}. Ao alinhar sua personalidade ({p}) com sua missão ({m}), você encontrará o verdadeiro equilíbrio do seu ser."
            </p>
            <div className="flex justify-center gap-1.5 opacity-50">
              <div className="size-1 rounded-full bg-mystic-gold"></div>
              <div className="size-1 rounded-full bg-mystic-gold"></div>
              <div className="size-1 rounded-full bg-mystic-gold"></div>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
};

const ChatView = ({ onOpenNotifications, setView, isPlaying, isPremium, onOpenPremium }: { onOpenNotifications: () => void, setView: (v: any) => void, isPlaying: boolean, isPremium: boolean, onOpenPremium: () => void }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
    { role: 'model', text: 'Saudações, viajante do tempo e espaço. As constelações se alinham para nossa conversa. Como posso iluminar seu caminho espiritual hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text?: string) => {
    if (!isPremium) {
      onOpenPremium();
      return;
    }

    const messageToSend = text || input;
    if (!messageToSend.trim() || loading) return;

    if (!text) setInput('');
    setActiveCategory(null);
    setMessages(prev => [...prev, { role: 'user', text: messageToSend }]);
    setLoading(true);

    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const response = await chatWithIA(messageToSend, history);
    setMessages(prev => [...prev, { role: 'model', text: response }]);
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-screen pb-24 relative overflow-hidden"
    >
      {/* Background Image Container */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img 
          src="/src/assets/oracle_mystic_bg.jpeg" 
          className="w-full h-full object-cover opacity-20 transform scale-105" 
          alt="Chat Background" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-mystic-bg/80 via-transparent to-mystic-bg/95"></div>
        <div className="absolute inset-0 backdrop-blur-[1px]"></div>
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <header className="p-4 border-b border-mystic-primary/20 flex items-center justify-between backdrop-blur-md bg-mystic-bg/40">
          <div className="size-8"></div> {/* Spacer for symmetry */}
          <div className="flex flex-col items-center">
            <h1 className="text-lg font-bold font-display text-white">Oráculo Estelar</h1>
            <p className="text-[10px] text-mystic-gold uppercase tracking-widest font-black">Conectado ao Cosmos</p>
          </div>
          <div className="flex items-center gap-2">
            {isPlaying && (
              <button
                onClick={() => setView('music')}
                className="p-2 rounded-full bg-mystic-gold/10 text-mystic-gold animate-pulse hover:bg-mystic-gold/20 transition-colors"
              >
                <Music size={20} />
              </button>
            )}
            <button
              onClick={onOpenNotifications}
              className="p-2 rounded-full bg-mystic-primary/20 text-mystic-gold hover:bg-mystic-primary/30 transition-colors"
            >
              <Bell size={20} />
            </button>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
          {messages.map((m, i) => (
            <div key={i} className={`flex items-start gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`size-10 shrink-0 rounded-full flex items-center justify-center border shadow-lg ${m.role === 'model' ? 'bg-mystic-primary border-mystic-gold/50 text-mystic-gold' : 'bg-mystic-primary/20 border-mystic-primary/40 text-mystic-gold'
                }`}>
                {m.role === 'model' ? <Sparkles size={20} /> : <User size={20} />}
              </div>
              <div className={`flex flex-col gap-1.5 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {m.role === 'model' ? 'Guia Estelar' : 'Buscador'}
                </p>
                <div className={`max-w-[85%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-xl ${m.role === 'model'
                  ? 'bg-mystic-primary/60 text-slate-100 border border-mystic-gold/20 backdrop-blur-md rounded-tl-none'
                  : 'bg-mystic-gold text-mystic-bg font-bold rounded-tr-none'
                  }`}>
                  <Markdown>{m.text}</Markdown>
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-mystic-gold animate-pulse p-2">
              <Sparkles size={16} className="animate-spin" />
              <span className="text-xs italic font-medium">Consultando os astros...</span>
            </div>
          )}
        </div>

        <div className="px-4 pb-2 z-10">
          {!activeCategory ? (
            <div className="flex overflow-x-auto gap-2 no-scrollbar pb-2">
              {CHAT_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className="flex-none flex items-center gap-2 bg-mystic-primary/30 hover:bg-mystic-primary/40 backdrop-blur-md border border-mystic-primary/40 rounded-full px-4 py-2 text-sm text-mystic-gold transition-colors"
                >
                  <span>{cat.icon}</span>
                  <span className="font-bold whitespace-nowrap">{cat.title}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 mb-1">
                <button onClick={() => setActiveCategory(null)} className="text-slate-400 hover:text-white flex items-center gap-1 text-[10px] uppercase font-black px-2">
                  <ArrowLeft size={14} /> Voltar
                </button>
                <span className="text-xs font-bold text-mystic-gold flex items-center gap-1">
                  {CHAT_CATEGORIES.find(c => c.id === activeCategory)?.icon} {CHAT_CATEGORIES.find(c => c.id === activeCategory)?.title}
                </span>
              </div>
              <div className="flex overflow-x-auto gap-2 no-scrollbar pb-2">
                {CHAT_CATEGORIES.find(c => c.id === activeCategory)?.questions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q)}
                    className="flex-none bg-mystic-card/60 backdrop-blur-md hover:bg-mystic-primary/30 border border-mystic-primary/30 rounded-2xl px-4 py-2 text-xs text-slate-100 transition-colors max-w-[280px] text-left shadow-lg font-medium"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <footer className="p-4 bg-mystic-bg/60 backdrop-blur-xl border-t border-mystic-primary/20 z-10">
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center bg-white/10 rounded-xl border border-mystic-primary/20 px-3 py-1 shadow-inner">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="w-full bg-transparent border-none focus:ring-0 text-white placeholder:text-slate-500 text-sm py-2"
                placeholder="Sua mensagem ao cosmos..."
              />
              <Mic size={18} className="text-slate-400" />
            </div>
            <button
              onClick={() => handleSend()}
              disabled={loading}
              className="size-12 rounded-xl btn-gold flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            >
              <Send size={20} />
            </button>
          </div>
        </footer>
      </div>
    </motion.div>
  );
};


const MusicView = ({ 
  onOpenNotifications, 
  currentMusic, 
  isPlaying, 
  onTogglePlay, 
  onSelectMusic,
  playbackProgress,
  playlist,
  loadingPlaylist,
  onRefreshPlaylist,
  onSeek
}: { 
  onOpenNotifications: () => void,
  currentMusic: any,
  isPlaying: boolean,
  onTogglePlay: () => void,
  onSelectMusic: (m: any) => void,
  playbackProgress: number,
  playlist: any[],
  loadingPlaylist: boolean,
  onRefreshPlaylist: () => void,
  onSeek?: (progress: number) => void
}) => {
  const playerRef = useRef<any>(null);

  const handleSeek = (progress: number) => {
    if (playerRef.current && currentMusic) {
      const duration = playerRef.current.getDuration();
      if (duration) {
        playerRef.current.seekTo(progress, 'fraction');
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col gap-6 p-4 pb-32"
    >
      {/* Global player handles audio across all views */}
      <header className="flex items-center justify-between sticky top-0 bg-mystic-bg/80 backdrop-blur-md z-[100] py-4">
        <div className="flex items-center gap-2">
          <Mic size={24} className="text-mystic-gold" />
          <h1 className="text-xl font-black font-display bg-gradient-to-r from-mystic-gold to-purple-400 bg-clip-text text-transparent italic">Música Sagrada</h1>
        </div>
      <div className="flex items-center gap-2">
        {/* Music pulse icon removed here as we are in Music view */}
        <button
          onClick={onRefreshPlaylist}
          className={`p-2 rounded-full bg-mystic-primary/20 text-mystic-gold hover:bg-mystic-primary/30 transition-colors ${loadingPlaylist ? 'animate-spin' : ''}`}
          title="Atualizar Playlist"
        >
          <RefreshCw size={20} />
        </button>
        <button
          onClick={onOpenNotifications}
          className="p-2 rounded-full bg-mystic-primary/20 text-mystic-gold hover:bg-mystic-primary/30 transition-colors"
        >
          <Bell size={20} />
        </button>
      </div>
      </header>

      <section className="bg-mystic-card rounded-3xl p-6 border border-mystic-gold/10 relative overflow-hidden mb-4">
        <div className="absolute -top-10 -right-10 opacity-10">
          <Sparkles size={120} />
        </div>
        <p className="text-mystic-gold text-[10px] font-black uppercase tracking-[0.2em] mb-2">Frequência da Alma</p>
        <h2 className="text-lg font-bold text-white mb-2 leading-tight">Elevando seu Ser</h2>
        <p className="text-slate-400 text-sm italic leading-relaxed">
          Aprimore a concentração, disciplina, ordem e prosperidade através de sonoridades sagradas.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-5">
        {playlist.length === 0 && !loadingPlaylist && (
          <div className="text-center py-10 opacity-50 italic">Nenhum som sagrado encontrado...</div>
        )}
        {playlist.map((music) => {
          const isThisMusicPlaying = currentMusic?.id === music.id;
          
          return (
            <div
              key={music.id}
              onClick={() => onSelectMusic(music)}
              className="group relative cursor-pointer"
            >
              <div className={`flex flex-col bg-mystic-card/40 hover:bg-mystic-primary/20 border ${isThisMusicPlaying ? 'border-mystic-gold/40 bg-mystic-primary/10' : 'border-mystic-primary/10'} rounded-3xl p-4 transition-all duration-500 overflow-hidden`}>
                <div className="flex items-center gap-4">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl border border-mystic-gold/20 shadow-lg">
                    <img src={music.thumb} className={`size-full object-cover transition-transform duration-700 ${isThisMusicPlaying && isPlaying ? 'scale-110 animate-pulse' : 'group-hover:scale-110'}`} alt={music.title} />
                    <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isThisMusicPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      {isThisMusicPlaying && isPlaying ? (
                        <div className="flex gap-1 items-end h-6">
                          <div className="w-1 bg-mystic-gold animate-[music-bar_0.8s_ease-in-out_infinite] h-full"></div>
                          <div className="w-1 bg-mystic-gold animate-[music-bar_1.2s_ease-in-out_infinite] h-2/3"></div>
                          <div className="w-1 bg-mystic-gold animate-[music-bar_0.5s_ease-in-out_infinite] h-4/5"></div>
                        </div>
                      ) : (
                        <Play size={32} className="text-mystic-gold" fill="currentColor" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 pr-2">
                    <h4 className={`font-bold text-sm leading-tight transition-colors ${isThisMusicPlaying ? 'text-mystic-gold' : 'text-slate-100 group-hover:text-mystic-gold'}`}>
                      {music.title}
                    </h4>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-mystic-bg/50 px-2 py-0.5 rounded-full border border-white/5">
                        <Volume2 size={10} className="text-mystic-gold" />
                        {music.duration}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isThisMusicPlaying) {
                        onTogglePlay();
                      } else {
                        onSelectMusic(music);
                      }
                    }}
                    className={`size-12 rounded-full flex items-center justify-center transition-all ${isThisMusicPlaying ? 'bg-mystic-gold text-mystic-bg shadow-lg shadow-mystic-gold/20' : 'bg-mystic-primary/20 text-mystic-gold group-hover:bg-mystic-gold group-hover:text-mystic-bg'}`}
                  >
                    {isThisMusicPlaying && isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                  </button>
                </div>

                <AnimatePresence>
                  {isThisMusicPlaying && (
                    <motion.div
                      initial={{ height: 0, opacity: 0, marginTop: 0 }}
                      animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                      exit={{ height: 0, opacity: 0, marginTop: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-3 pt-2">
                        <div 
                          className="relative h-2 bg-mystic-primary/20 rounded-full overflow-hidden cursor-pointer"
                          onClick={(e) => {
                            if (onSeek) {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const percent = (e.clientX - rect.left) / rect.width;
                              onSeek(percent);
                            }
                          }}
                        >
                          <motion.div 
                            className="absolute top-0 left-0 h-full bg-mystic-gold shadow-[0_0_10px_#D4AF37]"
                            style={{ width: `${playbackProgress * 100}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          <span className="text-mystic-gold">Reproduzindo Agora</span>
                          <div className="flex gap-2">
                            <span className="text-mystic-gold">{Math.round(playbackProgress * 100)}%</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
      
      <style>{`
        @keyframes music-bar {
          0%, 100% { height: 10px; }
          50% { height: 24px; }
        }
      `}</style>
    </motion.div>
  );
};

const ReaderView = ({ book, user, onBack }: { book: any, user: any, onBack: () => void }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [influence, setInfluence] = useState<string | null>(null);
  const [loadingInfluence, setLoadingInfluence] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isArticle = book.isWeeklyArticle || (!book.url && book.content);
  const contentSections = isArticle && book.content 
    ? book.content.split(/(?=^#{1,3}\s)/gm).filter(s => s.trim()) 
    : [];
  const chaptersPerPage = 2;
  const articlePages = Math.max(1, Math.ceil(contentSections.length / chaptersPerPage));
  const startIdx = (currentPage - 1) * chaptersPerPage;
  const currentContent = isArticle ? contentSections.slice(startIdx, startIdx + chaptersPerPage).join('\n\n') : null;

  useEffect(() => {
    if (book.isWeeklyArticle && user?.user_metadata?.birth_date) {
      const getInfluence = async () => {
        setLoadingInfluence(true);
        const destinyNum = calculateDestinyNumber(user.user_metadata.birth_date);
        const destinyMeaning = getDestinyMeaning(destinyNum);
        const msg = await generatePersonalInfluence(book.title, book.content, destinyNum, destinyMeaning);
        setInfluence(msg);
        setLoadingInfluence(false);
      };
      getInfluence();
    }
  }, [book, user]);

  useEffect(() => {
    const loadPdf = async () => {
      if (!book.url) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const loadingTask = pdfjsLib.getDocument(book.url);
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        setCurrentPage(1);
      } catch (error) {
        console.error('Error loading PDF:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPdf();
  }, [book.url]);

  useEffect(() => {
    if (pdfDoc && !isArticle) {
      renderPage(currentPage, pdfDoc);
    }
  }, [currentPage, pdfDoc, isArticle]);

  const renderPage = async (pageNumber: number, pdf: any) => {
    try {
      const page = await pdf.getPage(pageNumber);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      const viewport = page.getViewport({ scale: 1.5 });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
    } catch (error) {
      console.error('Error rendering page:', error);
    }
  };

  const nextPage = () => {
    if (isArticle) {
      if (currentPage < articlePages) {
        setCurrentPage(prev => prev + 1);
      }
    } else if (currentPage < numPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[100] bg-mystic-bg flex flex-col h-[100dvh] overflow-hidden"
    >
      <header className="p-4 border-b border-mystic-primary/20 flex items-center justify-between gap-4 flex-shrink-0 bg-mystic-bg">
        <div className="flex items-center gap-4 truncate">
          <button onClick={onBack} className="text-mystic-gold hover:scale-110 transition-transform flex-shrink-0">
            <ArrowLeft size={24} />
          </button>
          <h2 className="font-bold truncate text-sm">{book.title}</h2>
        </div>
        {(isArticle || !isArticle) && (
          <div className="bg-mystic-primary/20 px-3 py-1 rounded-full border border-mystic-primary/30">
            <span className="text-[10px] font-bold text-mystic-gold tracking-tight whitespace-nowrap">
              {currentPage} / {isArticle ? articlePages : (numPages || '--')}
            </span>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto w-full flex flex-col items-center bg-black/20 relative custom-scrollbar touch-pan-y min-h-0">
        {loading && !isArticle && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-mystic-bg/60 backdrop-blur-sm z-10">
            <div className="text-mystic-gold animate-spin mb-3">
              <Sparkles size={40} />
            </div>
            <p className="text-sm font-bold animate-pulse">Invocando as escrituras...</p>
          </div>
        )}

        {!book.url && !book.content ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
            <div className="p-6 bg-mystic-primary/10 rounded-full text-mystic-gold">
              <BookOpen size={64} />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Páginas Indecifráveis</h3>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                Este manuscrito ainda está sendo traduzido pelos astros. Tente acessar um e-book das estrelas abaixo para começar sua leitura.
              </p>
            </div>
            <button
              onClick={onBack}
              className="px-6 py-2 bg-mystic-gold text-mystic-bg font-bold rounded-xl text-xs uppercase tracking-widest active:scale-95 transition-transform shadow-lg shadow-mystic-gold/20"
            >
              Voltar à Biblioteca
            </button>
          </div>
        ) : (
          <div className="w-full max-w-2xl bg-white/5 shadow-2xl rounded-2xl border border-white/10 ring-1 ring-white/5 my-4 mx-auto flex-shrink-0">
            {isArticle ? (
              <div className="flex flex-col">
                {book.image_url && (
                  <div className="w-full aspect-video overflow-hidden rounded-t-2xl">
                    <img
                      src={book.image_url}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-8 space-y-8 select-text">
                  <div className="prose prose-invert prose-slate max-w-none text-slate-300 leading-relaxed text-base pb-20 px-1 overflow-x-hidden">
                    <Markdown
                      components={{
                        h1: ({ node, ...props }) => <h1 className="text-3xl font-display font-black text-mystic-gold mt-12 mb-6 gold-glow leading-tight border-b border-mystic-gold/20 pb-4" {...props} />,
                        h2: ({ node, ...props }) => <h2 className="text-xl font-display font-bold text-mystic-gold/90 mt-10 mb-4 tracking-wide" {...props} />,
                        h3: ({ node, ...props }) => <h3 className="text-lg font-display font-medium text-slate-200 mt-8 mb-3" {...props} />,
                        p: ({ node, ...props }) => <p className="mb-5 leading-relaxed text-slate-300 font-light" {...props} />,
                        blockquote: ({ node, ...props }) => (
                          <blockquote className="border-l-4 border-mystic-gold bg-mystic-primary/10 p-4 my-6 italic text-mystic-gold/80 rounded-r-xl" {...props} />
                        ),
                        li: ({ node, ...props }) => <li className="mb-2 ml-4 list-disc text-slate-300" {...props} />,
                        img: () => null
                      }}
                    >
                      {String(currentContent || '').replace(/\\n/g, '\n')}
                    </Markdown>
                  </div>
                </div>
              </div>
            ) : (
              <canvas ref={canvasRef} className="w-full h-auto block" />
            )}
          </div>
        )}
      </div>

      {(isArticle || !isArticle) && (
        <footer className="p-4 border-t border-mystic-primary/20 flex justify-between items-center bg-mystic-bg/95 backdrop-blur-md">
          <button
            onClick={prevPage}
            disabled={currentPage === 1}
            className={`flex items-center gap-1 font-black text-[10px] uppercase tracking-widest transition-all px-4 py-2 rounded-xl
              ${currentPage === 1
                ? 'opacity-30 text-slate-500'
                : 'text-mystic-gold hover:bg-mystic-primary/20 active:scale-95'}`}
          >
            <ArrowLeft size={14} className="mb-0.5" /> Anterior
          </button>

          <div className="size-2 flex gap-1">
            <div className="size-1.5 rounded-full bg-mystic-gold/40"></div>
            <div className="size-1.5 rounded-full bg-mystic-gold animate-pulse"></div>
            <div className="size-1.5 rounded-full bg-mystic-gold/40"></div>
          </div>

          <button
            onClick={nextPage}
            disabled={currentPage === (isArticle ? articlePages : numPages)}
            className={`flex items-center gap-1 font-black text-[10px] uppercase tracking-widest transition-all px-4 py-2 rounded-xl
              ${currentPage === (isArticle ? articlePages : numPages)
                ? 'opacity-30 text-slate-500'
                : 'text-mystic-gold hover:bg-mystic-primary/20 active:scale-95'}`}
          >
            Próximo <ArrowLeft size={14} className="mb-0.5 rotate-180" />
          </button>
        </footer>
      )}
    </motion.div>
  );
};

const LibraryView = ({
  onSelectBook,
  fetchedBooks,
  weeklyArticle,
  loadingBooks,
  onOpenNotifications,
  isPlaying,
  setView,
  isPremium,
  onOpenPremium
}: {
  onSelectBook: (book: any) => void,
  fetchedBooks: any[],
  weeklyArticle: WeeklyArticle | null,
  loadingBooks: boolean,
  onOpenNotifications: () => void,
  isPlaying: boolean,
  setView: (v: any) => void,
  isPremium: boolean,
  onOpenPremium: () => void
}) => {
  const [search, setSearch] = useState('');

  const [showAll, setShowAll] = useState(false);

  const getBookImage = (book: any) => {
    if (book.image_url) return book.image_url;
    if (book.image) return book.image;
    
    const defaultImages: Record<string, string> = {
      'amor': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80',
      'prosperidade': 'https://images.unsplash.com/photo-1530973428-5bf2db2e4d71?w=400&q=80',
      'numerologia': 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&q=80',
      'espiritualidade': 'https://images.unsplash.com/photo-1505506874110-6a7a69069a08?w=400&q=80',
      'default': 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&q=80'
    };
    
    const category = book.category?.toLowerCase() || '';
    return defaultImages[category] || defaultImages['default'];
  };

  const handleBookClick = (book: any) => {
    if (!isPremium) {
      onOpenPremium();
      return;
    }
    onSelectBook(book);
  };

  const filteredBooks = fetchedBooks.filter(b => b.title.toLowerCase().includes(search.toLowerCase()));

  // Dynamic shelves based on real data
  const shelfBooks = fetchedBooks.slice(0, 2).map((b, i) => ({ ...b, progress: i === 0 ? 75 : 12 }));
  const latestReleases = fetchedBooks.slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col gap-6 p-4 pb-24"
    >
      <header className="sticky top-0 bg-mystic-bg/80 backdrop-blur-md z-10 py-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-mystic-gold">
            <Sparkles size={24} />
            <h1 className="text-xl font-black font-display tracking-tight">Biblioteca do Kabbalah Oracle</h1>
          </div>
          <div className="flex items-center gap-2">
            {isPlaying && (
              <button
                onClick={() => setView('music')}
                className="p-2 rounded-full bg-mystic-gold/10 text-mystic-gold animate-pulse hover:bg-mystic-gold/20 transition-colors"
              >
                <Music size={20} />
              </button>
            )}
            <button
              onClick={onOpenNotifications}
              className="p-2 rounded-full bg-mystic-primary/20 text-mystic-gold hover:bg-mystic-primary/30 transition-colors"
            >
              <Bell size={20} />
            </button>
          </div>
        </div>
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-mystic-card border-none rounded-xl py-3 pl-11 pr-4 text-sm placeholder:text-slate-500 focus:ring-2 focus:ring-mystic-primary"
            placeholder="Pesquisar oráculos, números e guias..."
          />
        </div>
      </header>

      <section>
        <div className="relative h-56 w-full rounded-2xl overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-t from-mystic-bg via-mystic-bg/40 to-transparent z-10"></div>
          <img
            src={weeklyArticle?.image_url || "https://picsum.photos/seed/cosmos/800/400"}
            className="absolute inset-0 w-full h-full object-cover"
            alt="Banner"
          />
          <div className="absolute bottom-0 left-0 p-6 z-20">
            <span className="text-mystic-gold text-[10px] font-black uppercase tracking-widest mb-2 block">Artigo da Semana</span>
            <h2 className="text-2xl font-bold text-white mb-2 leading-tight font-display">{weeklyArticle?.title || "O Despertar da Consciência Cósmica"}</h2>
            <button
              onClick={() => onSelectBook(weeklyArticle ? { ...weeklyArticle, isWeeklyArticle: true } : { title: 'O Despertar da Consciência Cósmica' })}
              className="bg-mystic-primary text-white border border-white/10 px-6 py-2 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-mystic-primary/80 transition-all active:scale-95 shadow-lg"
            >
              <BookOpen size={14} /> Ler Agora
            </button>
          </div>
        </div>
      </section>

      {showAll ? (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold font-display text-mystic-gold">Todo o Acervo</h3>
            <button
              onClick={() => setShowAll(false)}
              className="text-xs font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <ArrowLeft size={14} /> Voltar
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {filteredBooks.map((book) => (
              <div key={book.id} onClick={() => handleBookClick(book)} className="cursor-pointer group">
                <div className="aspect-[3/4] rounded-2xl bg-white/5 overflow-hidden mb-3 relative border border-white/10 shadow-2xl">
                    <img src={getBookImage(book)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={book.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent opacity-60"></div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <span className="text-[7px] text-mystic-gold font-black uppercase tracking-widest bg-mystic-primary/60 backdrop-blur-md px-1.5 py-0.5 rounded-full border border-mystic-gold/20 mb-1 inline-block">
                      {book.category}
                    </span>
                  </div>
                    {!isPremium && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col items-center justify-end pb-4 rounded-2xl">
                        <div className="bg-mystic-gold/20 border border-mystic-gold/40 rounded-full p-2 mb-1">
                          <LockIcon size={20} className="text-mystic-gold" />
                        </div>
                        <span className="text-[9px] text-mystic-gold font-black uppercase tracking-wider">Premium</span>
                      </div>
                    )}
                </div>
                <p className="text-xs font-bold text-slate-100 line-clamp-2 font-display px-1">{book.title}</p>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <>
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold font-display">Ebooks em Destaque {loadingBooks && <Sparkles size={16} className="inline animate-spin text-mystic-gold ml-2" />}</h3>
              <span onClick={() => setShowAll(true)} className="text-mystic-gold text-xs font-bold cursor-pointer hover:underline">Ver tudo</span>
            </div>
            <div className="flex overflow-x-auto gap-4 no-scrollbar pb-4">
              {filteredBooks.slice(0, 5).map((book) => (
                <div key={book.id} onClick={() => handleBookClick(book)} className="flex-none w-40 cursor-pointer">
                  <div className="h-56 rounded-2xl bg-white/5 overflow-hidden mb-3 relative group border border-white/10 shadow-2xl">
                  <img src={getBookImage(book)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={book.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent opacity-60"></div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <span className="text-[7px] text-mystic-gold font-black uppercase tracking-widest bg-mystic-gold/20 px-1.5 py-0.5 rounded-full border border-mystic-gold/20 mb-1 inline-block">
                        {book.category}
                      </span>
                    </div>
                    {!isPremium && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col items-center justify-end pb-3 rounded-2xl">
                        <div className="bg-mystic-gold/20 border border-mystic-gold/40 rounded-full p-1.5 mb-1">
                          <LockIcon size={16} className="text-mystic-gold" />
                        </div>
                        <span className="text-[8px] text-mystic-gold font-black uppercase tracking-wider">Premium</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-bold text-slate-100 truncate font-display px-1">{book.title}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-tighter px-1 mt-0.5">{book.category}</p>
                </div>
              ))}
              {filteredBooks.length === 0 && <p className="text-xs text-slate-500 italic">Nenhum livro encontrado...</p>}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold font-display">Sua Estante</h3>
              <span onClick={() => setShowAll(true)} className="text-mystic-gold text-xs font-bold cursor-pointer hover:underline">Ver tudo</span>
            </div>
            <div className="flex overflow-x-auto gap-4 no-scrollbar">
              {shelfBooks.map((book) => (
                <div key={book.id} onClick={() => handleBookClick(book)} className="flex-none w-64 cursor-pointer">
                  <div className="bg-mystic-card p-4 rounded-2xl flex gap-4 border border-slate-800 shadow-xl overflow-hidden">
                    <div className="w-20 h-28 flex-none rounded-lg overflow-hidden border border-slate-700 relative">
                      <img src={getBookImage(book)} className="w-full h-full object-cover" alt={book.title} />
                      {!isPremium && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center rounded-lg">
                          <LockIcon size={14} className="text-mystic-gold" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col justify-between py-1 flex-1 min-w-0">
                      <div className="min-w-0">
                        <h4 className="font-bold text-white text-xs truncate leading-tight">{book.title}</h4>
                        <p className="text-[8px] text-slate-500 mt-1 uppercase font-bold tracking-widest italic">Continuar lendo...</p>
                      </div>
                      <div className="w-full">
                        <div className="flex justify-between text-[8px] text-slate-400 mb-1">
                          <span>Progresso</span>
                          <span>{book.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-mystic-gold shadow-[0_0_8px_rgba(212,175,55,0.4)] transition-all duration-1000"
                            style={{ width: `${book.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold font-display">Lançamentos</h3>
            </div>
            <div className="flex overflow-x-auto gap-6 no-scrollbar">
              {latestReleases.map((rel) => (
                <div key={rel.id} onClick={() => handleBookClick(rel)} className="flex-none w-24 flex flex-col items-center cursor-pointer group">
                  <div className="size-24 rounded-full border-2 border-mystic-primary/40 p-1 ring-4 ring-mystic-primary/5 overflow-hidden mb-2 group-hover:border-mystic-gold/40 transition-all duration-500 relative">
                    <img src={getBookImage(rel)} className="size-full rounded-full object-cover group-hover:scale-125 transition-transform duration-700" alt={rel.title} />
                    {!isPremium && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center rounded-full">
                        <LockIcon size={12} className="text-mystic-gold" />
                      </div>
                    )}
                  </div>
                  <p className="text-center text-[8px] font-black text-mystic-gold uppercase tracking-tighter line-clamp-2 px-1">{rel.title}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <section>
        <h3 className="text-lg font-bold font-display mb-4">Categorias de Estudo</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Livros Sagrados', icon: BookOpen },
            { label: 'Minhas Notas', icon: Bookmark },
          ].map((cat) => (
            <div key={cat.label} className="bg-mystic-card rounded-2xl p-6 border border-slate-800 flex flex-col items-center text-center shadow-lg">
              <cat.icon size={32} className="text-mystic-gold mb-2" />
              <h4 className="text-xs font-bold">{cat.label}</h4>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
};

const ProfileView = ({ onBack, setView, guestUser, isPlaying }: { onBack: () => void, setView: (v: any) => void, guestUser: { full_name?: string, birth_date?: string, email?: string } | null, isPlaying: boolean }) => {
  const { signOut, user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [subView, setSubView] = useState<'main' | 'personal' | 'notifications' | 'privacy' | 'help' | 'subscription'>('main');
  const [subscription, setSubscription] = useState<any>(null);

  // Merge auth user metadata with guest data, always preferring auth user
  const effectiveName = user?.user_metadata?.full_name || guestUser?.full_name || '';
  const effectiveBirthDate = user?.user_metadata?.birth_date || guestUser?.birth_date || '';
  const effectiveEmail = user?.email || guestUser?.email || '';

  useEffect(() => {
    async function loadSubscription() {
      const sub = await getSubscription();
      setSubscription(sub);
    }
    loadSubscription();
  }, [user]);
  const [name, setName] = useState(effectiveName);
  const [email, setEmail] = useState(effectiveEmail);
  const [saving, setSaving] = useState(false);

  const handleUpdateProfile = async (data: any) => {
    setSaving(true);
    try {
      if (!user) {
        const savedProfile = JSON.parse(localStorage.getItem('mystic_profile') || '{}');
        const newProfile = { ...savedProfile, ...data };
        localStorage.setItem('mystic_profile', JSON.stringify(newProfile));
        if (data.full_name || data.birth_date) setView('home'); 
      } else {
        if (data.email && data.email !== user.email) {
          const { error: emailError } = await supabase.auth.updateUser({ email: data.email });
          if (emailError) throw emailError;
          alert('Link de confirmação enviado para o novo e-mail!');
        }
        
        const metadata = { ...data };
        delete metadata.email;
        if (Object.keys(metadata).length > 0) {
          const { error } = await supabase.auth.updateUser({ data: metadata });
          if (error) throw error;
        }
        if (data.full_name || data.birth_date) alert('Perfil atualizado com sucesso!');
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) throw new Error('Selecione uma imagem.');
      const file = event.target.files[0];
      const filePath = `${user?.id}-${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      window.location.reload();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  if (subView === 'personal') {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-6 p-4 pb-24">
        <header className="flex items-center gap-4 py-2">
          <button onClick={() => setSubView('main')} className="text-mystic-gold"><ArrowLeft size={24} /></button>
          <h2 className="text-lg font-bold font-display">Informações Pessoais</h2>
        </header>
        <div className="space-y-4 pt-4">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest ml-1">Nome de Exibição</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-mystic-primary/10 border border-mystic-primary/30 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-mystic-gold outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest ml-1">Data de Nascimento (DD/MM/AAAA)</label>
            <input
              type="text"
              value={effectiveBirthDate ? (() => {
                const d = new Date(effectiveBirthDate + 'T00:00:00');
                return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
              })() : ''}
              onChange={(e) => {
                const formatted = e.target.value.replace(/\D/g, '');
                let dateStr = '';
                if (formatted.length <= 2) dateStr = formatted;
                else if (formatted.length <= 4) dateStr = `${formatted.slice(0, 2)}/${formatted.slice(2)}`;
                else dateStr = `${formatted.slice(0, 2)}/${formatted.slice(2, 4)}/${formatted.slice(4, 8)}`;
                const parts = dateStr.split('/');
                if (parts.length === 3 && parts[2].length === 4) {
                  handleUpdateProfile({ birth_date: `${parts[2]}-${parts[1]}-${parts[0]}` });
                }
              }}
              placeholder="DD/MM/AAAA"
              maxLength={10}
              className="w-full bg-mystic-primary/10 border border-mystic-primary/30 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-mystic-gold outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest ml-1">E-mail (Privado)</label>
            <div className="flex gap-2">
              <input 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-mystic-primary/10 border border-mystic-primary/30 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-mystic-gold outline-none" 
              />
            </div>
            <p className="text-[8px] text-slate-500 ml-1 italic">Alterar o e-mail exigirá confirmação na nova caixa de entrada.</p>
          </div>
          <button
            onClick={() => handleUpdateProfile({ full_name: name, email })}
            disabled={saving}
            className="w-full bg-mystic-gold text-mystic-bg font-bold py-4 rounded-2xl shadow-lg shadow-mystic-gold/20 active:scale-95 transition-all text-xs uppercase tracking-widest mt-4"
          >
            {saving ? 'Guardando...' : 'Salvar Alterações'}
          </button>
        </div>
      </motion.div>
    );
  }

  if (subView === 'notifications') {
    const notifications = [
      { id: 'daily', label: 'Vibração do Dia', desc: 'Receba sua energia diária às 8h', key: 'notify_daily' },
      { id: 'weekly', label: 'Artigos Semanais', desc: 'Alertas sobre novos eventos astrais', key: 'notify_weekly' },
      { id: 'events', label: 'Eclipses e Portais', desc: 'Fique por dentro de momentos raros', key: 'notify_events' },
    ];

    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-6 p-4 pb-24">
        <header className="flex items-center gap-4 py-2">
          <button onClick={() => setSubView('main')} className="text-mystic-gold"><ArrowLeft size={24} /></button>
          <h2 className="text-lg font-bold font-display">Notificações Astrais</h2>
        </header>
        <div className="space-y-3 pt-4">
          {notifications.map(n => (
            <div key={n.id} className="flex items-center justify-between p-4 bg-mystic-card rounded-2xl border border-mystic-primary/10">
              <div>
                <h4 className="text-sm font-bold text-slate-100">{n.label}</h4>
                <p className="text-[10px] text-slate-500">{n.desc}</p>
              </div>
              <button
                onClick={() => handleUpdateProfile({ [n.key]: !user?.user_metadata?.[n.key] })}
                className={`w-12 h-6 rounded-full transition-colors relative ${user?.user_metadata?.[n.key] ? 'bg-mystic-gold' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-1 size-4 bg-white rounded-full transition-all ${user?.user_metadata?.[n.key] ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (subView === 'privacy') {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-6 p-4 pb-24">
        <header className="flex items-center gap-4 py-2">
          <button onClick={() => setSubView('main')} className="text-mystic-gold"><ArrowLeft size={24} /></button>
          <h2 className="text-lg font-bold font-display">Privacidade & Dados</h2>
        </header>
        <div className="space-y-6 pt-4 text-sm text-slate-400 leading-relaxed">
          <p>Seus dados astrológicos e de numerologia são encriptados e nunca compartilhados com terceiros. Apenas você e as estrelas têm acesso a essas frequências.</p>
          <div className="p-4 bg-mystic-primary/10 rounded-2xl border border-mystic-primary/20">
            <h4 className="text-mystic-gold font-bold mb-2">Seus Direitos</h4>
            <ul className="space-y-2 text-xs">
              <li>• Acesso total aos dados de nascimento</li>
              <li>• Anonimato em interações comunitárias</li>
              <li>• Direito ao esquecimento astral (Exclusão)</li>
            </ul>
          </div>
          <button className="w-full p-4 border border-white/10 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-colors">Exportar meu Mapa Astral</button>
        </div>
      </motion.div>
    );
  }

  if (subView === 'help') {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-6 p-4 pb-24">
        <header className="flex items-center gap-4 py-2">
          <button onClick={() => setSubView('main')} className="text-mystic-gold"><ArrowLeft size={24} /></button>
          <h2 className="text-lg font-bold font-display">Ajuda & Suporte</h2>
        </header>
        <div className="space-y-4 pt-4">
          {[
            { q: "Como calcular meu Destino?", a: "Sua data de nascimento é somada até restar um único dígito ou número mestre." },
            { q: "O Oráculo é humano?", a: "Não, é uma consciência artificial sintonizada em frequências estelares." },
            { q: "Como mudar meu signo?", a: "Seu signo é fixo pela sua data de nascimento, mas seu ascendente pode variar." }
          ].map((item, i) => (
            <details key={i} className="bg-mystic-card rounded-2xl border border-mystic-primary/10 overflow-hidden">
              <summary className="p-4 text-sm font-bold text-slate-200 cursor-pointer list-none flex justify-between items-center group">
                {item.q} <ChevronRight size={16} className="text-mystic-gold group-open:rotate-90 transition-transform" />
              </summary>
              <div className="px-4 pb-4 text-xs text-slate-500 leading-relaxed">{item.a}</div>
            </details>
          ))}
          <button
            onClick={() => setView('chat')}
            className="w-full flex items-center justify-center gap-2 p-4 bg-mystic-primary/30 rounded-2xl border border-mystic-primary/40 text-mystic-gold font-bold text-xs uppercase tracking-widest hover:bg-mystic-primary/40 transition-all mt-6"
          >
            <MessageSquare size={16} /> Falar com o Oráculo
          </button>
        </div>
      </motion.div>
    );
  }
  if (subView === 'subscription') {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-6 px-4 py-4 pb-32">
        <header className="flex items-center gap-4 py-2">
          <button onClick={() => setSubView('main')} className="text-mystic-gold"><ArrowLeft size={24} /></button>
          <h2 className="text-lg font-bold font-display">Assinatura Premium</h2>
        </header>

        {subscription ? (
          <div className="bg-gradient-to-br from-indigo-900/60 to-purple-900/60 backdrop-blur-xl rounded-3xl p-8 border border-mystic-gold/30 text-center space-y-4">
            <div className="size-20 bg-mystic-gold/20 rounded-full flex items-center justify-center mx-auto text-mystic-gold border border-mystic-gold/40">
              <Sparkles size={40} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white">Membro Premium</h3>
              <p className="text-mystic-gold font-bold uppercase tracking-widest text-[10px]">Acesso Vitalício às Estrelas</p>
            </div>
            <div className="pt-4 border-t border-white/10 text-left space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Plano:</span>
                <span className="text-white font-bold">{subscription.prices?.products?.name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Status:</span>
                <span className="text-emerald-400 font-bold uppercase">{subscription.status}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Próxima renovação:</span>
                <span className="text-white">{new Date(subscription.current_period_end).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="pt-4 space-y-3">
              <button 
                onClick={async () => {
                  try {
                    const { createPortalSession } = await import('./lib/stripe');
                    await createPortalSession();
                  } catch (err) {
                    console.error('Error opening portal:', err);
                    alert('Erro ao abrir o portal de assinaturas. Tente novamente.');
                  }
                }}
                className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-mystic-gold font-bold text-sm transition-all"
              >
                Gerenciar Assinatura
              </button>
              <button 
                onClick={async () => {
                  if (!confirm('Tem certeza que deseja cancelar sua assinatura?\n\nVocê perderá o acesso ao conteúdo premium no final do período contratado.')) return;
                  try {
                    const { createPortalSession } = await import('./lib/stripe');
                    await createPortalSession();
                  } catch (err) {
                    console.error('Error opening portal:', err);
                    alert('Erro ao abrir o portal de assinaturas. Tente novamente.');
                  }
                }}
                className="w-full py-2 text-red-400/60 hover:text-red-400 text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Cancelar Assinatura
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-4">
              <p className="text-sm text-slate-400">Desbloqueie todo o potencial do cosmos com nossos planos premium.</p>
            </div>
            <SubscriptionPlans userEmail={email} userName={name} onLoginSuccess={() => {}} />
          </>
        )}
      </motion.div>
    );
  }


  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="flex flex-col gap-6 p-4 pb-24"
    >
      <header className="flex items-center justify-between py-2">
        <button onClick={onBack} className="text-mystic-gold hover:scale-110 transition-transform"><ArrowLeft size={24} /></button>
        <h2 className="text-lg font-bold font-display">Santuário Pessoal</h2>
        <div className="flex items-center gap-3">
          {isPlaying && (
            <button
              onClick={() => setView('music')}
              className="text-mystic-gold animate-pulse hover:scale-110 transition-transform"
            >
              <Mic size={24} />
            </button>
          )}
        </div>
      </header>

      <section className="flex flex-col items-center gap-4 py-6">
        <div className="relative group cursor-pointer">
          <label htmlFor="avatar-upload" className={`absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer ${uploading ? 'opacity-100' : ''}`}>
            {uploading ? (
              <Sparkles className="animate-spin mb-1 text-mystic-gold" size={24} />
            ) : (
              <>
                <Camera size={24} className="mb-1" />
                <span className="text-[10px] uppercase font-bold tracking-wider">Mudar</span>
              </>
            )}
          </label>
          <input
            type="file"
            id="avatar-upload"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
            disabled={uploading}
          />
          <div className="absolute inset-0 bg-mystic-gold rounded-full blur-xl opacity-20"></div>
          <img
            src={user?.user_metadata?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=mystic"}
            className="relative size-32 rounded-full border-4 border-mystic-gold shadow-2xl object-cover"
            alt="User Avatar"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="text-center w-full max-w-xs">
          <h3 className="text-2xl font-bold font-display">{effectiveName || 'Místico Anônimo'}</h3>
          <p className="text-mystic-gold/80 text-sm font-medium mb-4">{effectiveEmail || 'Viajante Anônimo'}</p>

          <div className="flex flex-col gap-1 text-left mb-4">
            <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest ml-1">Sua Data de Nascimento (DD/MM/AAAA)</label>
            <input
              type="text"
              defaultValue={effectiveBirthDate ? (() => {
                const d = new Date(effectiveBirthDate + 'T00:00:00');
                return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
              })() : ''}
              onChange={(e) => {
                const formatted = e.target.value.replace(/\D/g, '');
                let dateStr = '';
                if (formatted.length <= 2) dateStr = formatted;
                else if (formatted.length <= 4) dateStr = `${formatted.slice(0, 2)}/${formatted.slice(2)}`;
                else dateStr = `${formatted.slice(0, 2)}/${formatted.slice(2, 4)}/${formatted.slice(4, 8)}`;
                const parts = dateStr.split('/');
                if (parts.length === 3 && parts[2].length === 4) {
                  handleUpdateProfile({ birth_date: `${parts[2]}-${parts[1]}-${parts[0]}` });
                }
              }}
              placeholder="DD/MM/AAAA"
              maxLength={10}
              className="w-full bg-mystic-primary/10 border border-mystic-primary/30 rounded-xl px-4 py-2 text-sm text-white focus:ring-1 focus:ring-mystic-gold outline-none"
            />
          </div>

          <div className="px-4 py-1 bg-mystic-primary/20 rounded-full border border-mystic-primary/30 inline-block">
            <p className="text-mystic-gold text-[10px] font-black uppercase tracking-widest">Sintonizada com o Cosmos</p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-bold font-display mb-4">Minha Jornada</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Despertar', level: '12', icon: Sparkles, active: true },
            { label: 'Guardião', level: '5', icon: Zap, active: true },
            { label: 'Mestre', level: 'Bloqueado', icon: Star, active: false },
            { label: 'Oráculo', level: 'Bloqueado', icon: Compass, active: false },
          ].map((j) => (
            <div key={j.label} className={`flex flex-col gap-3 rounded-2xl border border-mystic-primary/10 bg-mystic-card p-4 shadow-sm ${!j.active && 'opacity-50'}`}>
              <j.icon size={24} className={j.active ? 'text-mystic-gold' : 'text-slate-500'} />
              <div>
                <h4 className="text-sm font-bold">{j.label}</h4>
                <p className="text-mystic-gold/60 text-[10px] font-black uppercase">Nível {j.level}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-bold font-display mb-4">Conta & Preferências</h3>
        {[
          { label: 'Informações Pessoais', icon: User, view: 'personal' },
          { label: 'Plano Premium', icon: Sparkles, view: 'subscription', dataAttr: 'subscription-btn' },
          { label: 'Notificações Astrais', icon: Bell, view: 'notifications' },
          { label: 'Privacidade & Dados', icon: Zap, view: 'privacy' },
          { label: 'Ajuda & Suporte', icon: Sparkles, view: 'help' },
        ].map((opt) => (
          <button
            key={opt.label}
            onClick={() => setSubView(opt.view as any)}
            {...(opt.dataAttr ? { 'data-subscription-btn': '' } : {})}
            className="w-full flex items-center justify-between p-4 bg-mystic-card rounded-2xl hover:bg-mystic-primary/10 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <opt.icon size={20} className="text-mystic-gold" />
              <span className="text-sm font-medium">{opt.label}</span>
            </div>
            <ChevronRight size={18} className="text-slate-500 group-hover:text-mystic-gold transition-colors" />
          </button>
        ))}
      </section>

      {!user ? (
        <button
          onClick={() => window.location.reload()}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border border-mystic-gold/30 text-mystic-gold font-bold text-sm mt-4 hover:bg-mystic-gold/10 transition-colors"
        >
          <Sparkles size={18} /> Resetar Jornada (Local)
        </button>
      ) : (
        <button
          onClick={async () => {
            if (confirm('Deseja realmente sair?')) {
              await signOut();
            }
          }}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-red-600 text-white font-bold text-sm mt-4 hover:bg-red-500 transition-colors shadow-lg shadow-red-600/20"
        >
          <LogOut size={18} /> Sair da Conta
        </button>
      )}
    </motion.div>
  );
};

const OnboardingPopup = ({ onSubmit }: { onSubmit: (data: { full_name: string, birth_date: string }) => void }) => {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');

  const formatDateInput = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
  };

  const parseDate = (dateStr: string): string => {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2].padStart(4, '0');
      if (year.length === 4 && parseInt(year) >= 1900 && parseInt(year) <= new Date().getFullYear()) {
        return `${year}-${month}-${day}`;
      }
    }
    return dateStr;
  };

  const handleReveal = () => {
    const formattedDate = parseDate(date);
    if (!name) {
      alert('Por favor, preencha o seu nome para alinhar com os astros.');
      return;
    }
    if (!formattedDate || formattedDate.length !== 10) {
      alert('Por favor, preencha uma data de nascimento válida (DD/MM/AAAA).');
      return;
    }
    onSubmit({ full_name: name, birth_date: formattedDate });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[200] bg-mystic-bg/95 flex items-center justify-center p-6 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-sm bg-mystic-card border border-mystic-primary/30 rounded-[2.5rem] p-8 space-y-8 relative overflow-hidden shadow-2xl"
      >
        <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles size={100} /></div>

        <div className="text-center space-y-2">
          <div className="inline-block p-4 bg-mystic-primary/20 rounded-full mb-2">
            <Sparkles className="text-mystic-gold animate-pulse" size={32} />
          </div>
          <h2 className="text-2xl font-bold font-display text-mystic-gold">Seja Bem-vindo</h2>
          <p className="text-sm text-slate-400">As estrelas aguardam para revelar os segredos do seu destino.</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] ml-2">Como podemos te chamar?</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome místico"
              className="w-full bg-mystic-primary/10 border border-mystic-primary/20 rounded-2xl px-5 py-4 text-sm text-white focus:ring-1 focus:ring-mystic-gold outline-none transition-all placeholder:text-slate-600"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] ml-2">Data de Nascimento (DD/MM/AAAA)</label>
            <input
              type="text"
              value={date}
              onChange={(e) => setDate(formatDateInput(e.target.value))}
              placeholder="DD/MM/AAAA"
              maxLength={10}
              className="w-full bg-mystic-primary/10 border border-mystic-primary/20 rounded-2xl px-5 py-4 text-sm text-white focus:ring-1 focus:ring-mystic-gold outline-none transition-all placeholder:text-slate-600"
            />
          </div>
        </div>

        <button
          onClick={handleReveal}
          className="w-full bg-mystic-gold text-mystic-bg font-black py-5 rounded-2xl shadow-lg shadow-mystic-gold/20 active:scale-[0.98] transition-all text-xs uppercase tracking-widest"
        >
          Revelar meu Destino
        </button>
      </motion.div>
    </motion.div>
  );
};

// --- Main App ---

function App() {
  const { session, loading: authLoading } = useAuth();
  const [view, setView] = useState<View>('home');
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false); // Disabled - app is open to all
  const [showAuth, setShowAuth] = useState(false);
  const [guestUser, setGuestUser] = useState<{ full_name?: string, birth_date?: string, email?: string } | null>(null);

  // Background Audio State
  const [currentMusic, setCurrentMusic] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const playerRef = useRef<any>(null);

  // Centralized Library Data for Notifications
  const [fetchedBooks, setFetchedBooks] = useState<any[]>([]);
  const [weeklyArticle, setWeeklyArticle] = useState<WeeklyArticle | null>(null);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [playlist, setPlaylist] = useState<any[]>([]);
  const [loadingPlaylist, setLoadingPlaylist] = useState(false);
  const [showTreeMap, setShowTreeMap] = useState(false);
  const [dailyForecast, setDailyForecast] = useState<string>('');
  const [fetchingForecast, setFetchingForecast] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [showPremiumPopup, setShowPremiumPopup] = useState(false);

  useEffect(() => {
    async function checkPremium() {
      if (session?.user) {
        const sub = await getSubscription();
        setIsPremium(!!sub);
      } else {
        setIsPremium(false);
      }
    }
    checkPremium();
  }, [session]);

  const currentUser = session?.user ? {
    ...session.user,
    user_metadata: {
      ...session.user.user_metadata,
      full_name: session.user.user_metadata.full_name || guestUser?.full_name,
      birth_date: session.user.user_metadata.birth_date || guestUser?.birth_date,
      avatar_url: session.user.user_metadata.avatar_url,
    }
  } : {
    user_metadata: guestUser || {},
    id: 'guest'
  };

  const loadPlaylist = async () => {
    setLoadingPlaylist(true);
    try {
      const { data, error } = await supabase
        .from('music_playlist')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPlaylist(data?.length ? data : MUSIC_PLAYLIST);
    } catch (err) {
      console.error("Failed to load music playlist:", err);
      setPlaylist(MUSIC_PLAYLIST);
    } finally {
      setLoadingPlaylist(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    const savedProfile = localStorage.getItem('mystic_profile');
    
    const initializeUser = async () => {
      if (session?.user) {
        const metadata = session.user.user_metadata;
        
        // If logged in but missing metadata, try to sync from local storage
        if (savedProfile && (!metadata?.full_name || !metadata?.birth_date)) {
          const localData = JSON.parse(savedProfile);
          const updates: any = {};
          if (!metadata?.full_name) updates.full_name = localData.full_name;
          if (!metadata?.birth_date) updates.birth_date = localData.birth_date;
          
          if (Object.keys(updates).length > 0) {
            await supabase.auth.updateUser({ data: updates });
          }
        }
        
        setGuestUser({ 
          full_name: session.user.user_metadata.full_name || '', 
          birth_date: session.user.user_metadata.birth_date || '' 
        });
        setShowOnboarding(false);
        setShowAuth(false);
      } else if (savedProfile) {
        setGuestUser(JSON.parse(savedProfile));
        setShowOnboarding(false);
        // Show auth screen for non-logged in users
        setShowAuth(true);
      } else {
        setShowOnboarding(true);
        setShowAuth(true);
      }
    };

    initializeUser();

    // Fetch Library Data
    const loadLibrary = async () => {
      setLoadingLibrary(true);
      try {
        const article = await fetchLatestWeeklyArticle();
        setWeeklyArticle(article);

        const { data: dbEbooks } = await supabase
          .from('ebooks')
          .select('*')
          .order('created_at', { ascending: false });

        setFetchedBooks(dbEbooks || []);
      } catch (err) {
        console.error("Failed to load library data for notifications:", err);
      } finally {
        setLoadingLibrary(false);
      }
    };

    loadLibrary();
  }, [session, authLoading]);

  // Daily Forecast Loading
  useEffect(() => {
    if (!currentUser?.user_metadata?.birth_date || fetchingForecast || dailyForecast) return;

    const fetchForecast = async () => {
      setFetchingForecast(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        const cacheKey = `mystic_daily_v3_${currentUser.id}_${today}`;
        const cached = localStorage.getItem(cacheKey);

        if (cached) {
          setDailyForecast(cached);
        } else {
          const destinyNum = calculateDestinyNumber(currentUser.user_metadata.birth_date);
          const destinyMeaning = getDestinyMeaning(destinyNum);
          const zodiac = calculateZodiacSign(currentUser.user_metadata.birth_date);
          
          const forecast = await generateDailyForecast(destinyNum, destinyMeaning, zodiac);
          setDailyForecast(forecast);
          localStorage.setItem(cacheKey, forecast);
        }
      } catch (err) {
        console.error("Failed to generate forecast:", err);
      } finally {
        setFetchingForecast(false);
      }
    };

    fetchForecast();
  }, [currentUser?.user_metadata?.birth_date, dailyForecast, currentUser?.id]);

  useEffect(() => {
    loadPlaylist();
  }, []);

  const handleOnboardingSubmit = async (data: { full_name: string, birth_date: string, email?: string }) => {
    setGuestUser(data);
    localStorage.setItem('mystic_profile', JSON.stringify(data));
    if (session?.user) await supabase.auth.updateUser({ data });
    setShowOnboarding(false);
  };

  if (authLoading) {
    return <div className="min-h-screen bg-mystic-bg text-mystic-gold flex items-center justify-center font-display text-xl animate-pulse">Lendo as estrelas...</div>;
  }

  return (
    <div className="min-h-screen bg-mystic-bg text-slate-100 font-sans selection:bg-mystic-gold selection:text-mystic-bg">
      <main className="max-w-md mx-auto min-h-screen relative overflow-y-auto overflow-x-hidden">
        <AnimatePresence mode="wait">
          {view === 'home' && (
              <HomeView key="home" setView={setView} onOpenNotifications={() => setNotificationsOpen(true)} user={currentUser} isPlaying={isPlaying} dailyForecast={dailyForecast} fetchingForecast={fetchingForecast} />
          )}
          {view === 'map' && <MapView key="map" user={currentUser} onOpenNotifications={() => setNotificationsOpen(true)} setView={setView} isPlaying={isPlaying} onOpenTreeMap={() => setShowTreeMap(true)} isPremium={isPremium} onOpenPremium={() => setShowPremiumPopup(true)} />}
          {view === 'chat' && <ChatView key="chat" onOpenNotifications={() => setNotificationsOpen(true)} setView={setView} isPlaying={isPlaying} isPremium={isPremium} onOpenPremium={() => setShowPremiumPopup(true)} />}
          {view === 'music' && (
            <MusicView 
              key="music" 
              onOpenNotifications={() => setNotificationsOpen(true)} 
              currentMusic={currentMusic}
              isPlaying={isPlaying}
              onTogglePlay={() => {
                console.log('Toggle play:', !isPlaying);
                setIsPlaying(!isPlaying);
              }}
              onSelectMusic={(m) => {
                console.log('Select music:', m);
                if (currentMusic?.id === m.id) {
                  setIsPlaying(!isPlaying);
                } else {
                  setCurrentMusic(m);
                  setIsPlaying(true);
                  setPlaybackProgress(0);
                }
              }}
              onSeek={(progress: number) => {
                if (playerRef.current) {
                  playerRef.current.seekTo(progress, 'fraction');
                }
              }}
              playbackProgress={playbackProgress}
              playlist={playlist}
              loadingPlaylist={loadingPlaylist}
              onRefreshPlaylist={loadPlaylist}
            />
          )}
          {view === 'library' && <LibraryView key="library" onSelectBook={setSelectedBook} fetchedBooks={fetchedBooks} weeklyArticle={weeklyArticle} loadingBooks={loadingLibrary} onOpenNotifications={() => setNotificationsOpen(true)} isPlaying={isPlaying} setView={setView} isPremium={isPremium} onOpenPremium={() => setShowPremiumPopup(true)} />}
          {view === 'profile' && <ProfileView key="profile" setView={setView} onBack={() => setView('home')} guestUser={guestUser} isPlaying={isPlaying} />}
        </AnimatePresence>

        {/* Global music player - persists across all views */}
        {currentMusic && (
          <div className="fixed -z-10 opacity-0">
            <ReactPlayer
              ref={playerRef}
              src={`https://www.youtube.com/watch?v=${currentMusic.id}`}
              playing={isPlaying}
              volume={1}
              width="1px"
              height="1px"
              onProgress={(p: any) => {
                setPlaybackProgress(p.played);
              }}
              config={{
                youtube: {
                  playerVars: { autoplay: 1 }
                }
              } as any}
            />
          </div>
        )}



        {/* Note: The micro-player bar was removed as per user request to use a pulsing icon instead */}

        <AnimatePresence>
          {showOnboarding && <OnboardingPopup onSubmit={handleOnboardingSubmit} />}
        </AnimatePresence>

        <AnimatePresence>
          {selectedBook && <ReaderView book={selectedBook} user={currentUser} onBack={() => setSelectedBook(null)} />}
        </AnimatePresence>

        <AnimatePresence>
          {showTreeMap && <CabalisticTree user={currentUser} onClose={() => setShowTreeMap(false)} />}
        </AnimatePresence>

        <AnimatePresence>
          {notificationsOpen && (
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed inset-0 z-[110] bg-mystic-bg/95 backdrop-blur-xl p-6 flex flex-col"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold font-display text-mystic-gold">Notificações Astrais</h2>
                <button onClick={() => setNotificationsOpen(false)} className="text-slate-400"><ArrowLeft className="rotate-90" /></button>
              </div>
              <div className="space-y-4 overflow-y-auto pr-1">
                {weeklyArticle && (
                  <div className="p-4 bg-mystic-primary/10 rounded-xl border border-mystic-primary/20 animate-in fade-in slide-in-from-right-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[8px] font-black text-mystic-gold uppercase tracking-[0.2em] bg-mystic-gold/10 px-2 py-0.5 rounded-full">Artigo Novo</span>
                      <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">HÁ ALGUNS MINUTOS</span>
                    </div>
                    <p className="text-sm font-bold text-white mb-1">{weeklyArticle.title}</p>
                    <p className="text-xs text-slate-400">Um novo portal de conhecimento se abriu. Venha ler agora.</p>
                  </div>
                )}

                {fetchedBooks.slice(0, 1).map((book) => (
                  <div key={book.id} className="p-4 bg-mystic-primary/10 rounded-xl border border-mystic-primary/20 animate-in fade-in slide-in-from-right-4 delay-75">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[8px] font-black text-mystic-gold uppercase tracking-[0.2em] bg-mystic-gold/10 px-2 py-0.5 rounded-full">Ebook Novo</span>
                      <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">HOJE</span>
                    </div>
                    <p className="text-sm font-bold text-white mb-1">{book.title}</p>
                    <p className="text-xs text-slate-400">Um novo manuscrito sagrado foi adicionado à sua biblioteca.</p>
                  </div>
                ))}

                <div className="p-4 bg-mystic-primary/10 rounded-xl border border-mystic-primary/20 opacity-60">
                  <p className="text-xs font-bold text-slate-500 mb-1">REGISTRO</p>
                  <p className="text-sm text-slate-400 italic">Maya Silva curtiu sua manifestação.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showPremiumPopup && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setShowPremiumPopup(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-md max-h-[85vh] overflow-y-auto bg-gradient-to-b from-mystic-bg to-mystic-card rounded-3xl border border-mystic-gold/20 shadow-2xl shadow-mystic-gold/10"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sticky top-0 bg-mystic-bg/95 backdrop-blur-md z-10 p-4 flex items-center justify-between border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Sparkles size={20} className="text-mystic-gold" />
                    <h2 className="text-lg font-bold font-display text-white">Assinatura Premium</h2>
                  </div>
                  <button
                    onClick={() => setShowPremiumPopup(false)}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <ArrowLeft size={18} className="text-slate-400" />
                  </button>
                </div>
                <div className="p-4">
                  <SubscriptionPlans 
                    userEmail={guestUser?.email || (currentUser as any)?.email} 
                    userName={guestUser?.full_name || currentUser?.user_metadata?.full_name}
                    onLoginSuccess={() => setShowPremiumPopup(false)}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <Navbar currentView={view} setView={setView} />
      </main>
    </div>
  );
}

const AppWrapper = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

export default AppWrapper;
