export interface ConversationItem {
  id: string;
  status: string;
  unreadCount: number;
  lastMessageAt: string | null;
  lead: {
    id: string;
    name: string;
    phone: string;
    avatarUrl?: string | null;
    score: number;
    status: string;
  };
  messages: Array<{
    id: string;
    content: string;
    direction: string;
    sender: string;
    createdAt: string;
  }>;
}

export interface MessageMetadata {
  caption?: string;
  fileName?: string;
  fileSize?: number;
  height?: number;
  mediaUrl?: string;
  mimetype?: string;
  seconds?: number;
  width?: number;
}

export interface MessageItem {
  id: string;
  direction: string;
  sender: string;
  content: string;
  type: string;
  status: string;
  createdAt: string;
  metadata?: MessageMetadata | null;
}

export interface ConversationSummary {
  interesse: string;
  regiao: string;
  tipoImovel: string;
  faixaValor: string;
  prazoCompra: string;
  objecoes: string;
  ultimaIntencao: string;
  proximoPasso: string;
}
