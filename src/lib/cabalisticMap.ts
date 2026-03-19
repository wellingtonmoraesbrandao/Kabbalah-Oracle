export interface Sefira {
  id: string;
  name: string;
  hebrew: string;
  meaning: string;
  position: { x: number; y: number };
  connections: string[];
  qualities: string[];
  color: string;
  glowColor: string;
}

export interface SefiraData {
  number: number;
  state: 'equilibrado' | 'forte' | 'desequilibrado';
  description: string;
  impact: {
    amor: string;
    dinheiro: string;
    proposito: string;
  };
  advice: string;
}

export interface UserCabalisticMap {
  destino: number;
  alma: number;
  personalidade: number;
  expressao: number;
  caminhoDeVida: number;
  anoPessoal: number;
  ciclos: {
    primeiro: number;
    segundo: number;
    terceiro: number;
  };
  sefirot: Record<string, number>;
  sefirotDetalhado: Record<string, SefiraData>;
  caminhosFortes: string[];
}

export interface CabalisticResult {
  destino: number;
  alma: number;
  personalidade: number;
  expressao: number;
  caminhoDeVida: number;
  anoPessoal: number;
  sefirot: Record<string, number>;
}

const SEFIROT: Sefira[] = [
  {
    id: 'keter',
    name: 'Keter',
    hebrew: 'כתר',
    meaning: 'Coroa',
    position: { x: 50, y: 5 },
    connections: ['chokmah', 'binah'],
    qualities: ['Vontade Divina', 'Propósito Superior', 'Iluminação'],
    color: '#D4AF37',
    glowColor: '#f9d423'
  },
  {
    id: 'chokmah',
    name: 'Chokmah',
    hebrew: 'חכמה',
    meaning: 'Sabedoria',
    position: { x: 75, y: 22 },
    connections: ['keter', 'binah', 'chesed', 'gevurah'],
    qualities: ['Força Creativa', 'Impulso Divino', 'Iniciativa'],
    color: '#3498DB',
    glowColor: '#00BCD4'
  },
  {
    id: 'binah',
    name: 'Binah',
    hebrew: 'בינה',
    meaning: 'Compreensão',
    position: { x: 25, y: 22 },
    connections: ['keter', 'chokmah', 'chesed', 'gevurah'],
    qualities: ['Discernimento', 'Estrutura', 'Análise Profunda'],
    color: '#9B59B6',
    glowColor: '#E040FB'
  },
  {
    id: 'chesed',
    name: 'Chesed',
    hebrew: 'חסד',
    meaning: 'Misericórdia',
    position: { x: 75, y: 48 },
    connections: ['chokmah', 'binah', 'tiferet', 'gevurah'],
    qualities: ['Compaixão', 'Generosidade', 'Expansão'],
    color: '#2E7D32',
    glowColor: '#4CAF50'
  },
  {
    id: 'gevurah',
    name: 'Gevurah',
    hebrew: 'גבורה',
    meaning: 'Força',
    position: { x: 25, y: 48 },
    connections: ['chokmah', 'binah', 'tiferet', 'chesed'],
    qualities: ['Poder', 'Julzo', 'Disciplina'],
    color: '#E53935',
    glowColor: '#FF5252'
  },
  {
    id: 'tiferet',
    name: 'Tiferet',
    hebrew: 'תפארת',
    meaning: 'Beleza',
    position: { x: 50, y: 65 },
    connections: ['chesed', 'gevurah', 'netzach', 'hod', 'yesod', 'keter'],
    qualities: ['Harmonia', 'Equilíbrio', 'Integração'],
    color: '#D4AF37',
    glowColor: '#FFD700'
  },
  {
    id: 'netzach',
    name: 'Netzach',
    hebrew: 'נצח',
    meaning: 'Vitória',
    position: { x: 75, y: 92 },
    connections: ['tiferet', 'hod', 'yesod', 'chesed'],
    qualities: ['Persistência', 'Emoções', 'Ambição'],
    color: '#76FF03',
    glowColor: '#CCFF90'
  },
  {
    id: 'hod',
    name: 'Hod',
    hebrew: 'הוד',
    meaning: 'Glória',
    position: { x: 25, y: 92 },
    connections: ['tiferet', 'netzach', 'yesod', 'gevurah'],
    qualities: ['Humildade', 'Comunicação', 'Estudo'],
    color: '#FF9800',
    glowColor: '#FFAB40'
  },
  {
    id: 'yesod',
    name: 'Yesod',
    hebrew: 'יסוד',
    meaning: 'Fundação',
    position: { x: 50, y: 108 },
    connections: ['tiferet', 'netzach', 'hod', 'malkuth'],
    qualities: ['Conexão', 'Base', 'Subconsciente'],
    color: '#9C27B0',
    glowColor: '#E040FB'
  },
  {
    id: 'malkuth',
    name: 'Malkuth',
    hebrew: 'מלכות',
    meaning: 'Reino',
    position: { x: 50, y: 138 },
    connections: ['yesod', 'netzach', 'hod'],
    qualities: ['Realidade', 'Ação Prática', 'Manifestação'],
    color: '#795548',
    glowColor: '#8D6E63'
  }
];

