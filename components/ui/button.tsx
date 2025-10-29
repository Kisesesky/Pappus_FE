// components/ui/button.tsx
import React from "react";
import { cn } from "@/lib/utils";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md";
  asChild?: boolean;
};

export default function Button({
  className,
  variant = "primary",
  size = "md",
  asChild = false,
  children,
  ...props
}: Props) {
  const base =
    "inline-flex items-center justify-center rounded-md border text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background";
  const variants = {
    primary: "border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary/85",
    outline: "border-border bg-background text-foreground shadow-sm hover:border-primary/60 hover:bg-accent",
    ghost: "border-transparent text-muted hover:bg-accent"
  } as const;
  const sizes = {
    sm: "px-2.5 py-1.5",
    md: "px-3.5 py-2"
  } as const;
  const classes = cn(base, variants[variant], sizes[size], className);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      className: cn(
        (children.props as { className?: string }).className,
        classes
      )
    });
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
