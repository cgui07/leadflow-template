import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { getPipelineColorDotClass } from "@/lib/ui-colors";
import type { PipelineStage, SelectedLead } from "../types";

interface MoveLeadDrawerProps {
  open: boolean;
  stages: PipelineStage[];
  selectedLead: SelectedLead | null;
  movingLeadId: string | null;
  onClose: () => void;
  onMoveLead: (leadId: string, stageId: string) => void;
}

export function MoveLeadDrawer({
  open,
  stages,
  selectedLead,
  movingLeadId,
  onClose,
  onMoveLead,
}: MoveLeadDrawerProps) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={selectedLead ? `Mover ${selectedLead.name}` : undefined}
      description="Escolha o estagio de destino para este lead."
    >
      <div className="space-y-2">
        {stages.map((stage) => {
          const isCurrentStage = stage.id === selectedLead?.stageId;
          const isMoving = movingLeadId === selectedLead?.id;

          return (
            <Button
              key={stage.id}
              type="button"
              variant="unstyled"
              size="md"
              disabled={isCurrentStage || isMoving}
              onClick={() => {
                if (!selectedLead || isCurrentStage) {
                  return;
                }

                onMoveLead(selectedLead.id, stage.id);
              }}
              className="h-auto w-full justify-between rounded-xl border border-neutral-border bg-white px-4 py-3 text-left transition hover:bg-neutral-surface disabled:opacity-60"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`h-3 w-3 rounded-full ${getPipelineColorDotClass(stage.color)}`}
                />
                <div>
                  <div className="text-sm font-medium text-neutral-ink">
                    {stage.name}
                  </div>
                  <div className="text-xs text-neutral-muted">
                    {stage.leads.length} leads
                  </div>
                </div>
              </div>
              <div className="text-xs font-medium text-neutral-muted">
                {isCurrentStage ? "Atual" : "Selecionar"}
              </div>
            </Button>
          );
        })}
      </div>
    </Drawer>
  );
}