const PATH_CONNECTIONS = [
  ['keter', 'chokmah'], ['keter', 'binah'], ['chokmah', 'binah'],
  ['chokmah', 'chesed'], ['chokmah', 'gevurah'], ['binah', 'chesed'],
  ['binah', 'gevurah'], ['chesed', 'gevurah'], ['chesed', 'tiferet'],
  ['gevurah', 'tiferet'], ['tiferet', 'netzach'], ['tiferet', 'hod'],
  ['netzach', 'hod'], ['netzach', 'yesod'], ['hod', 'yesod'],
  ['netzach', 'malkuth'], ['hod', 'malkuth'], ['yesod', 'malkuth'],
  ['chesed', 'netzach'], ['gevurah', 'hod'], ['tiferet', 'yesod'],
  ['keter', 'tiferet']
];

const SEFIRA_MEANINGS: Record<string, { description: string; impact: { amor: string; dinheiro: string; proposito: string }; advice: string }> = {
  keter: {
    description: 'Keter representa a Coroa Divina - o ponto de conexão com o infinito. Simboliza sua capacidade de transcender o ordinário e acessar wisdom superiores.',
    impact: {
      amor: 'Você atrai relacionamentos que elevam sua consciência espiritual. Conexões profundas baseadas em propósito comum.',
      dinheiro: 'Prosperidade fluirá quando você alinhar seus desejos com seu propósito superior. Riqueza é um estado de consciência.',
      proposito: 'Você está aqui para viver em sincronia com a vontade divina. Seu destino é ser um canal de luz para o mundo.'
    },
    advice: 'Pratique meditação diaria. Permita que a vontade divina se manifeste através de você. Solte a necessidade de controlar os resultados.'
  },
  chokmah: {
    description: 'Chokmah é a Sabedoria Primordial - o impulso creativo que dá início a todas as coisas. Representa sua capacidade de criar e inovar.',
    impact: {
      amor: 'Você traz paixão e intensidade aos relacionamentos. Sua energia criativa atrai parceiros que valorizam a originalidade.',
      dinheiro: 'Você tem potencial para criar riqueza através de ideias inovadoras. Novos empreendimentos podem ser muito bem-sucedidos.',
      proposito: 'Você está aqui para inovar e inspirar. Sua sabedoria prática transforma visões em realidade.'
    },
    advice: 'Confie em sua intuição criativa. Não tenha medo de iniciar novos projetos. Sua força está na capacidade de visualizar o que ainda não existe.'
  },
  binah: {
    description: 'Binah representa a Compreensão e a Análise. É a energia que estrutura, organiza e dá forma às ideias criativas.',
    impact: {
      amor: 'Você busca profundidade intelectual nos relacionamentos. Parcerias questimulem seu crescimento mental são essenciais.',
      dinheiro: 'Você tem aptidão para finanças e análise de investimentos. Planeamento cuidadoso traz segurança financeira.',
      proposito: 'Você está aqui para trazer clareza e discernimento. Sua sabedoria estruturada ajuda outros a entender complexidades.'
    },
    advice: 'Desenvolva sua capacidade de análise sem julgamento. Busque conhecimento através de estudo e contemplação. A paciência traz insights profundos.'
  },
  chesed: {
    description: 'Chesed é a Misericórdia Divina e a Compaixão Infinita. Representa a energia de dar sem esperar nada em retorno.',
    impact: {
      amor: 'Você é naturalmente carinhoso e generoso em relacionamentos. Seu amor é incondicional e acolhedor.',
      dinheiro: 'A prosperidade vem através da generosidade. Quando você dá, o universo devolve multiplicado.',
      proposito: 'Você está aqui para ser um exemplo de compaixão. Seu papel é curar através do amor incondicional.'
    },
    advice: 'Permita-se receber tanto quanto dá. Equilibre generosidade com limites saudáveis. Seu coração compassivo é seu maior dom.'
  },
  gevurah: {
    description: 'Gevurah representa a Força Divina e o Julzo. É a energia que estabelece limites, disciplina e ordem.',
    impact: {
      amor: 'Você traz estabilidade e compromisso aos relacionamentos. Parcerias duradouras são marcadas por lealdade.',
      dinheiro: 'Você tem potencial para acumular riqueza através de trabalho disciplinado. Gestão prudente dos recursos.',
      proposito: 'Você está aqui para estabelecer justiça e ordem. Sua força interior protege e sustenta outros.'
    },
    advice: 'Use sua força com sabedoria e compaixão. Limites são formas de amor. Equilibre disciplina com flexibilidade.'
  },
  tiferet: {
    description: 'Tiferet é a Beleza e a Harmonia - o centro da Árvore da Vida. Integra todas as outras sefirot em equilíbrio perfeito.',
    impact: {
      amor: 'Você busca harmonía e equilíbrio emocional. Relacionamentos maduros e completos são seu caminho natural.',
      dinheiro: 'A abundância flui quando você está em equilíbrio. Você atrai prosperidade através da integridade.',
      proposito: 'Você está aqui para ser um catalisador de transformação. Sua presença harmoniza e eleva tudo ao seu redor.'
    },
    advice: 'Busque equilíbrio entre dar e receber, ação e contemplação. Sua beleza interior é refletida em todas as áreas da vida.'
  },
  netzach: {
    description: 'Netzach representa a Vitória Eterna e a Persistência. É a energia que garante que você alcance seus objetivos.',
    impact: {
      amor: 'Você traz entusiasmo e paixão aos relacionamentos. Sua energia emocional intensity attracts partners who match your vitality.',
      dinheiro: 'Você tem potencial para成功了 através de perseverança. Projetos de longo prazo são particularmente favorecidos.',
      proposito: 'Você está aqui para vencer desafios e inspirar outros a persistir. Sua determinação é lendária.'
    },
    advice: 'Mantenha seus objetivos à vista, mas seja flexível nos métodos. Pausas estratégicas não são fraqueza. Celebre pequenas vitórias.'
  },
  hod: {
    description: 'Hod representa a Glória e a Humildade. É a energia da comunicação, estudo e expressão espiritual.',
    impact: {
      amor: 'Você se comunica com clareza e empatia. Relacionamentos florescem através de diálogo aberto e honesto.',
      dinheiro: 'Você tem talento para vendas, marketing e comunicação. Carreira em áreas que requerem articulação.',
      proposito: 'Você está aqui para ensinar e guiar através da palavra. Sua comunicação ilumina caminhos para outros.'
    },
    advice: 'Expresse suas ideias com confiança e humildade. O estudo contínuo expande sua sabedoria. Sua voz é uma ferramenta poderosa.'
  },
  yesod: {
    description: 'Yesod é a Fundação do mundo. Representa o inconsciente, a memória cósmica e a conexão entre o visível e o invisível.',
    impact: {
      amor: 'Você tem forte intuição sobre parceiros e relacionamentos. Sonhos e pressentimentos guiam suas escolhas amorosas.',
      dinheiro: 'A base financeira é construída através de investimentos subconscious. Confie em sua intuição sobre dinheiro.',
      proposito: 'Você está aqui para conectar o céu com a terra. Você é o puente entre o físico e o espiritual.'
    },
    advice: 'Pratique atividades que acalmem a mente: meditação, arte, contato com a natureza. Seus sonhos contêm mensagens importantes.'
  },
  malkuth: {
    description: 'Malkuth é o Reino - a manifestação física de todas as energias superiores. Representa a realidade material e a ação prática.',
    impact: {
      amor: 'Você expressa amor através de ações práticas e cuidado cotidiano. Relacionamentos sólidos são construídos no dia a dia.',
      dinheiro: 'Você tem aptidão natural para criar riqueza material. Trabalho honesto e consistente traz prosperidade.',
      proposito: 'Você está aqui para manifestar a luz divina na matéria. Sua missão é vivida através do trabalho e serviço cotidiano.'
    },
    advice: 'Honor the physical world as sacred. Pratique gratidão pelos prazeres simples. A espiritualidade se manifesta através de ações.'
  }
};

