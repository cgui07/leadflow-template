import { cn } from "@/lib/utils";
import { ButtonLink, WhatsAppIcon } from "@/components/ui";
import type { LandingAction } from "@/features/landing/content";

interface LandingContactActionProps {
  action: LandingAction;
  align?: "start" | "center" | "mobile-center";
  buttonClassName?: string;
  noteClassName?: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

export function LandingContactAction({
  action,
  align = "start",
  buttonClassName,
  noteClassName,
  showIcon = true,
  size = "md",
}: LandingContactActionProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" && "items-center text-center",
        align === "start" && "items-start text-left",
        align === "mobile-center" &&
          "items-center text-center sm:items-start sm:text-left",
      )}
    >
      <ButtonLink
        className={buttonClassName}
        external={action.external}
        href={action.href}
        icon={
          showIcon ? <WhatsAppIcon className="h-4 w-4 shrink-0" /> : undefined
        }
        rel={action.external ? "noreferrer" : undefined}
        size={size}
        target={action.external ? "_blank" : undefined}
      >
        {action.label}
      </ButtonLink>
      {action.description ? (
        <div
          className={cn(
            "max-w-md text-sm leading-6 text-neutral",
            noteClassName,
          )}
        >
          {action.description}
        </div>
      ) : null}
    </div>
  );
}
