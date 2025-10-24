// components/ui/button.tsx
import { cn } from "@/lib/utils";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "outline" | "ghost";
  size?: "sm" | "md";
};
export default function Button({ className, variant="solid", size="md", ...props }: Props) {
  const base = "inline-flex items-center justify-center rounded-md border text-sm transition";
  const variants = {
    solid: "bg-brand/20 border-brand/40 hover:bg-brand/30",
    outline: "bg-transparent border-border hover:bg-subtle/60",
    ghost: "bg-transparent border-transparent hover:bg-subtle/60",
  } as const;
  const sizes = { sm: "px-2.5 py-1.5", md: "px-3 py-2" } as const;
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}
