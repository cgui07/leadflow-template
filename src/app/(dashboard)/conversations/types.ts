export interface ConversationItem {
  id: string;
  status: string;
  unreadCount: number;
  lastMessageAt: string;
  lead: {
    id: string;
    name: string;
    phone: string;
    avatarUrl?: string;
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

export interface MessageItem {
  id: string;
  direction: string;
  sender: string;
  content: string;
  type: string;
  status: string;
  createdAt: string;
  metadata?: {
    mediaUrl?: string;
    mimetype?: string;
    fileName?: string;
    fileSize?: number;
    caption?: string;
    seconds?: number;
    width?: number;
    height?: number;
  };
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
