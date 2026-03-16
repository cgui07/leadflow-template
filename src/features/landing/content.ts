export interface LandingAction {
  label: string;
  href: string;
  external?: boolean;
}

export interface LandingBrand {
  name: string;
  description: string;
}

export interface LandingHighlight {
  label: string;
  value: string;
}

export interface LandingHeroContent {
  eyebrow: string;
  title: string;
  description: string;
  primaryAction: LandingAction;
  secondaryAction: LandingAction;
  highlights: readonly LandingHighlight[];
}

export interface LandingPriorityLead {
  name: string;
  stage: string;
  detail: string;
  score: string;
  eta: string;
}

export interface LandingConversationEntry {
  role: "Assistente" | "Cliente";
  message: string;
}

export interface LandingProfileField {
  label: string;
  value: string;
}

export interface LandingPreviewSummary {
  label: string;
  value: string;
  badge: string;
}

export interface LandingConversationContent {
  label: string;
  badge: string;
  leadName: string;
  messages: readonly LandingConversationEntry[];
  profileLabel: string;
  profileFields: readonly LandingProfileField[];
}

export interface LandingSupportCard {
  title: string;
  description: string;
}

export interface LandingPreviewContent {
  summary: LandingPreviewSummary;
  priorityLeads: readonly LandingPriorityLead[];
  conversation: LandingConversationContent;
  supportCards: readonly LandingSupportCard[];
}

export interface LandingProcessStep {
  title: string;
  description: string;
}

export interface LandingProcessSectionContent {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  steps: readonly LandingProcessStep[];
}

export interface LandingBenefit {
  description: string;
}

export interface LandingBenefitsSectionContent {
  eyebrow: string;
  title: string;
  description: string;
  items: readonly LandingBenefit[];
}

export interface LandingFooterContent {
  label: string;
  action: LandingAction;
}

export interface LandingContent {
  brand: LandingBrand;
  header: {
    flowAction: LandingAction;
    contactAction: LandingAction;
  };
  hero: LandingHeroContent;
  preview: LandingPreviewContent;
  process: LandingProcessSectionContent;
  benefits: LandingBenefitsSectionContent;
  footer: LandingFooterContent;
}

const flowSectionId = "como-funciona";
const contactHref =
  "https://wa.me/5521981424040?text=Ola%2C%20quero%20entender%20como%20o%20LeadFlow%20funciona.";

