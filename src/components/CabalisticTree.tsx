import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, DollarSign, Target, Sparkles, Eye, Crown } from 'lucide-react';
import {
  generateFullCabalisticMap,
  getAllSefirot,
  getPathConnections,
  getStateColor,
  getStateLabel,
  Sefira,
  SefiraData
} from '../lib/cabalisticMap';

const EnergyParticle = ({ startX, startY, endX, endY, color, delay }: { 
  startX: number; startY: number; endX: number; endY: number; 
  color: string; delay: number;
}) => {
  return (
    <motion.circle
      r={1.5}
      fill={color}
      style={{ filter: `drop-shadow(0 0 4px ${color})` }}
      initial={{ cx: startX, cy: startY, opacity: 0 }}
      animate={{
        cx: [startX, (startX + endX) / 2, endX],
        cy: [startY, (startY + endY) / 2, endY],
        opacity: [0, 1, 1, 0],
        scale: [0.5, 1.5, 0.5]
      }}
      transition={{
        duration: 2.5,
        delay: delay,
        repeat: Infinity,
        repeatDelay: Math.random() * 2 + 1,
        ease: "easeInOut"
      }}
    />
  );
};

const PathEnergyFlow = ({ sefA, sefB, isStrong, color }: {
  sefA: { x: number; y: number };
  sefB: { x: number; y: number };
  isStrong: boolean;
  color: string;
}) => {
  const particleCount = isStrong ? 3 : 1;
  
  return (
    <>
      {Array.from({ length: particleCount }).map((_, i) => (
        <EnergyParticle
          key={`${i}-${Math.random()}`}
          startX={sefA.x}
          startY={sefA.y}
          endX={sefB.x}
          endY={sefB.y}
          color={color}
          delay={i * 0.8}
        />
      ))}
    </>
  );
};

