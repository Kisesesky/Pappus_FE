// components/ui/input.tsx
import { cn } from "@/lib/utils";
type Props = React.InputHTMLAttributes<HTMLInputElement>;
export default function Input({ className, ...props }: Props) {
  return (
    <input
      className={cn(
        "w-full bg-subtle/60 border border-border rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-brand/60",
        className
      )}
      {...props}
    />
  );
}
