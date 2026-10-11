"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

/**
 * A dialog for a form. Put the form's state in a child component: the dialog's content
 * unmounts when it closes, so the form starts fresh each time it opens.
 */
export function FormDialog({ open, onOpenChange, children }: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-md">{children}</DialogContent>
    </Dialog>
  );
}

interface DialogFormProps {
  title: string;
  description?: string;
  submitLabel: string;
  canSubmit?: boolean;
  onSubmit: () => void;
  children: React.ReactNode;
}

/** Header, fields, and Cancel / submit buttons for use inside FormDialog. */
export function DialogForm({ title, description, submitLabel, canSubmit = true, onSubmit, children }: DialogFormProps) {
  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) onSubmit();
      }}
    >
      <DialogHeader>
        <DialogTitle className="font-heading text-lg font-bold">{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
      </DialogHeader>
      <div className="flex flex-col gap-4">{children}</div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" disabled={!canSubmit}>
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
