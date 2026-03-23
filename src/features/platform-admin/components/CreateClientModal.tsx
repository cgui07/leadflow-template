import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Form, TextField } from "@/components/forms";
import type { ClientFormState } from "../hooks/usePlatformClients";

interface CreateClientModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  form: ClientFormState;
  onFieldChange: (field: keyof ClientFormState, value: string) => void;
  creating: boolean;
}

export function CreateClientModal({
  open,
  onClose,
  onSubmit,
  form,
  onFieldChange,
  creating,
}: CreateClientModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Novo cliente"
      description="Crie o workspace do corretor. Um link de ativação será gerado para enviar ao cliente."
      size="md"
    >
      <Form onSubmit={onSubmit} className="space-y-4">
        <TextField
          label="Nome do cliente"
          value={form.name}
          onChange={(event) => onFieldChange("name", event.target.value)}
          placeholder="Ex: João Silva Imoveis"
          required
        />
        <input type="hidden" name="slug" value={form.slug} />
        <TextField
          label="Email do corretor"
          type="email"
          value={form.ownerEmail}
          onChange={(event) => onFieldChange("ownerEmail", event.target.value)}
          placeholder="corretor@email.com"
          hint="O link de ativação será enviado para esse email."
          required
        />
        <TextField
          label="Validade do link em dias"
          type="number"
          min={1}
          max={30}
          value={form.expiresInDays}
          onChange={(event) => onFieldChange("expiresInDays", event.target.value)}
          required
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={creating}>
            Criar cliente
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
