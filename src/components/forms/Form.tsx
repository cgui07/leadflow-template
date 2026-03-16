import { cn } from "@/lib/utils";
import { forwardRef } from "react";
import type { FormHTMLAttributes } from "react";

type FormProps = FormHTMLAttributes<HTMLFormElement>;

export const Form = forwardRef<HTMLFormElement, FormProps>(
  ({ className, ...props }, ref) => {
    return <form ref={ref} className={cn(className)} {...props} />;
  },
);

Form.displayName = "Form";
