"use client";

import { useId } from "react";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface TextareaFieldProps extends Omit<React.ComponentProps<typeof Textarea>, "id"> {
  label: string;
  optional?: boolean;
}

export function TextareaField({ label, optional, className, ...props }: TextareaFieldProps) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>
        {label}
        {optional && <span className="font-normal text-muted-foreground">(optional)</span>}
      </Label>
      <Textarea id={id} rows={3} {...props} />
    </div>
  );
}
