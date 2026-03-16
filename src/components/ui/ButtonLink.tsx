import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import {
  getButtonClassName,
  type ButtonSize,
  type ButtonVariant,
} from "./Button";

interface ButtonLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "href"> {
  children: ReactNode;
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
  external?: boolean;
}

function isExternalHref(href: string) {
  return href.startsWith("http://") || href.startsWith("https://");
}

function ButtonLinkContent({
  children,
  icon,
  iconRight,
}: Pick<ButtonLinkProps, "children" | "icon" | "iconRight">) {
  return (
    <>
      {icon}
      {children}
      {iconRight}
    </>
  );
}

export function ButtonLink({
  children,
  href,
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  fullWidth,
  external,
  className,
  rel,
  target,
  ...props
}: ButtonLinkProps) {
  const isExternal = external ?? isExternalHref(href);
  const buttonClassName = getButtonClassName({
    variant,
    size,
    fullWidth,
    className,
  });
  const linkContent = (
    <ButtonLinkContent icon={icon} iconRight={iconRight}>
      {children}
    </ButtonLinkContent>
  );

  if (isExternal) {
    return (
      <a
        className={buttonClassName}
        href={href}
        rel={rel ?? (target === "_blank" ? "noreferrer" : undefined)}
        target={target}
        {...props}
      >
        {linkContent}
      </a>
    );
  }

  return (
    <Link className={buttonClassName} href={href} {...props}>
      {linkContent}
    </Link>
  );
}
