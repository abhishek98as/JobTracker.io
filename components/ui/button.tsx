import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[12px] border-2 border-slate-900 text-sm font-semibold transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-blue-600 text-white shadow-[4px_4px_0_rgb(15_23_42)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_rgb(15_23_42)]",
        destructive:
          "bg-red-500 text-white shadow-[4px_4px_0_rgb(15_23_42)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_rgb(15_23_42)]",
        outline:
          "bg-white text-slate-900 shadow-[4px_4px_0_rgb(15_23_42)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-[6px_6px_0_rgb(15_23_42)]",
        secondary:
          "bg-amber-200 text-slate-900 shadow-[4px_4px_0_rgb(15_23_42)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_rgb(15_23_42)]",
        ghost: "bg-transparent text-slate-900 shadow-none hover:bg-slate-100",
        link: "border-none bg-transparent p-0 text-blue-700 shadow-none underline-offset-4 hover:underline"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-[10px] px-3 text-xs",
        lg: "h-11 rounded-[14px] px-8 text-base",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => {
  return <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = "Button";

export { Button, buttonVariants };