const LETTER_VALUES: Record<string, number> = {
  'a': 1, 'b': 2, 'c': 3, 'd': 4, 'e': 5, 'f': 6, 'g': 7, 'h': 8, 'i': 9,
  'j': 1, 'k': 2, 'l': 3, 'm': 4, 'n': 5, 'o': 6, 'p': 7, 'q': 8, 'r': 9,
  's': 1, 't': 2, 'u': 3, 'v': 4, 'w': 5, 'x': 6, 'y': 7, 'z': 8,
  'á': 1, 'à': 1, 'ã': 1, 'â': 1, 'é': 5, 'è': 5, 'ê': 5, 'í': 9, 'ì': 9,
  'ó': 6, 'ò': 6, 'õ': 6, 'ô': 6, 'ú': 3, 'ù': 3, 'ç': 3
};

const SEFIROT_SEQUENCE = ['keter', 'chokmah', 'binah', 'chesed', 'gevurah', 'tiferet', 'netzach', 'hod', 'yesod', 'malkuth'];

function sumLettersInName(name: string): number {
  return name.toLowerCase().split('').reduce((sum, char) => {
    return sum + (LETTER_VALUES[char] || 0);
  }, 0);
}

function reduceNumerologically(num: number): number {
  if (num <= 9) return num;
  if (num === 11 || num === 22) return num;
  
  const digits = num.toString().split('').map(Number);
  const sum = digits.reduce((acc, d) => acc + d, 0);
  
  if (sum <= 9) return sum;
  if (sum === 11 || sum === 22) return sum;
  
  return reduceNumerologically(sum);
}