export const landingContent = {
  brand: {
    name: "LeadFlow",
    description:
      "Atendimento e qualificacao de leads para corretores autonomos.",
  },
  header: {
    flowAction: {
      label: "Ver o fluxo",
      href: `#${flowSectionId}`,
    },
    contactAction: {
      label: "Falar no WhatsApp",
      href: contactHref,
      external: true,
    },
  },
  hero: {
    eyebrow:
      "Responda em segundos. Organize sem esforco. Priorize com clareza.",
    title: "Transforme o WhatsApp em um funil simples de vendas imobiliarias.",
    description:
      "O LeadFlow atende o primeiro contato, coleta informacoes essenciais e entrega ao corretor apenas os leads com maior probabilidade de compra.",
    primaryAction: {
      label: "Entrar em contato",
      href: contactHref,
      external: true,
    },
    secondaryAction: {
      label: "Entender o fluxo",
      href: `#${flowSectionId}`,
    },
    highlights: [
      {
        label: "Resposta inicial",
        value: "instantanea",
      },
      {
        label: "Qualificacao",
        value: "automatica",
      },
      {
        label: "Operacao",
        value: "simples",
      },
      {
        label: "Priorizacao",
        value: "inteligente",
      },
    ],
  },
  preview: {
    summary: {
      label: "Leads ativos",
      value: "18 contatos",
      badge: "5 quentes",
    },
    priorityLeads: [
      {
        name: "Mariana Souza",
        stage: "Pronta para visita",
        detail: "Busca apartamento de 2 quartos na Zona Sul ate R$ 780 mil.",
        score: "92/100",
        eta: "Responder agora",
      },
      {
        name: "Paulo Henrique",
        stage: "Em qualificacao",
        detail: "Quer casa em condominio e pretende comprar em ate 90 dias.",
        score: "81/100",
        eta: "Hoje, 14h",
      },
      {
        name: "Ana Beatriz",
        stage: "Follow-up automatico",
        detail: "Parou de responder apos pedir opcoes na Barra da Tijuca.",
        score: "63/100",
        eta: "Amanha, 10h",
      },
    ],
    conversation: {
      label: "Conversa assistida",
      badge: "Lead quente",
      leadName: "Mariana Souza",
      messages: [
        {
          role: "Assistente",
          message:
            "Ola, aqui e da equipe LeadFlow. Vi que voce tem interesse em um imovel. Posso te ajudar com algumas opcoes.",
        },
        {
          role: "Cliente",
          message: "Estou procurando apartamento na Zona Oeste.",
        },
        {
          role: "Assistente",
          message:
            "Perfeito. Voce busca para morar ou investir? E qual faixa de valor faz mais sentido hoje?",
        },
        {
          role: "Cliente",
          message:
            "Para morar. Ate R$ 650 mil e quero comprar ainda este semestre.",
        },
      ],
      profileLabel: "Perfil gerado pela IA",
      profileFields: [
        {
          label: "Regiao",
          value: "Zona Sul",
        },
        {
          label: "Faixa",
          value: "Ate R$ 780 mil",
        },
        {
          label: "Prazo",
          value: "Ate 60 dias",
        },
        {
          label: "Proximo passo",
          value: "Agendar visita",
        },
      ],
    },
    supportCards: [
      {
        title: "Follow-up",
        description: "Mensagens programadas para nao perder leads frios.",
      },
      {
        title: "Organizacao",
        description:
          "Historico centralizado para o corretor retomar a conversa com contexto.",
      },
    ],
  },
  process: {
    id: flowSectionId,
    eyebrow: "Como funciona",
    title: "Um fluxo direto para responder, qualificar e entregar contexto.",
    description:
      "O sistema nao substitui o corretor. Ele organiza a entrada, faz a triagem inicial e cria clareza sobre quem precisa de atencao imediata.",
    steps: [
      {
        title: "Resposta imediata no WhatsApp",
        description:
          "Todo novo contato recebe uma resposta profissional em segundos, mesmo quando o corretor esta em visita ou dirigindo.",
      },
      {
        title: "Conversa curta e objetiva",
        description:
          "O assistente faz poucas perguntas, mas captura o que importa: regiao, faixa de valor, prazo e intencao de compra.",
      },
      {
        title: "Entrega do lead pronto",
        description:
          "Quando o lead demonstra intencao real, o corretor assume a conversa com historico, contexto e prioridade definidos.",
      },
    ],
  },
  benefits: {
    eyebrow: "O que o corretor ganha",
    title: "Menos perda de lead. Mais foco em quem realmente quer comprar.",
    description:
      "O valor do produto esta na capacidade de aumentar a taxa de resposta e reduzir o abandono causado por demora, desorganizacao e ausencia de follow-up.",
    items: [
      {
        description:
          "Mini CRM com historico completo de mensagens e ficha automatica do lead.",
      },
      {
        description:
          "Classificacao de interesse para destacar quem merece atendimento imediato.",
      },
      {
        description:
          "Follow-ups programados para leads frios ou que deixaram de responder.",
      },
      {
        description:
          "Interface simples para corretores autonomos que nao querem aprender um CRM pesado.",
      },
    ],
  },
  footer: {
    label: "LeadFlow - WhatsApp + IA + CRM leve",
    action: {
      label: "Entrar em contato",
      href: contactHref,
      external: true,
    },
  },
} satisfies LandingContent;
