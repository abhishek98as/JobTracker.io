import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "min-h-[96px] w-full rounded-[12px] border-2 border-slate-900 bg-white px-3 py-2 text-sm text-slate-900 shadow-[2px_2px_0_rgb(15_23_42)] transition duration-200 ease-out placeholder:text-slate-500 focus-visible:-translate-x-0.5 focus-visible:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };