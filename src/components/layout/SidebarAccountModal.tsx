import Link from "next/link";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { LogOut, Settings } from "lucide-react";

interface SidebarAccountModalProps {
  open: boolean;
  onClose: () => void;
  brandChipClass: string;
  userName: string;
  userEmail: string;
  userInitial: string;
  loggingOut: boolean;
  onLogout: () => void;
}

export function SidebarAccountModal({
  open,
  onClose,
  brandChipClass,
  userName,
  userEmail,
  userInitial,
  loggingOut,
  onLogout,
}: SidebarAccountModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Sua conta"
      description="Acesse os dados da sua sessão e saia quando precisar."
      size="sm"
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3 rounded-xl bg-neutral-surface p-4">
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-bold text-white",
              brandChipClass,
            )}
          >
            {userInitial}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-neutral-ink">
              {userName}
            </div>
            <div className="truncate text-sm text-neutral">{userEmail}</div>
          </div>
        </div>
        <Link
          href="/settings"
          onClick={onClose}
          className="flex w-full items-center gap-3 rounded-xl border border-neutral-border px-4 py-3 text-sm font-medium text-neutral-dark transition-colors hover:bg-neutral-surface"
        >
          <Settings size={18} />
          Configurações
        </Link>

        <Button
          variant="danger"
          fullWidth
          loading={loggingOut}
          icon={<LogOut className="h-4 w-4" />}
          onClick={onLogout}
        >
          {loggingOut ? "Saindo..." : "Log out"}
        </Button>
      </div>
    </Modal>
  );
}
