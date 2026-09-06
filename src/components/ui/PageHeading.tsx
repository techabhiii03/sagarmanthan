interface PageHeadingProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export default function PageHeading({ title, description, actions }: PageHeadingProps) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-base font-semibold text-text-main">{title}</h1>
        {description && (
          <p className="mt-0.5 text-sm text-text-sub">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
