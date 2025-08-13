"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ children, className, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
    <DialogPrimitive.Content
      ref={ref}
      className={`fixed z-50 bg-white dark:bg-gray-900 p-6 rounded-md max-w-lg w-full shadow-lg top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${className}`}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
        <X size={18} />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DialogContent.displayName = "DialogContent";

export const DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={`text-lg font-semibold mb-4 ${className}`} {...props} />
);
