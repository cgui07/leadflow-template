"use client";

import Image from "next/image";
import { v4 as uuidv4 } from "uuid";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { UserSettings } from "../contracts";
import { SectionContainer } from "@/components/layout/SectionContainer";
import type {
  BotContent,
  BotCondition,
  BotFlow,
  BotNode,
} from "@/lib/bot-flow-types";
import {
  CheckboxField,
  FileField,
  SelectField,
  TextareaField,
  TextField,
} from "@/components/forms";
import {
  Bot,
  ChevronDown,
  ChevronUp,
  FileText,
  GitBranch,
  ImageIcon,
  Loader2,
  Mic,
  Plus,
  Send,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useAudioRecorder } from "@/components/domain/chat/useAudioRecorder";

interface BotFlowSectionProps {
  form: UserSettings;
  update: <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K],
  ) => void;
}

async function uploadToR2(file: File): Promise<string> {
  const presignRes = await fetch("/api/settings/bot-flow-media/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name, contentType: file.type }),
  });

  if (!presignRes.ok) {
    const data = await presignRes.json().catch(() => ({}));
    throw new Error(
      (data as { error?: string }).error ?? "Erro ao preparar upload.",
    );
  }

  const { url, publicUrl } = (await presignRes.json()) as {
    url: string;
    publicUrl: string;
  };

  const uploadRes = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!uploadRes.ok) throw new Error("Erro ao enviar arquivo.");
  return publicUrl;
}

