interface PageHeaderProps {
  title: string;
  /** Small mono label above the title, like the building's name. */
  eyebrow?: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageHeader({ title, eyebrow, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1.5">
        {eyebrow && <p className="eyebrow truncate">{eyebrow}</p>}
        <h1 className="text-3xl font-bold tracking-[-0.02em] sm:text-4xl">{title}</h1>
        {description && <p className="max-w-[68ch] text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
