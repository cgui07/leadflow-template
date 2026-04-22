export type BotContentText = {
  type: "text";
  value: string;
};

export type BotContentImage = {
  type: "image";
  url: string;
  caption?: string;
};

export type BotContentAudio = {
  type: "audio";
  url: string;
};

export type BotContentPdf = {
  type: "pdf";
  url: string;
  filename: string;
};

export type BotContent =
  | BotContentText
  | BotContentImage
  | BotContentAudio
  | BotContentPdf;

export type BotCondition = {
  id: string;
  label: string;
  keywords: string[];
  nextNodeId: string;
};

export type BotNode = {
  id: string;
  contents: BotContent[];
  conditions?: BotCondition[];
  defaultNextNodeId?: string | null;
};

export type BotFlow = {
  nodes: BotNode[];
};