function formatSeconds(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

function BotAudioRecorder({ onUpload }: { onUpload: (url: string) => void }) {
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleSend(blob: Blob, mimeType: string) {
    setUploadError(null);
    // Strip codec suffix (e.g. "audio/webm;codecs=opus" → "audio/webm")
    const baseMime = mimeType.split(";")[0].trim();
    const ext = baseMime.includes("ogg") ? "ogg" : "webm";
    const file = new File([blob], `recording.${ext}`, { type: baseMime });
    try {
      const url = await uploadToR2(file);
      onUpload(url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Erro no upload.");
      throw err;
    }
  }

  const { state, seconds, error, start, cancel, send } = useAudioRecorder({ onSend: handleSend });

  const isRecording = state === "recording";
  const isSending = state === "sending";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-surface p-3">
        {isRecording && (
          <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-red-500" />
        )}
        {isSending && (
          <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-teal-500" />
        )}
        {state === "idle" && <Mic className="h-4 w-4 shrink-0 text-neutral-muted" />}

        <span className="flex-1 text-xs text-neutral">
          {isSending ? "Enviando…" : isRecording ? "Gravando…" : "Grave o áudio aqui"}
        </span>

        <span className="font-mono text-xs tabular-nums text-neutral-muted">
          {formatSeconds(seconds)}
        </span>

        {state === "idle" ? (
          <Button
            size="sm"
            onClick={start}
            icon={<Mic className="h-3.5 w-3.5" />}
            className="h-7 rounded-full bg-red-500 text-white hover:bg-red-600 px-2.5"
          >
            Gravar
          </Button>
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={cancel}
              disabled={isSending}
              icon={<X className="h-3.5 w-3.5" />}
              className="h-7 w-7 p-0"
              title="Cancelar"
            />
            <Button
              size="sm"
              onClick={send}
              loading={isSending}
              disabled={!isRecording}
              icon={<Send className="h-3.5 w-3.5" />}
              className="h-7 rounded-full bg-whatsapp text-white hover:bg-whatsapp-dark px-2.5"
            >
              Enviar
            </Button>
          </>
        )}
      </div>
      {(error || uploadError) && (
        <p className="text-xs text-red-dark">{error ?? uploadError}</p>
      )}
    </div>
  );
}

function ContentEditor({
  content,
  onChange,
  onRemove,
}: {
  content: BotContent;
  onChange: (c: BotContent) => void;
  onRemove: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [audioMode, setAudioMode] = useState<"upload" | "record">("record");

  async function handleFile(file: File, type: "image" | "audio" | "pdf") {
    setUploadError(null);
    setUploading(true);
    try {
      const publicUrl = await uploadToR2(file);
      if (type === "image") {
        onChange({ type: "image", url: publicUrl });
      } else if (type === "audio") {
        onChange({ type: "audio", url: publicUrl });
      } else {
        onChange({ type: "pdf", url: publicUrl, filename: file.name });
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Erro no upload.");
    } finally {
      setUploading(false);
    }
  }

  const contentTypeLabel: Record<BotContent["type"], string> = {
    text: "Texto",
    image: "Imagem",
    audio: "Áudio",
    pdf: "PDF",
  };

  const contentTypeIcon: Record<BotContent["type"], React.ReactNode> = {
    text: <Bot className="h-3.5 w-3.5" />,
    image: <ImageIcon className="h-3.5 w-3.5" />,
    audio: <Mic className="h-3.5 w-3.5" />,
    pdf: <FileText className="h-3.5 w-3.5" />,
  };

  return (
    <div className="rounded-lg border border-border bg-surface-alt p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-medium text-neutral">
          {contentTypeIcon[content.type]}
          {contentTypeLabel[content.type]}
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon={<X className="h-3.5 w-3.5" />}
          onClick={onRemove}
          className="h-6 w-6 p-0 text-neutral hover:text-red-dark"
        />
      </div>

      {content.type === "text" && (
        <TextareaField
          label=""
          rows={3}
          placeholder="Digite a mensagem..."
          value={content.value}
          onChange={(e) => onChange({ ...content, value: e.target.value })}
        />
      )}

      {content.type === "image" && (
        <div className="space-y-1.5">
          {content.url ? (
            <div className="flex items-center gap-2">
              <Image
                src={content.url}
                alt="Imagem"
                width={56}
                height={56}
                className="h-14 w-14 rounded-md object-cover border border-border"
              />
              <Button
                variant="secondary"
                size="sm"
                icon={<Trash2 className="h-3.5 w-3.5" />}
                onClick={() => onChange({ type: "image", url: "" })}
              >
                Remover
              </Button>
            </div>
          ) : (
            <div
              className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-surface p-3 cursor-pointer hover:border-primary transition-colors text-xs text-neutral"
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImageIcon className="h-4 w-4" />
              )}
              {uploading
                ? "Enviando..."
                : "Clique para enviar imagem (JPG, PNG, WEBP · máx 5MB)"}
            </div>
          )}
          <TextField
            label="Legenda (opcional)"
            placeholder="Legenda da imagem..."
            value={content.caption ?? ""}
            onChange={(e) => onChange({ ...content, caption: e.target.value })}
          />
          <FileField
            ref={fileRef}
            hidden
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file, "image");
              e.target.value = "";
            }}
          />
        </div>
      )}

      {content.type === "audio" && (
        <div className="space-y-1.5">
          {content.url ? (
            <div className="flex items-center gap-2">
              <audio controls src={content.url} className="h-8 flex-1" />
              <Button
                variant="secondary"
                size="sm"
                icon={<Trash2 className="h-3.5 w-3.5" />}
                onClick={() => onChange({ type: "audio", url: "" })}
              >
                Remover
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  variant={audioMode === "record" ? "primary" : "secondary"}
                  size="sm"
                  icon={<Mic className="h-3.5 w-3.5" />}
                  onClick={() => setAudioMode("record")}
                  className="flex-1"
                >
                  Gravar
                </Button>
                <Button
                  variant={audioMode === "upload" ? "primary" : "secondary"}
                  size="sm"
                  icon={<Upload className="h-3.5 w-3.5" />}
                  onClick={() => setAudioMode("upload")}
                  className="flex-1"
                >
                  Enviar arquivo
                </Button>
              </div>

              {audioMode === "record" ? (
                <BotAudioRecorder
                  onUpload={(url) => onChange({ type: "audio", url })}
                />
              ) : (
                <div
                  className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-surface p-3 cursor-pointer hover:border-primary transition-colors text-xs text-neutral"
                  onClick={() => fileRef.current?.click()}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {uploading ? "Enviando..." : "Clique para enviar áudio (MP3, OGG, WAV · máx 10MB)"}
                </div>
              )}
            </div>
          )}
          <FileField
            ref={fileRef}
            hidden
            accept="audio/mpeg,audio/ogg,audio/wav,audio/webm,audio/mp4"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                if (file.size > 10 * 1024 * 1024) {
                  setUploadError("Tamanho máximo: 10MB.");
                  return;
                }
                handleFile(file, "audio");
              }
              e.target.value = "";
            }}
          />
        </div>
      )}

      {content.type === "pdf" && (
        <div>
          {content.url ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-neutral flex-1 truncate">
                <FileText className="h-4 w-4 shrink-0" />
                <span className="truncate">{content.filename}</span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                icon={<Trash2 className="h-3.5 w-3.5" />}
                onClick={() => onChange({ type: "pdf", url: "", filename: "" })}
              >
                Remover
              </Button>
            </div>
          ) : (
            <div
              className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-surface p-3 cursor-pointer hover:border-primary transition-colors text-xs text-neutral"
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              {uploading ? "Enviando..." : "Clique para enviar PDF (máx 10MB)"}
            </div>
          )}
          <FileField
            ref={fileRef}
            hidden
            accept="application/pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                if (file.size > 10 * 1024 * 1024) {
                  setUploadError("Tamanho máximo: 10MB.");
                  return;
                }
                handleFile(file, "pdf");
              }
              e.target.value = "";
            }}
          />
        </div>
      )}

      {uploadError && <p className="text-xs text-red-dark">{uploadError}</p>}
    </div>
  );
}