function parseDatePart(dateStr: string): { day: number; month: number; year: number } {
  const cleaned = dateStr.replace(/-/g, '');
  return {
    day: parseInt(cleaned.slice(0, 2), 10),
    month: parseInt(cleaned.slice(2, 4), 10),
    year: parseInt(cleaned.slice(4), 10)
  };
}

export function calculateCabalisticNumbers(fullName: string, birthDate: string): CabalisticResult {
  const parts = fullName.trim().split(/\s+/);
  const vowelsOnly = parts.map(p => p.split('').filter(c => 'aeiouáàãâéèêíìóòõôúù'.includes(c)).join('')).join(' ');
  const consonantsOnly = parts.map(p => p.split('').filter(c => /[a-záàãâéèêíìóòõôúùç]/.test(c) && !'aeiouáàãâéèêíìóòõôúù'.includes(c)).join('')).join(' ');
  
  const vowelsSum = sumLettersInName(vowelsOnly);
  const consonantsSum = sumLettersInName(consonantsOnly);
  const totalSum = vowelsSum + consonantsSum;
  
  const destino = reduceNumerologically(totalSum);
  const alma = reduceNumerologically(vowelsSum) || 1;
  const personalidade = reduceNumerologically(consonantsSum) || 1;
  const expressao = reduceNumerologically(totalSum);
  
  const { day, month, year } = parseDatePart(birthDate);
  const caminhoDeVida = reduceNumerologically(day + month + year);
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const yearSum = currentYear.toString().split('').map(Number).reduce((a, b) => a + b, 0);
  const birthSum = parseInt(birthDate.replace(/-/g, ''), 10);
  const anoPessoal = reduceNumerologically(yearSum + birthSum);
  
  const sefirot: Record<string, number> = {};
  const seedNumbers = [destino, alma, personalidade, expressao, caminhoDeVida];
  
  const baseSum = seedNumbers.reduce((acc, num, i) => acc + num * (i + 1), 0);
  SEFIROT_SEQUENCE.forEach((sefirahId, index) => {
    sefirot[sefirahId] = ((baseSum + index * 11) % 9) + 1;
  });
  
  return {
    destino,
    alma,
    personalidade,
    expressao,
    caminhoDeVida,
    anoPessoal,
    sefirot
  };
}

