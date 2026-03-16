export interface PipelineLead {
  id: string;
  name: string;
  phone: string;
  score: number;
  value?: number | null;
  status: string;
  lastContactAt?: string | null;
  createdAt: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  color: string;
  order: number;
  leads: PipelineLead[];
}

export interface SelectedLead {
  id: string;
  name: string;
  stageId: string;
}
