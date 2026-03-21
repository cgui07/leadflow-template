import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Form, TextField } from "@/components/forms";
import type { RegenerateFormState } from "../hooks/usePlatformClients";

interface RegenerateActivationLinkModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  form: RegenerateFormState;
  onFieldChange: (field: keyof RegenerateFormState, value: string) => void;
  regenerating: boolean;
}

export function RegenerateActivationLinkModal({
  open,
  onClose,
  onSubmit,
  form,
  onFieldChange,
  regenerating,
}: RegenerateActivationLinkModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Gerar novo link"
      description="Use este fluxo quando o corretor não ativou a conta a tempo. Um novo link será gerado."
      size="md"
    >
      <Form onSubmit={onSubmit} className="space-y-4">
        <TextField
          label="Email do corretor"
          type="email"
          value={form.email}
          onChange={(event) => onFieldChange("email", event.target.value)}
          hint="O novo link será enviado para esse email."
          required
        />
        <TextField
          label="Validade do novo link em dias"
          type="number"
          min={1}
          max={30}
          value={form.expiresInDays}
          onChange={(event) => onFieldChange("expiresInDays", event.target.value)}
          required
        />

        <div className="rounded-xl border border-neutral-border bg-neutral-surface px-4 py-3 text-sm text-neutral-dark">
          O link anterior será encerrado automaticamente. Assim você evita dois
          acessos pendentes para o mesmo cliente.
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={regenerating}>
            Gerar link
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
