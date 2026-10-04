import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius,12px)] text-sm font-semibold cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        gradient:
          "bg-gradient-to-r from-[var(--color-primary,var(--primary))] to-[var(--color-secondary,var(--primary-hover))] text-white shadow-lg shadow-[var(--color-primary)]/20 hover:brightness-105 active:scale-[0.98]",
        destructive: "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-[40px] h-10 px-4 py-2 text-xs sm:text-[13px] font-semibold rounded-[var(--radius,12px)]",
        sm: "min-h-[34px] h-8.5 px-3 py-1 text-[11px] font-semibold rounded-[calc(var(--radius,12px)-4px)]",
        lg: "min-h-[44px] h-11 px-4.5 py-2.5 text-xs sm:text-sm font-bold rounded-[var(--radius,12px)]",
        icon: "min-h-[38px] min-w-[38px] h-9.5 w-9.5 rounded-[var(--radius,12px)] [&_svg]:size-4.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
export { PrimaryButton, type PrimaryButtonProps } from "./PrimaryButton";

