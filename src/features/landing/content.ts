export interface LandingAction {
  description?: string;
  external?: boolean;
  href: string;
  label: string;
}

export interface LandingBrand {
  description: string;
  name: string;
}

export interface LandingHighlight {
  label: string;
  value: string;
}

export type LandingHeroSignalIcon = "lead" | "qualify" | "handoff";

export interface LandingHeroSignal {
  badge: string;
  description: string;
  icon: LandingHeroSignalIcon;
  label: string;
  title: string;
}

export interface LandingHeroContent {
  description: string;
  eyebrow: string;
  highlights: readonly LandingHighlight[];
  primaryAction: LandingAction;
  signals: readonly LandingHeroSignal[];
  title: string;
}

export interface LandingPriorityLead {
  detail: string;
  eta: string;
  name: string;
  score: string;
  stage: string;
}

export interface LandingConversationEntry {
  message: string;
  role: "Assistente" | "Cliente";
}

export interface LandingProfileField {
  label: string;
  value: string;
}

export interface LandingPreviewSummary {
  badge: string;
  label: string;
  value: string;
}

export interface LandingConversationContent {
  badge: string;
  label: string;
  leadName: string;
  messages: readonly LandingConversationEntry[];
  profileFields: readonly LandingProfileField[];
  profileLabel: string;
}

export interface LandingSupportCard {
  description: string;
  title: string;
}

export interface LandingPreviewContent {
  conversation: LandingConversationContent;
  priorityLeads: readonly LandingPriorityLead[];
  summary: LandingPreviewSummary;
  supportCards: readonly LandingSupportCard[];
}

export interface LandingProcessStep {
  description: string;
  title: string;
}

export type LandingProcessStageIcon =
  | "lead"
  | "reply"
  | "qualify"
  | "prioritize"
  | "handoff";

export interface LandingProcessStage {
  description: string;
  icon: LandingProcessStageIcon;
  label: string;
  metric: string;
  title: string;
}

export interface LandingProcessOutcome {
  description: string;
  label: string;
  value: string;
}

export interface LandingProcessSectionContent {
  customerPerspectiveDescription: string;
  customerPerspectiveEyebrow: string;
  customerPerspectiveTitle: string;
  description: string;
  eyebrow: string;
  journeyBadge: string;
  journeyDescription: string;
  journeyLabel: string;
  journeyTitle: string;
  outcomes: readonly LandingProcessOutcome[];
  stages: readonly LandingProcessStage[];
  steps: readonly LandingProcessStep[];
  title: string;
}

export interface LandingBenefit {
  description: string;
}

export interface LandingBenefitsSectionContent {
  description: string;
  eyebrow: string;
  items: readonly LandingBenefit[];
  title: string;
}

export interface LandingFooterContent {
  action: LandingAction;
  label: string;
}

export interface LandingContent {
  benefits: LandingBenefitsSectionContent;
  brand: LandingBrand;
  footer: LandingFooterContent;
  header: {
    contactAction: LandingAction;
  };
  hero: LandingHeroContent;
  preview: LandingPreviewContent;
  process: LandingProcessSectionContent;
}

const contactHref =
  "https://wa.me/5521981424040?text=Ola%2C%20quero%20entender%20como%20o%20LeadFlow%20funciona.";