function AddContentButtons({ onAdd }: { onAdd: (c: BotContent) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="secondary"
        size="sm"
        icon={<Plus className="h-3 w-3" />}
        onClick={() => onAdd({ type: "text", value: "" })}
      >
        Texto
      </Button>
      <Button
        variant="secondary"
        size="sm"
        icon={<Plus className="h-3 w-3" />}
        onClick={() => onAdd({ type: "image", url: "" })}
      >
        Imagem
      </Button>
      <Button
        variant="secondary"
        size="sm"
        icon={<Plus className="h-3 w-3" />}
        onClick={() => onAdd({ type: "audio", url: "" })}
      >
        Áudio
      </Button>
      <Button
        variant="secondary"
        size="sm"
        icon={<Plus className="h-3 w-3" />}
        onClick={() => onAdd({ type: "pdf", url: "", filename: "" })}
      >
        PDF
      </Button>
    </div>
  );
}

function ConditionEditor({
  condition,
  allNodes,
  currentNodeId,
  onChange,
  onRemove,
}: {
  condition: BotCondition;
  allNodes: BotNode[];
  currentNodeId: string;
  onChange: (c: BotCondition) => void;
  onRemove: () => void;
}) {
  const nodeOptions = [
    { value: "", label: "— Fim do fluxo (sem resposta) —" },
    ...allNodes
      .filter((n) => n.id !== currentNodeId)
      .map((n) => {
        const realIdx = allNodes.indexOf(n);
        const firstText =
          n.contents[0]?.type === "text"
            ? (n.contents[0] as { value: string }).value
            : "";
        return {
          value: n.id,
          label: `Mensagem ${realIdx + 1}${firstText ? ` — ${firstText.slice(0, 40)}` : ""}`,
        };
      }),
  ];

  return (
    <div className="rounded-lg border border-border bg-surface-alt p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-neutral">Condição</span>
        <Button
          variant="ghost"
          size="sm"
          icon={<X className="h-3.5 w-3.5" />}
          onClick={onRemove}
          className="h-6 w-6 p-0 text-neutral hover:text-red-dark"
        />
      </div>
      <TextField
        label="Rótulo (ex: Opção 1 — por aqui)"
        placeholder="Opção 1"
        value={condition.label}
        onChange={(e) => onChange({ ...condition, label: e.target.value })}
      />
      <TextField
        label="Palavras-chave (separadas por vírgula)"
        placeholder="1, aqui, por aqui, manda aqui"
        value={condition.keywords.join(", ")}
        onChange={(e) =>
          onChange({
            ...condition,
            keywords: e.target.value
              .split(",")
              .map((k) => k.trim())
              .filter(Boolean),
          })
        }
      />
      <SelectField
        label="Ir para mensagem"
        value={condition.nextNodeId}
        onChange={(val) => onChange({ ...condition, nextNodeId: val })}
        placeholder="— Selecione —"
        options={nodeOptions}
      />
    </div>
  );
}