function determineSefiraState(sefiNum: number, coreNumbers: { destino: number; alma: number; personalidade: number; expressao: number; caminhoDeVida: number }): 'equilibrado' | 'forte' | 'desequilibrado' {
  const coreNums = [coreNumbers.destino, coreNumbers.alma, coreNumbers.personalidade, coreNumbers.expressao, coreNumbers.caminhoDeVida];
  
  const matches = coreNums.filter(n => {
    if (n === sefiNum) return true;
    const nReduced = reduceNumerologically(n);
    if (nReduced === sefiNum) return true;
    if (n === 11 || n === 22) {
      const masterReduced = reduceNumerologically(n);
      if (masterReduced === sefiNum) return true;
    }
    return false;
  }).length;
  
  if (matches >= 3) return 'forte';
  if (matches === 1) return 'desequilibrado';
  return 'equilibrado';
}

function calculateStrongPaths(coreNumbers: { destino: number; alma: number; personalidade: number; expressao: number; caminhoDeVida: number }): string[] {
  const strongPaths: string[] = [];
  const numbers = [coreNumbers.destino, coreNumbers.alma, coreNumbers.personalidade, coreNumbers.expressao, coreNumbers.caminhoDeVida];
  
  const pattern = numbers.reduce((acc, num, i) => {
    const index = (reduceNumerologically(num) + i * 2) % 10;
    acc.push(index);
    return acc;
  }, [] as number[]);
  
  for (let i = 0; i < pattern.length - 1; i++) {
    const sef1 = SEFIROT_SEQUENCE[pattern[i]];
    const sef2 = SEFIROT_SEQUENCE[pattern[i + 1]];
    
    if (!sef1 || !sef2) continue;
    
    const isValidConnection = PATH_CONNECTIONS.some(([a, b]) => 
      (a === sef1 && b === sef2) || (a === sef2 && b === sef1)
    );
    
    if (isValidConnection) {
      strongPaths.push(`${sef1}-${sef2}`);
    }
  }
  
  return [...new Set(strongPaths)];
}

export function generateFullCabalisticMap(fullName: string, birthDate: string): UserCabalisticMap {
  const { day, month, year } = parseDatePart(birthDate);
  const numbers = calculateCabalisticNumbers(fullName, birthDate);
  
  const ciclos = {
    primeiro: reduceNumerologically(day),
    segundo: reduceNumerologically(month),
    terceiro: reduceNumerologically(day + month + year)
  };
  
  const sefirotDetalhado: Record<string, SefiraData> = {};
  SEFIROT_SEQUENCE.forEach(id => {
    const sefira = SEFIROT.find(s => s.id === id);
    if (!sefira) return;
    
    sefirotDetalhado[id] = {
      number: numbers.sefirot[id],
      state: determineSefiraState(numbers.sefirot[id], numbers),
      description: SEFIRA_MEANINGS[id].description,
      impact: SEFIRA_MEANINGS[id].impact,
      advice: SEFIRA_MEANINGS[id].advice
    };
  });
  
  return {
    destino: numbers.destino,
    alma: numbers.alma,
    personalidade: numbers.personalidade,
    expressao: numbers.expressao,
    caminhoDeVida: numbers.caminhoDeVida,
    anoPessoal: numbers.anoPessoal,
    ciclos,
    sefirot: numbers.sefirot,
    sefirotDetalhado,
    caminhosFortes: calculateStrongPaths(numbers)
  };
}

export function getSefiraDetails(id: string): Sefira | undefined {
  return SEFIROT.find(s => s.id === id);
}

export function getAllSefirot(): Sefira[] {
  return SEFIROT;
}

export function getPathConnections(): string[][] {
  return PATH_CONNECTIONS;
}

export function getStateColor(state: 'equilibrado' | 'forte' | 'desequilibrado'): string {
  switch (state) {
    case 'forte': return '#76FF03';
    case 'equilibrado': return '#D4AF37';
    case 'desequilibrado': return '#FF5252';
  }
}

export function getStateLabel(state: 'equilibrado' | 'forte' | 'desequilibrado'): string {
  switch (state) {
    case 'forte': return 'Energia Forte';
    case 'equilibrado': return 'Equilibrado';
    case 'desequilibrado': return 'Em Transformação';
  }
}

export function getSefiraPosition(id: string): { x: number; y: number } | undefined {
  const sefira = SEFIROT.find(s => s.id === id);
  return sefira?.position;
}

export function getSefiraConnections(id: string): string[] {
  const sefira = SEFIROT.find(s => s.id === id);
  return sefira?.connections || [];
}