export const landingContent = {
  brand: {
    name: "LeadFlow",
    description: "Atendimento e qualificacao de leads para corretores autonomos.",
  },
  header: {
    contactAction: {
      label: "Pedir orcamento",
      href: contactHref,
      external: true,
    },
  },
  hero: {
    eyebrow: "Responda em segundos. Organize sem esforco. Priorize com clareza.",
    title: "Transforme o WhatsApp em um funil simples de vendas imobiliarias.",
    description:
      "O LeadFlow atende o primeiro contato, coleta informacoes essenciais e entrega ao corretor apenas os leads com maior probabilidade de compra.",
    primaryAction: {
      label: "Entenda melhor com a nossa equipe",
      href: contactHref,
      external: true,
      description:
        "Voce sera direcionado para conversar com a equipe e entender valores e formato de contratacao.",
    },
    signals: [
      {
        label: "Entrada",
        title: "Novo lead cai no funil certo",
        description:
          "O primeiro contato entra organizado e recebe resposta sem espera.",
        badge: "em segundos",
        icon: "lead",
      },
      {
        label: "Qualificacao",
        title: "IA coleta regiao e faixa",
        description:
          "As informacoes mais importantes entram no contexto logo no inicio.",
        badge: "dados certos",
        icon: "qualify",
      },
      {
        label: "Entrega",
        title: "Corretor assume com clareza",
        description:
          "Historico, prioridade e proximo passo chegam prontos para seguir.",
        badge: "mais foco",
        icon: "handoff",
      },
    ],
    highlights: [
      { label: "Resposta inicial", value: "instantanea" },
      { label: "Qualificacao", value: "automatica" },
      { label: "Operacao", value: "simples" },
      { label: "Priorizacao", value: "inteligente" },
      { label: "Contexto", value: "completo" },
      { label: "Follow-up", value: "ativo" },
    ],
  },
  preview: {
    summary: {
      label: "Leads ativos",
      value: "24 contatos",
      badge: "7 quentes",
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
      {
        name: "Lucas Martins",
        stage: "Aguardando retorno",
        detail:
          "Visitou duas opcoes em Botafogo e quer comparar financiamento antes de decidir.",
        score: "76/100",
        eta: "Hoje, 17h",
      },
      {
        name: "Juliana Costa",
        stage: "Interesse aquecido",
        detail:
          "Pediu opcoes de cobertura na Tijuca e quer entender disponibilidade para visita nesta semana.",
        score: "84/100",
        eta: "Amanha, 9h",
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
          message: "Para morar. Ate R$ 650 mil e quero comprar ainda este semestre.",
        },
      ],
      profileLabel: "Perfil gerado pela IA",
      profileFields: [
        { label: "Regiao", value: "Zona Sul" },
        { label: "Faixa", value: "Ate R$ 780 mil" },
        { label: "Prazo", value: "Ate 60 dias" },
        { label: "Proximo passo", value: "Agendar visita" },
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
    eyebrow: "Como funciona",
    title: "Um fluxo direto para responder, qualificar e entregar contexto.",
    description:
      "O sistema nao substitui o corretor. Ele organiza a entrada, faz a triagem inicial e cria clareza sobre quem precisa de atencao imediata.",
    journeyLabel: "Veja o fluxo acontecendo",
    journeyTitle: 'Do primeiro "Oi" ao lead pronto para atendimento.',
    journeyDescription:
      "O cliente percebe uma conversa fluida. O corretor recebe prioridade, contexto e proximo passo sem precisar montar nada manualmente.",
    journeyBadge: "processo visivel e facil de entender",
    customerPerspectiveEyebrow: "o que o cliente percebe",
    customerPerspectiveTitle: "Atendimento rapido, natural e profissional.",
    customerPerspectiveDescription:
      "Em vez de esperar resposta ou preencher um processo pesado, o lead entra em uma conversa enxuta que ja move a oportunidade para o ponto certo.",
    stages: [
      {
        label: "Entrada",
        title: "Lead chega pelo WhatsApp",
        description:
          "O contato entra a partir do anuncio ou indicacao e cai no fluxo certo imediatamente.",
        icon: "lead",
        metric: "sem fila",
      },
      {
        label: "Resposta",
        title: "Assistente abre a conversa",
        description:
          "Uma primeira mensagem profissional responde em segundos e evita que o lead esfrie.",
        icon: "reply",
        metric: "em segundos",
      },
      {
        label: "Qualificacao",
        title: "IA coleta o que importa",
        description:
          "Regiao, faixa, prazo e intencao de compra entram no contexto sem conversa arrastada.",
        icon: "qualify",
        metric: "dados certos",
      },
      {
        label: "Prioridade",
        title: "Sistema ordena o atendimento",
        description:
          "Quem esta mais pronto para avancar sobe na frente com score e proximo passo definidos.",
        icon: "prioritize",
        metric: "foco real",
      },
      {
        label: "Entrega",
        title: "Corretor assume com clareza",
        description:
          "A passagem acontece com historico, resumo e contexto suficiente para seguir vendendo.",
        icon: "handoff",
        metric: "handoff limpo",
      },
    ],
    outcomes: [
      {
        label: "Cliente ve",
        value: "Conversa natural",
        description:
          "Uma troca objetiva, profissional e sem parecer formulario engessado.",
      },
      {
        label: "IA entrega",
        value: "Contexto pronto",
        description:
          "Regiao, faixa, prazo e interesse chegam organizados para a equipe.",
      },
      {
        label: "Corretor ganha",
        value: "Prioridade clara",
        description:
          "Fica evidente quem precisa de resposta imediata e qual deve ser o proximo movimento.",
      },
    ],
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
      label: "Falar com a equipe",
      href: contactHref,
      external: true,
    },
  },
} satisfies LandingContent;
