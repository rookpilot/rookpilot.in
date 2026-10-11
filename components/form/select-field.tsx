"use client";

import { useId } from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { NativeSelect } from "./native-select";

interface SelectFieldProps extends Omit<React.ComponentProps<"select">, "id"> {
  label: string;
}

export function SelectField({ label, className, children, ...props }: SelectFieldProps) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      <NativeSelect id={id} {...props}>
        {children}
      </NativeSelect>
    </div>
  );
}