function NodeEditor({
  node,
  index,
  total,
  allNodes,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  node: BotNode;
  index: number;
  total: number;
  allNodes: BotNode[];
  onChange: (n: BotNode) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const otherNodes = allNodes.filter((n) => n.id !== node.id);

  function updateContent(i: number, c: BotContent) {
    const next = [...node.contents];
    next[i] = c;
    onChange({ ...node, contents: next });
  }

  function removeContent(i: number) {
    onChange({
      ...node,
      contents: node.contents.filter((_, idx) => idx !== i),
    });
  }

  function addContent(c: BotContent) {
    onChange({ ...node, contents: [...node.contents, c] });
  }

  function addCondition() {
    const condition: BotCondition = {
      id: uuidv4(),
      label: "",
      keywords: [],
      nextNodeId: "",
    };
    onChange({ ...node, conditions: [...(node.conditions ?? []), condition] });
  }

  function updateCondition(i: number, c: BotCondition) {
    const next = [...(node.conditions ?? [])];
    next[i] = c;
    onChange({ ...node, conditions: next });
  }

  function removeCondition(i: number) {
    onChange({
      ...node,
      conditions: (node.conditions ?? []).filter((_, idx) => idx !== i),
    });
  }

  const defaultNextOptions = otherNodes.map((n) => {
    const realIdx = allNodes.indexOf(n);
    return { value: n.id, label: `Mensagem ${realIdx + 1}` };
  });

  return (
    <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {index + 1}
          </span>
          <span className="text-sm font-medium text-foreground">
            Mensagem {index + 1}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            icon={<ChevronUp className="h-3.5 w-3.5" />}
            onClick={onMoveUp}
            disabled={index === 0}
            className="h-7 w-7 p-0"
          />
          <Button
            variant="ghost"
            size="sm"
            icon={<ChevronDown className="h-3.5 w-3.5" />}
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="h-7 w-7 p-0"
          />
          <Button
            variant="ghost"
            size="sm"
            icon={<Trash2 className="h-3.5 w-3.5" />}
            onClick={onRemove}
            className="h-7 w-7 p-0 text-neutral hover:text-red-dark"
          />
        </div>
      </div>

      <div className="space-y-2">
        {node.contents.map((c, i) => (
          <ContentEditor
            key={i}
            content={c}
            onChange={(updated) => updateContent(i, updated)}
            onRemove={() => removeContent(i)}
          />
        ))}
        <AddContentButtons onAdd={addContent} />
      </div>

      <div className="border-t border-border pt-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-medium text-neutral">
            <GitBranch className="h-3.5 w-3.5" />
            Condições (aguardar resposta e ramificar)
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={<Plus className="h-3 w-3" />}
            onClick={addCondition}
            className="text-xs text-primary h-auto py-0.5 px-1.5"
          >
            Adicionar condição
          </Button>
        </div>

        {(node.conditions ?? []).length > 0 && (
          <div className="space-y-2">
            {(node.conditions ?? []).map((cond, i) => (
              <ConditionEditor
                key={cond.id}
                condition={cond}
                allNodes={allNodes}
                currentNodeId={node.id}
                onChange={(updated) => updateCondition(i, updated)}
                onRemove={() => removeCondition(i)}
              />
            ))}
          </div>
        )}

        {(node.conditions ?? []).length === 0 && (
          <SelectField
            label="Próxima mensagem (sem condição)"
            value={node.defaultNextNodeId ?? ""}
            onChange={(val) =>
              onChange({ ...node, defaultNextNodeId: val || null })
            }
            placeholder="— Fim do fluxo —"
            options={defaultNextOptions}
            clearable
          />
        )}
      </div>
    </div>
  );
}

export function BotFlowSection({ form, update }: BotFlowSectionProps) {
  const flow: BotFlow = form.botFlow ?? { nodes: [] };

  function setFlow(next: BotFlow) {
    update("botFlow", next);
  }

  function addNode() {
    const newNode: BotNode = {
      id: uuidv4(),
      contents: [{ type: "text", value: "" }],
      conditions: [],
      defaultNextNodeId: null,
    };
    setFlow({ nodes: [...flow.nodes, newNode] });
  }

  function updateNode(id: string, updated: BotNode) {
    setFlow({ nodes: flow.nodes.map((n) => (n.id === id ? updated : n)) });
  }

  function removeNode(id: string) {
    setFlow({ nodes: flow.nodes.filter((n) => n.id !== id) });
  }

  function moveNode(index: number, direction: "up" | "down") {
    const next = [...flow.nodes];
    const target = direction === "up" ? index - 1 : index + 1;
    [next[index], next[target]] = [next[target], next[index]];
    setFlow({ nodes: next });
  }

  return (
    <SectionContainer
      title="Modo Bot"
      icon={<Bot className="h-5 w-5 text-secondary" />}
      actions={
        <CheckboxField
          variant="switch"
          checked={form.botFlowEnabled}
          onChange={(checked) => update("botFlowEnabled", checked)}
        />
      }
    >
      {!form.botFlowEnabled ? (
        <p className="text-sm text-neutral">
          Quando ativado, o bot segue um roteiro fixo de mensagens em vez de
          usar IA. A IA é desativada para os leads que passarem por esse fluxo.
        </p>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-neutral">
            Monte a sequência de mensagens. Cada mensagem pode ter texto,
            imagem, áudio e/ou PDF. Adicione <strong>condições</strong> para
            ramificar o fluxo com base na resposta do lead.
          </p>

          {flow.nodes.length === 0 && (
            <div className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-neutral">
              Nenhuma mensagem ainda. Clique em &quot;Adicionar mensagem&quot;
              para começar.
            </div>
          )}

          <div className="space-y-3">
            {flow.nodes.map((node, index) => (
              <NodeEditor
                key={node.id}
                node={node}
                index={index}
                total={flow.nodes.length}
                allNodes={flow.nodes}
                onChange={(updated) => updateNode(node.id, updated)}
                onRemove={() => removeNode(node.id)}
                onMoveUp={() => moveNode(index, "up")}
                onMoveDown={() => moveNode(index, "down")}
              />
            ))}
          </div>

          <Button
            variant="secondary"
            size="sm"
            icon={<Plus className="h-4 w-4" />}
            onClick={addNode}
          >
            Adicionar mensagem
          </Button>
        </div>
      )}
    </SectionContainer>
  );
}
