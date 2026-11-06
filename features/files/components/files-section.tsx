"use client";

import { FileText, Paperclip, Upload } from "lucide-react";
import { useId, useRef, useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { DialogForm, FormDialog } from "@/components/form/form-dialog";
import { FormField } from "@/components/form/form-field";
import { NativeSelect } from "@/components/form/native-select";
import { RowMenu } from "@/components/row-menu";
import { Button } from "@/components/ui/button";
import { useSignedUrl } from "@/hooks/use-signed-url";
import { ATTACHMENT_ACCEPT, formatBytes } from "@/lib/data/files";
import { useAppData } from "@/lib/data/store";
import type { Attachment, AttachmentKind } from "@/lib/domain/models";
import { cn } from "@/lib/utils";

import { ATTACHMENT_KIND_LABELS, fileActions, type FileTarget } from "../actions";

const KINDS = Object.keys(ATTACHMENT_KIND_LABELS) as AttachmentKind[];

function matches(attachment: Attachment, target: FileTarget) {
  if ("itemId" in target) return attachment.itemId === target.itemId;
  if ("workId" in target) return attachment.workId === target.workId;
  return attachment.logEntryId === target.logEntryId;
}

/** The files attached to one thing, in upload order. */
function useFiles(target: FileTarget): Attachment[] {
  const data = useAppData();
  return data?.attachments.filter((a) => matches(a, target)) ?? [];
}

/** Opens the file picker and uploads what's picked. `uploading` counts files still on their way. */
function useUploader(buildingId: string, target: FileTarget) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const inputId = useId();

  async function upload(files: File[]) {
    if (files.length === 0) return;
    setUploading((n) => n + files.length);
    try {
      await fileActions.upload(buildingId, target, files);
    } finally {
      setUploading((n) => n - files.length);
    }
  }

  const picker = (
    <>
      <label htmlFor={inputId} className="sr-only">
        Add files
      </label>
      <input
        ref={input}
        id={inputId}
        type="file"
        multiple
        accept={ATTACHMENT_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          void upload([...(e.target.files ?? [])]);
          e.target.value = "";
        }}
      />
    </>
  );
  return { pick: () => input.current?.click(), uploading, picker };
}

interface FilesSectionProps {
  buildingId: string;
  target: FileTarget;
}

/** Photos, receipts, and manuals for an item or a project or repair. */
export function FilesSection({ buildingId, target }: FilesSectionProps) {
  const files = useFiles(target);
  const { pick, uploading, picker } = useUploader(buildingId, target);
  const [renaming, setRenaming] = useState<Attachment | null>(null);
  const [deleting, setDeleting] = useState<Attachment | null>(null);

  return (
    <section className="flex flex-col gap-3" aria-label="Files">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">Files</h3>
        <Button variant="outline" size="sm" onClick={pick} disabled={uploading > 0}>
          <Upload data-icon="inline-start" />
          {uploading > 0 ? `Uploading ${uploading}…` : "Add files"}
        </Button>
        {picker}
      </div>

      {files.length === 0 && uploading === 0 ? (
        <EmptyState>No files yet. Add a photo, receipt, or manual.</EmptyState>
      ) : (
        <ul className="flex flex-col divide-y overflow-hidden surface empty:hidden">
          {files.map((file) => (
            <FileRow key={file.id} file={file} onRename={() => setRenaming(file)} onDelete={() => setDeleting(file)} />
          ))}
        </ul>
      )}

      <RenameDialog file={renaming} onOpenChange={(open) => !open && setRenaming(null)} />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete ${deleting?.fileName ?? "file"}?`}
        description="The file is removed for everyone who shares this building."
        confirmLabel="Delete file"
        onConfirm={() => deleting && fileActions.remove(deleting.id)}
      />
    </section>
  );
}

function FileRow({ file, onRename, onDelete }: { file: Attachment; onRename: () => void; onDelete: () => void }) {
  const url = useSignedUrl("attachments", file.storagePath);
  const isImage = file.contentType.startsWith("image/");

  return (
    <li className="flex items-center gap-3 px-3 py-2">
      <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-muted-foreground">
        {isImage && url ? (
          // A signed link to a private file; next/image can't optimize it.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="size-full object-cover" />
        ) : (
          <FileText className="size-4" aria-hidden="true" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        {url ? (
          <a href={url} target="_blank" rel="noopener noreferrer" className="block truncate text-sm font-medium hover:underline">
            {file.fileName}
          </a>
        ) : (
          <span className="block truncate text-sm font-medium">{file.fileName}</span>
        )}
        <span className="block truncate text-xs text-muted-foreground">{formatBytes(file.sizeBytes)}</span>
      </div>
      <NativeSelect
        aria-label={`Type of ${file.fileName}`}
        className="w-28"
        value={file.kind}
        onChange={(e) => fileActions.setKind(file.id, e.target.value as AttachmentKind)}
      >
        {KINDS.map((kind) => (
          <option key={kind} value={kind}>
            {ATTACHMENT_KIND_LABELS[kind]}
          </option>
        ))}
      </NativeSelect>
      <RowMenu label={file.fileName} onEdit={onRename} onDelete={onDelete} />
    </li>
  );
}

function RenameDialog({ file, onOpenChange }: { file: Attachment | null; onOpenChange: (open: boolean) => void }) {
  return (
    <FormDialog open={file !== null} onOpenChange={onOpenChange}>
      {file && (
        <RenameForm
          file={file}
          onSave={(name) => {
            fileActions.rename(file.id, name);
            onOpenChange(false);
          }}
        />
      )}
    </FormDialog>
  );
}

function RenameForm({ file, onSave }: { file: Attachment; onSave: (name: string) => void }) {
  const [name, setName] = useState(file.fileName);
  return (
    <DialogForm title="Rename file" submitLabel="Save" canSubmit={name.trim().length > 0} onSubmit={() => onSave(name)}>
      <FormField label="Name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
    </DialogForm>
  );
}

/** A small row of file links and an attach button, for a history entry. */
export function InlineFiles({ buildingId, target, label }: FilesSectionProps & { label: string }) {
  const files = useFiles(target);
  const { pick, uploading, picker } = useUploader(buildingId, target);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {files.map((file) => (
        <FileChip key={file.id} file={file} />
      ))}
      <Button
        variant="ghost"
        size="icon-sm"
        className={cn("text-muted-foreground", uploading > 0 && "animate-pulse")}
        aria-label={`Attach a file to ${label}`}
        title="Attach a file"
        disabled={uploading > 0}
        onClick={pick}
      >
        <Paperclip />
      </Button>
      {picker}
    </div>
  );
}

function FileChip({ file }: { file: Attachment }) {
  const url = useSignedUrl("attachments", file.storagePath);
  const body = (
    <>
      <FileText className="size-3" aria-hidden="true" />
      <span className="max-w-32 truncate">{file.fileName}</span>
    </>
  );
  const className = "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs text-muted-foreground";
  return url ? (
    <a href={url} target="_blank" rel="noopener noreferrer" className={cn(className, "hover:bg-accent hover:text-foreground")}>
      {body}
    </a>
  ) : (
    <span className={className}>{body}</span>
  );
}