const PulsingGlow = ({ sefira, data }: { sefira: Sefira; data: SefiraData }) => {
  const stateColor = getStateColor(data.state);
  
  return (
    <motion.circle
      cx={sefira.position.x}
      cy={sefira.position.y}
      r={data.state === 'forte' ? 14 : 11}
      fill="none"
      stroke={stateColor}
      strokeWidth={0.5}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{
        opacity: [0.2, 0.5, 0.2],
        scale: [1, 1.3, 1],
      }}
      transition={{
        duration: data.state === 'forte' ? 2 : 3,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  );
};

const SefiraModal = ({ sefira, data, onClose }: { sefira: Sefira; data: SefiraData; onClose: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-2xl flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: '100%', opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        className="bg-gradient-to-b sm:bg-gradient-to-br from-[#0a0f1a] via-[#0d1525] to-[#080c18] w-full sm:max-w-lg sm:rounded-3xl border border-mystic-gold/30 overflow-hidden max-h-[90vh] rounded-t-[2.5rem]"
        onClick={e => e.stopPropagation()}
      >
        <motion.div 
          className="relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div 
            className="absolute inset-0 opacity-40"
            style={{ 
              background: `radial-gradient(circle at 50% 0%, ${sefira.glowColor}60 0%, transparent 70%)` 
            }}
            animate={{
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <div className="relative p-6 pb-4">
            <motion.button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all active:scale-90"
              whileTap={{ scale: 0.9 }}
            >
              <X size={20} className="text-white" />
            </motion.button>
            
            <motion.div 
              className="flex items-center gap-4 mb-4"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              <motion.div 
                className="size-16 rounded-2xl flex items-center justify-center border-2"
                style={{ 
                  borderColor: sefira.glowColor,
                  boxShadow: `0 0 40px ${sefira.glowColor}60, 0 0 80px ${sefira.glowColor}30, inset 0 0 30px ${sefira.glowColor}30`,
                  background: `linear-gradient(135deg, ${sefira.color}30, ${sefira.glowColor}15)`
                }}
                animate={{
                  boxShadow: [
                    `0 0 40px ${sefira.glowColor}60, 0 0 80px ${sefira.glowColor}30, inset 0 0 30px ${sefira.glowColor}30`,
                    `0 0 50px ${sefira.glowColor}80, 0 0 100px ${sefira.glowColor}40, inset 0 0 40px ${sefira.glowColor}40`,
                    `0 0 40px ${sefira.glowColor}60, 0 0 80px ${sefira.glowColor}30, inset 0 0 30px ${sefira.glowColor}30`
                  ]
                }}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                <span 
                  className="text-2xl font-black text-white" 
                  style={{ textShadow: `0 0 25px ${sefira.glowColor}` }}
                >
                  {data.number}
                </span>
              </motion.div>
              <div>
                <p className="text-[10px] text-mystic-gold/60 uppercase tracking-[0.3em] font-bold">Sefirá</p>
                <h2 className="text-2xl font-black font-display text-white">{sefira.name}</h2>
                <p className="text-sm text-mystic-gold/80 italic">{sefira.meaning}</p>
              </div>
            </motion.div>
            
            <motion.div 
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ 
                background: `${getStateColor(data.state)}15`, 
                color: getStateColor(data.state),
                border: `1px solid ${getStateColor(data.state)}50`
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles size={12} fill="currentColor" />
              </motion.div>
              {getStateLabel(data.state)}
            </motion.div>
          </div>
        </motion.div>
        
        <motion.div 
          className="px-6 pb-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          <motion.p 
            className="text-sm text-slate-300 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {data.description}
          </motion.p>
          
          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            <h4 className="text-xs font-black uppercase tracking-widest text-mystic-gold flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Eye size={14} />
              </motion.div>
              Impacto na Vida
            </h4>
            
            <div className="space-y-2">
              {[
                { key: 'amor', icon: Heart, color: '#ec4899', label: 'Amor', text: data.impact.amor },
                { key: 'dinheiro', icon: DollarSign, color: '#22c55e', label: 'Dinheiro', text: data.impact.dinheiro },
                { key: 'proposito', icon: Target, color: '#a855f7', label: 'Propósito', text: data.impact.proposito }
              ].map((item, i) => (
                <motion.div 
                  key={item.key}
                  className="flex items-start gap-3 p-3 rounded-xl border"
                  style={{ 
                    background: `${item.color}08`, 
                    borderColor: `${item.color}20` 
                  }}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  whileHover={{ scale: 1.02, x: 5 }}
                >
                  <motion.div 
                    className="mt-0.5"
                    style={{ color: item.color }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <item.icon size={18} fill="currentColor" />
                  </motion.div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: item.color }}>{item.label}</p>
                    <p className="text-xs text-slate-300 leading-relaxed">{item.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
          
          <motion.div 
            className="pt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <h4 className="text-xs font-black uppercase tracking-widest text-mystic-gold flex items-center gap-2 mb-3">
              <motion.div
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Sparkles size={14} />
              </motion.div>
              Conselho Personalizado
            </h4>
            <motion.div 
              className="p-4 rounded-xl bg-gradient-to-r from-mystic-gold/15 to-transparent border border-mystic-gold/30"
              animate={{
                borderColor: ['rgba(212,175,55,0.3)', 'rgba(212,175,55,0.5)', 'rgba(212,175,55,0.3)']
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <p className="text-sm text-slate-200 leading-relaxed italic">"{data.advice}"</p>
            </motion.div>
          </motion.div>
          
          <motion.div 
            className="pt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
          >
            <h4 className="text-xs font-black uppercase tracking-widest text-mystic-gold/60 mb-3">Qualidades da Sefirá</h4>
            <div className="flex flex-wrap gap-2">
              {sefira.qualities.map((q, i) => (
                <motion.span 
                  key={i}
                  className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-slate-300"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.6 + i * 0.05 }}
                  whileHover={{ scale: 1.05, borderColor: 'rgba(212,175,55,0.5)' }}
                >
                  {q}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

const Particles = () => {
  const particles = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5,
      duration: Math.random() * 25 + 15,
      delay: Math.random() * 10,
      drift: (Math.random() - 0.5) * 20
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: `radial-gradient(circle, rgba(212,175,55,0.6) 0%, transparent 70%)`,
            boxShadow: `0 0 ${p.size * 2}px rgba(212,175,55,0.3)`
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, p.drift, 0],
            opacity: [0.2, 0.7, 0.2],
            scale: [0.8, 1.2, 0.8]
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
};

const SefiraNode = ({ 
  sefira, 
  data, 
  isStrong, 
  onClick,
  delay
}: { 
  sefira: Sefira; 
  data: SefiraData;
  isStrong: boolean;
  onClick: () => void;
  delay: number;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const stateColor = getStateColor(data.state);
  
  return (
    <motion.g
      initial={{ scale: 0, opacity: 0, y: -20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ 
        type: 'spring', 
        damping: 12,
        stiffness: 100,
        delay: delay * 0.08
      }}
      className="cursor-pointer"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
      onPointerDown={() => setIsPressed(true)}
      onPointerUp={() => setIsPressed(false)}
      >
        <motion.circle
          cx={sefira.position.x}
          cy={sefira.position.y}
          r={isPressed ? 10 : isHovered ? 9 : 7}
          fill={`url(#${sefira.id}Grad)`}
          stroke={isStrong ? sefira.glowColor : '#D4AF37'}
          strokeWidth={isStrong ? 2.5 : 1.5}
          animate={{ 
            filter: [
              `drop-shadow(0 0 ${isStrong ? 12 : 5}px ${sefira.glowColor})`,
              `drop-shadow(0 0 ${isStrong ? 18 : 8}px ${sefira.glowColor})`,
              `drop-shadow(0 0 ${isStrong ? 12 : 5}px ${sefira.glowColor})`
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ transition: 'r 0.2s ease' }}
        />
        
        {data.state === 'forte' && (
          <motion.circle
            cx={sefira.position.x}
            cy={sefira.position.y}
            r={12}
            fill="none"
            stroke={stateColor}
            strokeWidth={0.8}
            animate={{
              opacity: [0.3, 0.7, 0.3],
              r: [12, 16, 12]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
        
        <motion.circle
          cx={sefira.position.x}
          cy={sefira.position.y}
          r={4.5}
          fill="none"
          stroke={stateColor}
          strokeWidth={0.6}
          strokeDasharray={data.state === 'forte' ? '0' : '1.5 1.5'}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        
        <text
          x={sefira.position.x}
          y={sefira.position.y}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={isHovered || isPressed ? '5' : '4.5'}
          fontWeight="900"
          fill="white"
          fontFamily="serif"
          style={{ 
            filter: `drop-shadow(0 0 8px ${sefira.glowColor})`,
            transition: 'font-size 0.15s ease'
          }}
        >
          {data.number}
        </text>
        
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay * 0.08 + 0.3 }}
        >
          <rect
            x={sefira.position.x - 16}
            y={sefira.position.y + 9}
            width={32}
            height={9}
            rx={4}
            fill="rgba(0,0,0,0.7)"
            opacity={0.85}
          />
          <text
            x={sefira.position.x}
            y={sefira.position.y + 15}
            textAnchor="middle"
            fontSize="2.5"
            fontWeight="bold"
            fill="#D4AF37"
            fontFamily="sans-serif"
          >
            {sefira.name}
          </text>
        </motion.g>
        
        {isPressed && (
          <motion.circle
            cx={sefira.position.x}
            cy={sefira.position.y}
            r={12}
            fill="none"
            stroke={sefira.glowColor}
            strokeWidth={1}
            initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: 0, scale: 2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
        )}
      </motion.g>
  );
};

const CentralOrb = () => {
  return (
    <motion.g>
      <motion.circle
        cx={50}
        cy={50}
        r={20}
        fill="url(#orbGrad)"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.15, scale: 1 }}
        transition={{ delay: 0.5, duration: 1.5 }}
      />
      <motion.circle
        cx={50}
        cy={50}
        r={20}
        fill="none"
        stroke="#D4AF37"
        strokeWidth={0.3}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.3 }}
        transition={{ delay: 0.8, duration: 2 }}
      />
      <motion.circle
        cx={50}
        cy={50}
        r={15}
        fill="none"
        stroke="#f9d423"
        strokeWidth={0.2}
        animate={{ 
          rotate: 360,
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '50px 50px' }}
      />
      <motion.circle
        cx={50}
        cy={50}
        r={25}
        fill="none"
        stroke="#D4AF37"
        strokeWidth={0.15}
        strokeDasharray="2 4"
        animate={{ 
          rotate: -360,
          opacity: [0.1, 0.3, 0.1]
        }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '50px 50px' }}
      />
    </motion.g>
  );
};

export const CabalisticTree = ({ user, onClose }: { user: any; onClose: () => void }) => {
  const fullName = user?.user_metadata?.full_name || 'Usuário';
  const birthDate = user?.user_metadata?.birth_date || '1990-01-01';
  
  const [selectedSefira, setSelectedSefira] = useState<{ sefira: Sefira; data: SefiraData } | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const mapData = useMemo(() => generateFullCabalisticMap(fullName, birthDate), [fullName, birthDate]);
  const sefirot = useMemo(() => getAllSefirot(), []);
  const pathConnections = useMemo(() => getPathConnections(), []);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);
  
  const isStrongPath = useCallback((a: string, b: string) => {
    return mapData.caminhosFortes.some(p => 
      (p === `${a}-${b}`) || (p === `${b}-${a}`)
    );
  }, [mapData.caminhosFortes]);
  
  const getPathColor = (a: string, b: string): string => {
    if (isStrongPath(a, b)) {
      const sef1 = sefirot.find(s => s.id === a);
      return sef1?.glowColor || '#f9d423';
    }
    return '#D4AF37';
  };

  return (
    <motion.div 
      className="fixed inset-0 z-[90] bg-[#0a192f] flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(212,175,55,0.08) 0%, transparent 60%)'
        }}
      />
      
      <Particles />
      
      <style>{`
        @keyframes pathGlow {
          0%, 100% { stroke-opacity: 0.4; }
          50% { stroke-opacity: 0.9; }
        }
        .tree-scroll::-webkit-scrollbar { width: 3px; }
        .tree-scroll::-webkit-scrollbar-track { background: transparent; }
        .tree-scroll::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.4); border-radius: 4px; }
      `}</style>
      
      <motion.header 
        className="relative z-50 p-4 flex items-center justify-between shrink-0"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <motion.button
          onClick={onClose}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/10 transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <X size={22} className="text-white" />
        </motion.button>
        
        <motion.div 
          className="text-center"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.h1 
            className="text-lg font-black font-display text-mystic-gold tracking-wider"
            animate={{ 
              textShadow: [
                '0 0 15px rgba(212,175,55,0.5)',
                '0 0 30px rgba(212,175,55,0.8)',
                '0 0 15px rgba(212,175,55,0.5)'
              ]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            ÁRVORE DA VIDA
          </motion.h1>
          <p className="text-[9px] text-slate-500 uppercase tracking-[0.2em]">Mapa Cabalístico</p>
        </motion.div>
        
        <div className="size-10" />
      </motion.header>
      
      <div className="flex-1 overflow-y-auto tree-scroll">
        <div className="px-4 pt-2">
          <motion.svg
            viewBox="0 0 100 160"
            className="w-full"
            preserveAspectRatio="xMidYMid meet"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            <defs>
            {sefirot.map(s => (
              <radialGradient key={`${s.id}Grad`} id={`${s.id}Grad`} cx="50%" cy="30%" r="70%">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.3" />
                <stop offset="100%" stopColor="#0d0d1a" stopOpacity="1" />
              </radialGradient>
            ))}
            
            <radialGradient id="orbGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
            </radialGradient>
            
            <filter id="glow">
              <feGaussianBlur stdDeviation="0.8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            
            <filter id="strongGlow">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            
            <linearGradient id="treeOutline" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#f9d423" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.5" />
            </linearGradient>
          </defs>
          
          <motion.rect 
            x="0" y="0" width="100" height="145" 
            fill="url(#treeOutline)" 
            opacity={0.02}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.02 }}
            transition={{ delay: 0.5 }}
          />
          
          <CentralOrb />
          
          {pathConnections.map(([a, b], i) => {
            const sefA = sefirot.find(s => s.id === a);
            const sefB = sefirot.find(s => s.id === b);
            if (!sefA || !sefB) return null;
            
            const strong = isStrongPath(a, b);
            
            return (
              <React.Fragment key={`path-${a}-${b}`}>
                <motion.line
                  x1={sefA.position.x}
                  y1={sefA.position.y}
                  x2={sefB.position.x}
                  y2={sefB.position.y}
                  stroke={getPathColor(a, b)}
                  strokeWidth={strong ? 1 : 0.6}
                  strokeOpacity={strong ? 0.6 : 0.25}
                  filter={strong ? 'url(#strongGlow)' : 'url(#glow)'}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ 
                    pathLength: 1, 
                    opacity: strong ? [0.5, 0.8, 0.5] : 0.25 
                  }}
                  transition={{ 
                    duration: 1.5, 
                    delay: 0.5 + i * 0.04,
                    opacity: { duration: 1, delay: 0.5 + i * 0.04 }
                  }}
                  style={{
                    strokeDasharray: strong ? 'none' : '1 2',
                    animation: strong ? 'pathGlow 2.5s ease-in-out infinite' : 'none'
                  }}
                />
                
                {isLoaded && (
                  <PathEnergyFlow
                    sefA={sefA.position}
                    sefB={sefB.position}
                    isStrong={strong}
                    color={getPathColor(a, b)}
                  />
                )}
              </React.Fragment>
            );
          })}
          
          {sefirot.map((sefira, i) => (
            <React.Fragment key={`node-${sefira.id}`}>
              {isLoaded && (
                <PulsingGlow sefira={sefira} data={mapData.sefirotDetalhado[sefira.id]} />
              )}
              <SefiraNode
                sefira={sefira}
                data={mapData.sefirotDetalhado[sefira.id]}
                isStrong={mapData.caminhosFortes.some(p => p.includes(sefira.id))}
                onClick={() => setSelectedSefira({ sefira, data: mapData.sefirotDetalhado[sefira.id] })}
                delay={i}
              />
            </React.Fragment>
          ))}
        </motion.svg>
        
        <motion.div 
          className="mt-12 space-y-6"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Destino', val: mapData.destino, icon: Crown },
              { label: 'Alma', val: mapData.alma, icon: Heart },
              { label: 'Caminho', val: mapData.caminhoDeVida, icon: Target },
            ].map((n, i) => (
              <motion.div 
                key={n.label}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-mystic-gold/20 backdrop-blur-xl"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.9 + i * 0.1, type: 'spring' }}
                whileHover={{ scale: 1.05, borderColor: 'rgba(212,175,55,0.4)', backgroundColor: 'rgba(255,255,255,0.08)' }}
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    filter: ['drop-shadow(0 0 4px rgba(212,175,55,0.4))', 'drop-shadow(0 0 10px rgba(249,212,35,0.7))', 'drop-shadow(0 0 4px rgba(212,175,55,0.4))']
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.3 }}
                  className="mb-1"
                >
                  <n.icon size={20} className="text-mystic-gold" fill="currentColor" />
                </motion.div>
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{n.label}</p>
                <p className="text-2xl font-black text-white">{n.val}</p>
              </motion.div>
            ))}
          </div>
          
          <div className="space-y-4">
            <motion.div 
              className="flex items-center justify-center gap-6 text-[10px] text-slate-500 font-bold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#76FF03', boxShadow: '0 0 10px #76FF03' }} />
                <span>Caminhos Fortes</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                <div className="w-2.5 h-2.5 rounded-full bg-mystic-gold" style={{ boxShadow: '0 0 8px rgba(212,175,55,0.5)' }} />
                <span>Padrão</span>
              </div>
            </motion.div>
            
            <motion.p 
              className="text-center text-xs text-slate-500 italic"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3 }}
            >
              Toque em qualquer sefirá para ver detalhes e orientações
            </motion.p>
          </div>
        </motion.div>
        </div>
      </div>
      
      <AnimatePresence>
        {selectedSefira && (
          <SefiraModal
            sefira={selectedSefira.sefira}
            data={selectedSefira.data}
            onClose={() => setSelectedSefira(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
