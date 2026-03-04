import * as React from "react";
import { cn } from "@/lib/utils";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        "h-10 w-full rounded-[12px] border-2 border-slate-900 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-[2px_2px_0_rgb(15_23_42)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});
Select.displayName = "Select";