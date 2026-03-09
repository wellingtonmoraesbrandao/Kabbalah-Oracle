import React, { useState, useEffect, useRef } from 'react';
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
  Compass
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { chatWithIA } from './services/gemini';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthScreen } from './components/AuthScreen';
import { generatePdfCover } from './lib/pdfHelper';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// --- Types ---
type View = 'home' | 'map' | 'chat' | 'library' | 'community' | 'profile';

const COMMUNITY_POSTS = [
  {
    id: 1,
    user: { name: 'Maya Silva', sign: 'Escorpião', destiny: 7, avatar: 'https://picsum.photos/seed/maya/100' },
    content: 'Sua intuição está aguçada hoje. Um portal de sabedoria se abre para questões de autoconhecimento. Momento favorável para meditação e estudos ocultos. Evite decisões impulsivas no campo financeiro.',
    type: 'Vibração do Dia',
    title: 'Energia 7 — Introspecção',
    stats: { likes: 124, hearts: 89, diamonds: 42, stars: 89, comments: 12, fire: 56 },
    image: 'https://picsum.photos/seed/mystic1/800/800',
    isAuto: true
  },
  {
    id: 2,
    user: { name: 'Gabriel Santos', sign: 'Peixes', destiny: 9, avatar: 'https://picsum.photos/seed/gabriel/100' },
    content: 'Misticismo no ar! Senti uma energia incrível nas cartas hoje de manhã.',
    type: 'Manifestação',
    title: 'Leitura Matinal',
    stats: { likes: 45, hearts: 22, diamonds: 12, stars: 10, comments: 5, fire: 8 },
    image: null,
    isAuto: false
  },
  {
    id: 3,
    user: { name: 'Sistema Astral', sign: 'Cosmos', destiny: 11, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cosmos' },
    content: 'Ciclos se fecham para que o novo floresça. Sua generosidade atrairá boas vibrações. No campo espiritual, a conexão com mentores está facilitada. Excelente dia para práticas de desapego e limpeza energética.',
    type: 'Análise Automática',
    title: 'Energia 9 — Conclusão',
    stats: { likes: 312, hearts: 210, diamonds: 156, stars: 92, comments: 28, fire: 21 },
    image: 'https://picsum.photos/seed/mystic2/800/800',
    isAuto: true
  }
];

const LIBRARY_BOOKS = [
  { id: 1, title: 'O Poder do Destino 8', category: 'Numerologia', image: 'https://picsum.photos/seed/book1/300/450' },
  { id: 2, title: 'Astrologia e Alma', category: 'Astrologia', image: 'https://picsum.photos/seed/book2/300/450' },
  { id: 3, title: 'Guia de Numerologia', category: 'Prático', image: 'https://picsum.photos/seed/book3/300/450' }
];

const SHELF_BOOKS = [
  { id: 4, title: 'Os Mistérios dos Arcanos', progress: 75, image: 'https://picsum.photos/seed/shelf1/300/450' },
  { id: 5, title: 'Mapas Celestiais', progress: 12, image: 'https://picsum.photos/seed/shelf2/300/450' }
];

const LATEST_RELEASES = [
  { id: 6, title: 'Tarot Real', image: 'https://picsum.photos/seed/rel1/200/200' },
  { id: 7, title: 'Alquimia', image: 'https://picsum.photos/seed/rel2/200/200' },
  { id: 8, title: 'Zodíaco', image: 'https://picsum.photos/seed/rel3/200/200' }
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
    { id: 'chat', icon: Wand2, label: 'Oráculo' },
    { id: 'library', icon: Library, label: 'Biblioteca' },
    { id: 'community', icon: MessageSquare, label: 'Comunidade' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-mystic-bg/90 backdrop-blur-xl border-t border-mystic-primary/20 px-4 pb-8 pt-3 flex justify-around items-center">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setView(item.id)}
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${currentView === item.id ? 'text-mystic-gold scale-110' : 'text-slate-500 hover:text-slate-300'
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

const HomeView = ({ setView, onOpenNotifications, user }: { setView: (v: View) => void, onOpenNotifications: () => void, user: any }) => (
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
            <p className="text-xs font-semibold uppercase tracking-wider">Leão</p>
          </div>
        </div>
      </button>
      <button
        onClick={onOpenNotifications}
        className="size-11 flex items-center justify-center rounded-xl bg-mystic-primary/20 border border-mystic-primary/30 hover:bg-mystic-primary/30 transition-colors"
      >
        <Bell size={20} />
      </button>
    </header>

    <section className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-mystic-primary via-mystic-primary to-purple-900 shadow-2xl shadow-mystic-primary/30">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Sparkles size={120} />
      </div>
      <div className="relative z-10">
        <p className="text-slate-300/60 text-xs font-medium uppercase tracking-[0.2em] mb-1">Energia de Hoje</p>
        <div className="flex items-baseline gap-3">
          <h3 className="text-white text-5xl font-black font-display">7</h3>
          <p className="text-mystic-gold text-xl font-semibold">(Introspecção)</p>
        </div>
        <p className="mt-4 text-white/80 text-sm max-w-[240px] leading-relaxed">
          Um dia ideal para o autoconhecimento e a conexão profunda com sua sabedoria interior.
        </p>
      </div>
    </section>

    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold font-display">Previsão Diária</h2>
        <span className="text-mystic-gold text-sm font-medium">Ver tudo</span>
      </div>
      <div className="p-[1px] rounded-2xl bg-gradient-to-r from-mystic-gold via-mystic-primary to-mystic-gold">
        <div className="bg-mystic-card p-6 rounded-[calc(1rem-1px)]">
          <div className="flex items-start gap-4">
            <div className="bg-mystic-gold/10 p-3 rounded-lg text-mystic-gold">
              <Zap size={24} />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold mb-2">A clareza se aproxima</h4>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Suas visões estão mais nítidas hoje. Siga sua intuição em assuntos profissionais. Um encontro inesperado pode abrir portas.
              </p>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-mystic-primary/30 text-xs rounded-full border border-mystic-primary/20">Amor: 85%</span>
                <span className="px-3 py-1 bg-mystic-primary/30 text-xs rounded-full border border-mystic-primary/20">Sorte: 92%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section>
      <h2 className="text-xl font-bold font-display mb-4">Seus Números Core</h2>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Destino', val: '8', icon: Compass },
          { label: 'Alma', val: '5', icon: Heart },
          { label: 'Missão', val: '11', icon: Zap },
        ].map((n) => (
          <div key={n.label} className="flex flex-col items-center justify-center p-4 rounded-xl bg-mystic-primary/10 border border-mystic-primary/20">
            <n.icon size={20} className="text-mystic-gold mb-2" fill="currentColor" />
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">{n.label}</p>
            <p className="text-2xl font-black text-white">{n.val}</p>
          </div>
        ))}
      </div>
    </section>

    <section className="flex items-center gap-4 p-4 rounded-2xl bg-white/5">
      <div className="size-16 flex-shrink-0 bg-mystic-bg rounded-full flex items-center justify-center shadow-inner relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-mystic-primary/40 to-transparent"></div>
        <Moon size={32} className="text-slate-100" />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">Fase da Lua</p>
        <h4 className="text-lg font-bold">Crescente</h4>
        <p className="text-xs text-mystic-gold font-medium">Tempo de expansão e foco</p>
      </div>
    </section>
  </motion.div>
);

const MapView = () => {
  const [search, setSearch] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col gap-6 p-4 pb-24"
    >
      <header className="flex items-center justify-between sticky top-0 bg-mystic-bg/80 backdrop-blur-md z-10 py-2">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="size-10 flex items-center justify-center rounded-full bg-mystic-primary/20 hover:bg-mystic-primary/30 transition-colors"
        >
          <Menu size={20} />
        </button>
        <h2 className="text-lg font-bold font-display">Mapa Cabalístico</h2>
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`bg-mystic-primary/10 border border-mystic-primary/20 rounded-full px-4 py-1 text-xs transition-all duration-300 focus:ring-1 focus:ring-mystic-gold ${search ? 'w-32 opacity-100' : 'w-0 opacity-0'}`}
          />
          <button
            onClick={() => setSearch(search ? '' : ' ')}
            className="size-10 flex items-center justify-center rounded-full bg-mystic-primary/20 hover:bg-mystic-primary/30 transition-colors ml-2"
          >
            <Search size={20} />
          </button>
        </div>
      </header>

      {isMenuOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="bg-mystic-card rounded-xl p-4 border border-mystic-primary/20 text-xs space-y-2"
        >
          <p className="font-bold text-mystic-gold uppercase tracking-widest">Configurações do Mapa</p>
          <button className="w-full text-left p-2 hover:bg-mystic-primary/10 rounded">Calcular Novo Mapa</button>
          <button className="w-full text-left p-2 hover:bg-mystic-primary/10 rounded">Exportar PDF</button>
        </motion.div>
      )}

      <section className="flex flex-col items-center py-8">
        <div className="relative size-72 flex items-center justify-center rounded-full border border-mystic-gold/20 bg-gradient-to-b from-mystic-primary/20 to-mystic-bg">
          <div className="absolute inset-4 rounded-full border border-mystic-gold/10"></div>
          <div className="absolute inset-12 rounded-full border border-mystic-gold/20"></div>
          <div className="absolute inset-20 rounded-full border border-mystic-gold/30"></div>

          <div className="z-10 text-center">
            <p className="text-mystic-gold text-[10px] uppercase tracking-widest font-bold mb-1">Destino</p>
            <h1 className="text-6xl font-black text-mystic-gold gold-glow font-display">8</h1>
            <p className="text-slate-400 text-[10px] mt-2 italic">A Força e Realização</p>
          </div>

          {/* Orbiting Numbers */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-mystic-bg border border-mystic-gold/50 rounded-full size-10 flex items-center justify-center text-mystic-gold font-bold shadow-lg shadow-mystic-gold/20">3</div>
          <div className="absolute bottom-10 right-4 bg-mystic-bg border border-mystic-gold/50 rounded-full size-8 flex items-center justify-center text-mystic-gold font-bold">11</div>
          <div className="absolute bottom-10 left-4 bg-mystic-bg border border-mystic-gold/50 rounded-full size-8 flex items-center justify-center text-mystic-gold font-bold">22</div>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={20} className="text-mystic-gold" />
          <h2 className="text-xl font-bold font-display">Números de Base</h2>
        </div>
        <div className="grid gap-3">
          {[
            { label: 'Destino', val: '8', desc: 'O caminho da sua vida e realização material.', icon: Sparkles },
            { label: 'Alma', val: '3', desc: 'O desejo genuíno do seu coração e motivação.', icon: Heart },
            { label: 'Expressão', val: '11', desc: 'Seus talentos naturais e como você interage.', icon: Zap },
          ].map((item) => (
            <div key={item.label} className="flex gap-4 rounded-2xl border border-mystic-primary/20 bg-mystic-primary/5 p-4 items-center">
              <div className="size-12 rounded-xl bg-mystic-primary/20 flex items-center justify-center text-mystic-gold">
                <item.icon size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold">{item.label}</h3>
                  <span className="text-mystic-gold font-black">{item.val}</span>
                </div>
                <p className="text-slate-400 text-xs">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-6">
          <Moon size={20} className="text-mystic-gold" />
          <h2 className="text-xl font-bold font-display">Ciclos de Vida</h2>
        </div>
        <div className="relative pl-8 border-l-2 border-mystic-primary/30 space-y-8 ml-4">
          <div className="relative">
            <div className="absolute -left-[41px] top-0 size-5 rounded-full bg-mystic-gold shadow-[0_0_15px_rgba(212,175,55,0.8)] border-4 border-mystic-bg"></div>
            <div className="bg-mystic-primary/10 rounded-xl p-4 border border-mystic-primary/20">
              <span className="text-[10px] font-bold text-mystic-gold uppercase">0 - 28 Anos</span>
              <h4 className="font-bold mt-1">Ciclo Formativo</h4>
              <p className="text-xs text-slate-400 mt-2">Período de aprendizado sob influência familiar.</p>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -left-[41px] top-0 size-5 rounded-full bg-mystic-primary shadow-[0_0_15px_rgba(44,0,133,0.8)] border-4 border-mystic-bg"></div>
            <div className="bg-mystic-primary/30 rounded-xl p-4 border border-mystic-gold/40">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold text-mystic-gold uppercase">29 - 56 Anos</span>
                  <h4 className="font-bold mt-1">Ciclo Produtivo (Atual)</h4>
                </div>
                <span className="bg-mystic-gold text-mystic-bg text-[8px] font-black px-2 py-0.5 rounded-full">ATIVO</span>
              </div>
              <p className="text-xs text-slate-100 mt-2">Fase de expansão e construção de carreira.</p>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
};

const ChatView = () => {
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
      className="flex flex-col h-screen pb-24"
    >
      <header className="p-4 border-b border-mystic-primary/20 flex flex-col items-center">
        <h1 className="text-lg font-bold font-display">Oráculo Estelar</h1>
        <p className="text-[10px] text-mystic-gold uppercase tracking-widest">Conectado ao Cosmos</p>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex items-start gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`size-10 shrink-0 rounded-full flex items-center justify-center border ${m.role === 'model' ? 'bg-mystic-primary border-mystic-gold/50 text-mystic-gold' : 'bg-mystic-primary/20 border-mystic-primary/40 text-mystic-gold'
              }`}>
              {m.role === 'model' ? <Sparkles size={20} /> : <User size={20} />}
            </div>
            <div className={`flex flex-col gap-1.5 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {m.role === 'model' ? 'Guia Estelar' : 'Buscador'}
              </p>
              <div className={`max-w-[85%] rounded-2xl px-5 py-3 text-sm leading-relaxed ${m.role === 'model'
                ? 'bg-mystic-primary/40 text-slate-100 border border-mystic-gold/30 rounded-tl-none'
                : 'bg-mystic-gold text-mystic-bg font-medium rounded-tr-none'
                }`}>
                <Markdown>{m.text}</Markdown>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-mystic-gold animate-pulse">
            <Sparkles size={16} />
            <span className="text-xs italic">Consultando os astros...</span>
          </div>
        )}
      </div>

      <div className="px-4 pb-2">
        {!activeCategory ? (
          <div className="flex overflow-x-auto gap-2 no-scrollbar pb-2">
            {CHAT_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="flex-none flex items-center gap-2 bg-mystic-primary/20 hover:bg-mystic-primary/30 border border-mystic-primary/40 rounded-full px-4 py-2 text-sm text-mystic-gold transition-colors"
              >
                <span>{cat.icon}</span>
                <span className="font-medium whitespace-nowrap">{cat.title}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-1">
              <button onClick={() => setActiveCategory(null)} className="text-slate-400 hover:text-white flex items-center gap-1 text-xs px-2">
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
                  className="flex-none bg-mystic-card hover:bg-mystic-primary/20 border border-mystic-primary/30 rounded-2xl px-4 py-2 text-xs text-slate-300 transition-colors max-w-[280px] text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="p-4 bg-mystic-bg/80 backdrop-blur-md border-t border-mystic-primary/20">
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center bg-white/5 rounded-xl border border-mystic-primary/20 px-3 py-1">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="w-full bg-transparent border-none focus:ring-0 text-sm py-2"
              placeholder="Sua mensagem ao cosmos..."
            />
            <Mic size={18} className="text-slate-500" />
          </div>
          <button
            onClick={() => handleSend()}
            disabled={loading}
            className="size-12 rounded-xl bg-mystic-gold text-mystic-bg flex items-center justify-center shadow-lg shadow-mystic-gold/20 active:scale-95 transition-transform"
          >
            <Send size={20} />
          </button>
        </div>
      </footer>
    </motion.div>
  );
};

const CommunityView = ({ posts, onAddPost }: { posts: any[], onAddPost: (content: string) => void }) => {
  const [newPost, setNewPost] = useState('');
  const [likedPosts, setLikedPosts] = useState<number[]>([]);
  const [heartedPosts, setHeartedPosts] = useState<number[]>([]);

  const handleLike = (id: number) => {
    setLikedPosts(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const handleHeart = (id: number) => {
    setHeartedPosts(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col gap-6 p-4 pb-24"
    >
      <header className="flex items-center justify-between sticky top-0 bg-mystic-bg/80 backdrop-blur-md z-10 py-2">
        <div className="flex items-center gap-2">
          <Flame size={24} className="text-mystic-gold" />
          <h1 className="text-xl font-black font-display bg-gradient-to-r from-mystic-gold to-purple-400 bg-clip-text text-transparent">Mística</h1>
        </div>
        <div className="flex items-center gap-3">
          <Bell size={20} className="text-mystic-gold cursor-pointer" />
          <img src="https://picsum.photos/seed/user/100" className="size-10 rounded-full border-2 border-mystic-gold p-0.5" alt="User" />
        </div>
      </header>


      <div className="space-y-6">
        {posts.map((post) => (
          <article
            key={post.id}
            className={`bg-mystic-card rounded-2xl overflow-hidden shadow-xl ${post.isAuto
              ? 'border-2 border-mystic-gold/50 shadow-[0_0_15px_rgba(212,175,55,0.2)]'
              : 'border border-mystic-primary/20'
              }`}
          >
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={post.user.avatar} className={`size-10 rounded-full border ${post.isAuto ? 'border-mystic-gold p-0.5' : 'border-mystic-primary/50'}`} alt={post.user.name} />
                <div>
                  <h3 className={`font-bold text-sm ${post.isAuto ? 'text-mystic-gold' : 'text-slate-200'}`}>{post.user.name}</h3>
                  <p className="text-[10px] text-slate-500">{post.user.sign} • Destino {post.user.destiny}</p>
                </div>
              </div>
              <MoreHorizontal size={20} className="text-slate-500 cursor-pointer" />
            </div>
            <div className="px-4 pb-3">
              <span className={`text-[8px] font-black px-2 py-0.5 rounded border uppercase tracking-widest mb-2 inline-block ${post.isAuto
                ? 'bg-mystic-gold/20 text-mystic-gold border-mystic-gold/40'
                : 'bg-mystic-primary/20 text-mystic-primary border-mystic-primary/40'
                }`}>
                {post.type}
              </span>
              <h4 className={`${post.isAuto ? 'text-mystic-gold' : 'text-slate-100'} font-bold text-lg mb-1`}>{post.title}</h4>
              <p className="text-slate-200 text-sm leading-relaxed mb-3">{post.content}</p>
            </div>
            {post.image && <img src={post.image} className="w-full aspect-video object-cover" alt="Post" />}
            <div className="p-4 flex items-center justify-between border-t border-mystic-primary/10">
              <div className="flex gap-4 text-slate-400">
                <button
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center gap-1 transition-colors ${likedPosts.includes(post.id) ? 'text-blue-500' : 'hover:text-blue-400'}`}
                >
                  <ThumbsUp size={16} fill={likedPosts.includes(post.id) ? "currentColor" : "none"} />
                  <span className="text-[10px]">{post.stats.likes + (likedPosts.includes(post.id) ? 1 : 0)}</span>
                </button>
                <button
                  onClick={() => handleHeart(post.id)}
                  className={`flex items-center gap-1 transition-colors ${heartedPosts.includes(post.id) ? 'text-red-500' : 'hover:text-red-400'}`}
                >
                  <Heart size={16} fill={heartedPosts.includes(post.id) ? "currentColor" : "none"} />
                  <span className="text-[10px]">{(post.stats.hearts || 0) + (heartedPosts.includes(post.id) ? 1 : 0)}</span>
                </button>
                <div className="flex items-center gap-1 cursor-pointer hover:text-mystic-gold"><MessageCircle size={16} /><span className="text-[10px]">{post.stats.comments}</span></div>
              </div>
              <Share2 size={16} className="text-slate-400 cursor-pointer hover:text-white" />
            </div>
          </article>
        ))}
      </div>
    </motion.div>
  );
};

const ReaderView = ({ book, onBack }: { book: any, onBack: () => void }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    if (pdfDoc) {
      renderPage(currentPage, pdfDoc);
    }
  }, [currentPage, pdfDoc]);

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
    if (currentPage < numPages) {
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
      className="fixed inset-0 z-[100] bg-mystic-bg flex flex-col pt-safe"
    >
      <header className="p-4 border-b border-mystic-primary/20 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 truncate">
          <button onClick={onBack} className="text-mystic-gold hover:scale-110 transition-transform flex-shrink-0">
            <ArrowLeft size={24} />
          </button>
          <h2 className="font-bold truncate text-sm">{book.title}</h2>
        </div>
        <div className="bg-mystic-primary/20 px-3 py-1 rounded-full border border-mystic-primary/30">
          <span className="text-[10px] font-bold text-mystic-gold tracking-tight whitespace-nowrap">
            {currentPage} / {numPages || '--'}
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 flex flex-col items-center bg-black/40 relative">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-mystic-bg/60 backdrop-blur-sm z-10">
            <div className="text-mystic-gold animate-spin mb-3">
              <Sparkles size={40} />
            </div>
            <p className="text-sm font-bold animate-pulse">Invocando as escrituras...</p>
          </div>
        )}

        {!book.url ? (
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
          <div className="w-full max-w-2xl bg-white/5 shadow-2xl rounded-lg overflow-hidden border border-white/10 ring-1 ring-white/5">
            <canvas ref={canvasRef} className="w-full h-auto block" />
          </div>
        )}
      </div>

      <footer className="p-4 border-t border-mystic-primary/20 flex justify-between items-center bg-mystic-bg/95 backdrop-blur-md">
        <button
          onClick={prevPage}
          disabled={currentPage === 1 || loading}
          className={`flex items-center gap-1 font-black text-[10px] uppercase tracking-widest transition-all px-4 py-2 rounded-xl
            ${currentPage === 1 || loading
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
          disabled={currentPage === numPages || loading}
          className={`flex items-center gap-1 font-black text-[10px] uppercase tracking-widest transition-all px-4 py-2 rounded-xl
            ${currentPage === numPages || loading
              ? 'opacity-30 text-slate-500'
              : 'text-mystic-gold hover:bg-mystic-primary/20 active:scale-95'}`}
        >
          Próximo <ArrowLeft size={14} className="mb-0.5 rotate-180" />
        </button>
      </footer>
    </motion.div>
  );
};

const LibraryView = ({ onSelectBook }: { onSelectBook: (book: any) => void }) => {
  const [search, setSearch] = useState('');
  const [fetchedBooks, setFetchedBooks] = useState<any[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(true);

  useEffect(() => {
    const fetchEbooks = async () => {
      try {
        console.log("DEBUG: Fetching ebooks from Supabase storage...");
        const { data: files, error } = await supabase.storage.from('Ebooks').list();

        if (error) {
          console.error('DEBUG: Supabase storage error listing Ebooks:', error);
          throw error;
        }

        console.log("DEBUG: Supabase storage returned files:", files);

        if (files && files.length > 0) {
          const pdfFiles = files.filter(f => f.name.toLowerCase().endsWith('.pdf'));
          console.log("DEBUG: PDF files found after filtering:", pdfFiles);

          const newBooks = await Promise.all(
            pdfFiles.map(async (file, index) => {
              const { data: { publicUrl } } = supabase.storage.from('Ebooks').getPublicUrl(file.name);
              console.log(`DEBUG: Found Ebook ${file.name}, generating cover from URL:`, publicUrl);
              const cover = await generatePdfCover(publicUrl);
              console.log(`DEBUG: Cover for ${file.name}:`, cover ? "Generated Successfully" : "Failed to Generate");

              return {
                id: `supa-${index}-${file.name}`,
                title: file.name.replace(/\.pdf$/i, ''),
                category: 'Ebook',
                image: cover || 'https://picsum.photos/seed/generic/300/450',
                url: publicUrl,
              };
            })
          );
          console.log("DEBUG: Final list of fetched books:", newBooks);
          setFetchedBooks(newBooks);
        } else {
          console.log("DEBUG: No files found in Ebooks bucket.");
        }
      } catch (err) {
        console.error('DEBUG: Failed to fetch ebooks:', err);
      } finally {
        setLoadingBooks(false);
      }
    };

    fetchEbooks();
  }, []);

  const allBooks = [...fetchedBooks, ...LIBRARY_BOOKS];
  const filteredBooks = allBooks.filter(b => b.title.toLowerCase().includes(search.toLowerCase()));

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
            <h1 className="text-xl font-black font-display tracking-tight">Biblioteca Mística</h1>
          </div>
          <button className="p-2 rounded-full bg-mystic-primary/20 text-mystic-gold hover:bg-mystic-primary/30 transition-colors">
            <Bell size={20} />
          </button>
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
            src="https://picsum.photos/seed/cosmos/800/400"
            className="absolute inset-0 w-full h-full object-cover"
            alt="Banner"
          />
          <div className="absolute bottom-0 left-0 p-6 z-20">
            <span className="text-mystic-gold text-[10px] font-black uppercase tracking-widest mb-2 block">Lançamento Premium</span>
            <h2 className="text-2xl font-bold text-white mb-2 leading-tight font-display">O Despertar da <br />Consciência Cósmica</h2>
            <button
              onClick={() => onSelectBook({ title: 'O Despertar da Consciência Cósmica' })}
              className="bg-mystic-primary text-white px-6 py-2 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-mystic-primary/80 transition-all active:scale-95"
            >
              <BookOpen size={14} /> Ler Agora
            </button>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold font-display">Ebooks em Destaque {loadingBooks && <Sparkles size={16} className="inline animate-spin text-mystic-gold ml-2" />}</h3>
          <span className="text-mystic-gold text-xs font-bold cursor-pointer hover:underline">Ver tudo</span>
        </div>
        <div className="flex overflow-x-auto gap-4 no-scrollbar">
          {filteredBooks.map((book) => (
            <div key={book.id} onClick={() => onSelectBook(book)} className="flex-none w-40 cursor-pointer">
              <div className="h-56 rounded-xl bg-mystic-card overflow-hidden mb-2 relative group border border-slate-800 shadow-xl">
                <img src={book.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={book.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div className="absolute bottom-2 left-2 right-2 text-[8px] text-mystic-gold font-black uppercase">{book.title}</div>
              </div>
              <p className="text-xs font-medium text-slate-200 truncate">{book.title}</p>
            </div>
          ))}
          {filteredBooks.length === 0 && <p className="text-xs text-slate-500 italic">Nenhum livro encontrado...</p>}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold font-display">Sua Estante</h3>
          <span className="text-mystic-gold text-xs font-bold">Ver tudo</span>
        </div>
        <div className="flex overflow-x-auto gap-4 no-scrollbar">
          {SHELF_BOOKS.map((book) => (
            <div key={book.id} onClick={() => onSelectBook(book)} className="flex-none w-64 cursor-pointer">
              <div className="bg-mystic-card p-4 rounded-2xl flex gap-4 border border-slate-800 shadow-xl">
                <div className="w-20 h-28 flex-none rounded-lg overflow-hidden border border-slate-700">
                  <img src={book.image} className="w-full h-full object-cover" alt={book.title} />
                </div>
                <div className="flex flex-col justify-between py-1 flex-1">
                  <div>
                    <h4 className="font-bold text-white text-xs line-clamp-2">{book.title}</h4>
                    <p className="text-[8px] text-slate-500 mt-1 uppercase font-bold">Continuar lendo...</p>
                  </div>
                  <div className="w-full">
                    <div className="flex justify-between text-[8px] text-slate-400 mb-1">
                      <span>Progresso</span>
                      <span>{book.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-mystic-gold shadow-[0_0_8px_rgba(212,175,55,0.4)]"
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
          {LATEST_RELEASES.map((rel) => (
            <div key={rel.id} className="flex-none w-24 flex flex-col items-center">
              <div className="size-24 rounded-full border-2 border-mystic-primary/40 p-1 ring-4 ring-mystic-primary/5 overflow-hidden mb-2">
                <img src={rel.image} className="size-full rounded-full object-cover" alt={rel.title} />
              </div>
              <p className="text-center text-[8px] font-black text-mystic-gold uppercase tracking-tighter">{rel.title}</p>
            </div>
          ))}
        </div>
      </section>

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

const ProfileView = ({ onBack }: { onBack: () => void }) => {
  const { signOut, user } = useAuth();
  const [uploading, setUploading] = useState(false);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Você deve selecionar uma imagem para fazer upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user?.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      if (updateError) {
        throw updateError;
      }

      // Small delay to ensure the avatar visually updates if the session subscription doesn't magically fire the user change update deep inside nested state immediately
      window.location.reload()

    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

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
        <div className="flex gap-3">
          <button
            onClick={() => alert('Configurações em breve!')}
            className="text-mystic-gold hover:rotate-90 transition-transform"
          >
            <Settings size={24} />
          </button>
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
        <div className="text-center">
          <h3 className="text-2xl font-bold font-display">{user?.user_metadata?.full_name || 'Místico Anônimo'}</h3>
          <p className="text-mystic-gold/80 text-sm font-medium">{user?.email}</p>
          <div className="mt-3 px-4 py-1 bg-mystic-primary/20 rounded-full border border-mystic-primary/30 inline-block">
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
          { label: 'Informações Pessoais', icon: User },
          { label: 'Notificações Astrais', icon: Bell },
          { label: 'Privacidade & Dados', icon: Zap },
          { label: 'Ajuda & Suporte', icon: Sparkles },
        ].map((opt) => (
          <button
            key={opt.label}
            onClick={() => alert(`${opt.label} em breve!`)}
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

      <button
        onClick={async () => {
          if (confirm('Deseja realmente sair?')) {
            await signOut();
          }
        }}
        className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border border-red-500/30 text-red-500 font-bold text-sm mt-4 hover:bg-red-500/10 transition-colors"
      >
        <LogOut size={18} /> Encerrar Sessão
      </button>
    </motion.div>
  );
};

// --- Main App ---

function App() {
  const { session, loading } = useAuth();
  const [view, setView] = useState<View>('home');
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [posts, setPosts] = useState(COMMUNITY_POSTS);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const handleAddPost = (content: string) => {
    const newPost = {
      id: Date.now(),
      user: { name: session?.user?.user_metadata?.full_name || 'Buscador Solitário', sign: 'Mistério', destiny: 0, avatar: session?.user?.user_metadata?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=mystic' },
      content,
      type: 'Manifestação',
      title: 'Nova Reflexão',
      stats: { likes: 0, hearts: 0, diamonds: 0, stars: 0, comments: 0, fire: 0 },
      image: null,
      isAuto: false
    };
    setPosts([newPost, ...posts]);
  };

  if (loading) {
    return <div className="min-h-screen bg-mystic-bg text-mystic-gold flex items-center justify-center font-display text-xl animate-pulse">Lendo as estrelas...</div>;
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-mystic-bg text-slate-100 font-sans selection:bg-mystic-gold selection:text-mystic-bg">
      <main className="max-w-md mx-auto min-h-screen relative overflow-hidden">
        <AnimatePresence mode="wait">
          {view === 'home' && <HomeView key="home" setView={setView} onOpenNotifications={() => setNotificationsOpen(true)} user={session?.user} />}
          {view === 'map' && <MapView key="map" />}
          {view === 'chat' && <ChatView key="chat" />}
          {view === 'community' && <CommunityView key="community" posts={posts} onAddPost={handleAddPost} />}
          {view === 'library' && <LibraryView key="library" onSelectBook={setSelectedBook} />}
          {view === 'profile' && <ProfileView key="profile" onBack={() => setView('home')} />}
        </AnimatePresence>

        <AnimatePresence>
          {selectedBook && (
            <ReaderView book={selectedBook} onBack={() => setSelectedBook(null)} />
          )}
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
              <div className="space-y-4">
                <div className="p-4 bg-mystic-primary/10 rounded-xl border border-mystic-primary/20">
                  <p className="text-xs font-bold text-mystic-gold mb-1">AGORA</p>
                  <p className="text-sm">A Lua entrou em sua fase Crescente. É hora de agir!</p>
                </div>
                <div className="p-4 bg-mystic-primary/10 rounded-xl border border-mystic-primary/20 opacity-60">
                  <p className="text-xs font-bold text-slate-500 mb-1">HÁ 2 HORAS</p>
                  <p className="text-sm">Maya Silva curtiu sua manifestação.</p>
                </div>
              </div>
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
