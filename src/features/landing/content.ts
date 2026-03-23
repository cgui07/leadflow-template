export interface LandingAction {
  description?: string;
  external?: boolean;
  href: string;
  label: string;
}

export interface LandingBrand {
  description: string;
  logoUrl?: string | null;
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
  "https://wa.me/5521981424040?text=Olá%2C%20quero%20entender%20como%20o%20LeadFlow%20funciona.";

export const landingContent = {
  brand: {
    name: "LeadFlow",
    logoUrl: "/lead-logo.png",
    description: "Agente de vendas imobiliárias com IA, voz e automação completa.",
  },
  header: {
    contactAction: {
      label: "Falar com a equipe",
      href: contactHref,
      external: true,
    },
  },
  hero: {
    eyebrow: "Responde, qualifica, envia PDF e agenda visita — tudo automático.",
    title: "Seu agente de vendas imobiliárias trabalhando 24h no WhatsApp.",
    description:
      "O LeadFlow atende cada lead com a sua voz clonada, apresenta imóveis do seu catálogo, envia fichas em PDF e agenda visitas — sem você precisar digitar uma palavra.",
    primaryAction: {
      label: "Entenda melhor com a nossa equipe",
      href: contactHref,
      external: true,
      description:
        "Você será direcionado para conversar com a equipe e entender valores e formato de contratação.",
    },
    signals: [
      {
        label: "Resposta",
        title: "Atende com a sua voz clonada",
        description:
          "A IA responde em áudio PTT usando a sua própria voz — o lead acha que é você.",
        badge: "voz real",
        icon: "lead",
      },
      {
        label: "Catálogo",
        title: "Apresenta imóveis e envia PDF",
        description:
          "A IA conhece seu catálogo e manda a ficha em PDF do imóvel certo na hora certa.",
        badge: "automático",
        icon: "qualify",
      },
      {
        label: "Fechamento",
        title: "Agenda visita e faz follow-up",
        description:
          "Detecta intenção de visita, cria o agendamento e retoma leads frios sozinho.",
        badge: "sem esforço",
        icon: "handoff",
      },
    ],
    highlights: [
      { label: "Resposta em áudio", value: "voz clonada" },
      { label: "Catálogo de imóveis", value: "com PDF" },
      { label: "Qualificação", value: "automática" },
      { label: "Agendamento", value: "de visitas" },
      { label: "Follow-up", value: "inteligente" },
      { label: "Operação", value: "24h/7 dias" },
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
        stage: "Visita agendada pela IA",
        detail: "Quer apartamento de 2 quartos na Zona Sul até R$ 780 mil. IA enviou PDF e agendou visita para sábado.",
        score: "94/100",
        eta: "Sábado, 10h",
      },
      {
        name: "Paulo Henrique",
        stage: "PDF enviado — aguardando",
        detail: "Pediu opções de casa em condomínio. IA apresentou 3 imóveis e enviou as fichas em PDF.",
        score: "82/100",
        eta: "Hoje, 14h",
      },
      {
        name: "Ana Beatriz",
        stage: "Follow-up automático",
        detail: "Parou de responder após ver opções na Barra da Tijuca. IA retomou o contato ontem.",
        score: "65/100",
        eta: "Amanhã, 10h",
      },
      {
        name: "Lucas Martins",
        stage: "Qualificando interesse",
        detail: "Quer comparar financiamento antes de decidir. IA está coletando faixa e prazo.",
        score: "76/100",
        eta: "Hoje, 17h",
      },
      {
        name: "Juliana Costa",
        stage: "Interesse aquecido",
        detail: "Pediu opções de cobertura na Tijuca. IA enviou áudio com os destaques do imóvel.",
        score: "85/100",
        eta: "Amanhã, 9h",
      },
    ],
    conversation: {
      label: "Conversa assistida",
      badge: "Lead quente",
      leadName: "Mariana Souza",
      messages: [
        {
          role: "Cliente",
          message: "Oi, vi o anúncio do apartamento. Tem mais detalhes?",
        },
        {
          role: "Assistente",
          message:
            "Oi Mariana! Tenho sim — é um 2 quartos no Recreio com varanda, 78m² e lazer completo. Já te mando a ficha completa em PDF.",
        },
        {
          role: "Cliente",
          message: "Que ótimo! E dá pra visitar esse fim de semana?",
        },
        {
          role: "Assistente",
          message:
            "Dá sim! Tenho sábado às 10h disponível. Posso confirmar pra você?",
        },
      ],
      profileLabel: "Perfil gerado pela IA",
      profileFields: [
        { label: "Região", value: "Recreio / Barra" },
        { label: "Faixa", value: "Até R$ 780 mil" },
        { label: "Prazo", value: "Imediato" },
        { label: "Próximo passo", value: "Visita — sábado 10h" },
      ],
    },
    supportCards: [
      {
        title: "Voz clonada",
        description: "Responde em áudio PTT com a sua voz real — o lead não percebe que é IA.",
      },
      {
        title: "PDF automático",
        description: "Envia a ficha do imóvel certo no momento em que o lead demonstra interesse.",
      },
    ],
  },
  process: {
    eyebrow: "Como funciona",
    title: "Um agente completo que vende, qualifica e agenda por você.",
    description:
      "O LeadFlow não é só um chatbot. É um agente de vendas que conhece seu catálogo, fala com sua voz, manda documentos e agenda visitas — enquanto você foca em fechar negócio.",
    journeyLabel: "Veja o fluxo completo",
    journeyTitle: 'Do primeiro "Oi" à visita agendada — sem você tocar no celular.',
    journeyDescription:
      "O lead tem uma conversa natural e profissional. Você recebe o contexto completo, o imóvel já apresentado, o PDF já enviado e a visita já marcada.",
    journeyBadge: "agente autônomo de ponta a ponta",
    customerPerspectiveEyebrow: "o que o cliente percebe",
    customerPerspectiveTitle: "Um corretor atencioso, disponível e rápido.",
    customerPerspectiveDescription:
      "O lead recebe resposta em segundos, ouve áudios com voz real do corretor, recebe PDFs com detalhes do imóvel e sente que está sendo bem atendido desde o primeiro contato.",
    stages: [
      {
        label: "Entrada",
        title: "Lead chega pelo WhatsApp",
        description:
          "O contato entra a partir do anúncio ou indicação e é atendido em segundos, sem fila.",
        icon: "lead",
        metric: "sem espera",
      },
      {
        label: "Resposta",
        title: "IA responde com sua voz",
        description:
          "Áudio PTT com voz clonada do corretor ou texto — natural como se fosse você mesmo digitando.",
        icon: "reply",
        metric: "voz real",
      },
      {
        label: "Catálogo",
        title: "Apresenta imóvel e envia PDF",
        description:
          "A IA conhece seu catálogo e manda a ficha em PDF do imóvel mais adequado automaticamente.",
        icon: "qualify",
        metric: "PDF na hora",
      },
      {
        label: "Qualificação",
        title: "Coleta região, faixa e prazo",
        description:
          "Score de interesse calculado em tempo real para você saber quem merece atenção imediata.",
        icon: "prioritize",
        metric: "score real",
      },
      {
        label: "Agenda",
        title: "Visita marcada automaticamente",
        description:
          "Detecta intenção de visita, agenda no calendário e envia confirmação — sem intervenção manual.",
        icon: "handoff",
        metric: "zero esforço",
      },
    ],
    outcomes: [
      {
        label: "Cliente vê",
        value: "Atendimento humano",
        description:
          "Uma conversa fluida, com voz real e respostas contextuais — sem parecer robô.",
      },
      {
        label: "IA entrega",
        value: "Imóvel + PDF certos",
        description:
          "O imóvel mais adequado apresentado com ficha completa no momento certo.",
      },
      {
        label: "Corretor ganha",
        value: "Visita agendada",
        description:
          "Recebe o lead qualificado com contexto completo, PDF já enviado e visita já marcada.",
      },
    ],
    steps: [
      {
        title: "Resposta em áudio com sua voz",
        description:
          "Grave 30 segundos de áudio e o sistema clona sua voz. A partir daí, cada resposta soa como você — mesmo quando você está em uma visita ou dirigindo.",
      },
      {
        title: "Catálogo inteligente com envio de PDF",
        description:
          "Cadastre seus imóveis e faça upload das fichas em PDF. A IA apresenta o imóvel certo para cada cliente e envia o documento automaticamente quando há interesse.",
      },
      {
        title: "Agendamento e follow-up automáticos",
        description:
          "Quando o lead aceita uma visita, o sistema agenda no calendário. Leads que somem recebem follow-ups personalizados com roteiro que você mesmo define.",
      },
    ],
  },
  benefits: {
    eyebrow: "O que o corretor ganha",
    title: "Um agente trabalhando por você — de dia, de noite, nos fins de semana.",
    description:
      "Enquanto você está em visita, o LeadFlow atende, qualifica, envia PDF e agenda. Você só entra em cena quando o lead já está pronto para fechar.",
    items: [
      {
        description:
          "Respostas em áudio PTT com voz clonada do corretor — o lead não percebe que é IA.",
      },
      {
        description:
          "Catálogo de imóveis com envio automático de PDF quando o lead demonstra interesse.",
      },
      {
        description:
          "Agendamento automático de visitas integrado ao Google Calendar.",
      },
      {
        description:
          "Score de qualificação em tempo real para priorizar quem está mais próximo de comprar.",
      },
      {
        description:
          "Follow-up com roteiro personalizado pelo corretor para reativar leads frios.",
      },
      {
        description:
          "Mini CRM com histórico completo, resumo gerado por IA e pipeline visual por etapa.",
      },
    ],
  },
  footer: {
    label: "LeadFlow — IA, voz, catálogo e CRM para corretores de imóveis",
    action: {
      label: "Falar com a equipe",
      href: contactHref,
      external: true,
    },
  },
} satisfies LandingContent;
