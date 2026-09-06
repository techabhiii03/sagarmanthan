export default function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-2 text-sm font-semibold text-text-main">{title}</div>
      <p className="text-sm text-text-sub max-w-xs">
        This module is not yet available in this prototype build. Navigation links are wired; content will be added in subsequent development phases.
      </p>
    </div>
  );
}
