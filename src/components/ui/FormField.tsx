import type { InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';

interface BaseProps {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
}

type InputProps = BaseProps & {
  as?: 'input';
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'id'>;

type SelectProps = BaseProps & {
  as: 'select';
  children: ReactNode;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'>;

type FormFieldProps = InputProps | SelectProps;

const fieldClass =
  'mt-1 block w-full rounded border border-border-base bg-white px-2.5 py-1.5 text-sm text-text-main placeholder:text-text-sub focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';

export default function FormField(props: FormFieldProps) {
  const { id, label, required, hint, error, className, as, ...rest } = props;

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-xs font-medium text-text-main">
        {label}
        {required && <span className="ml-0.5 text-risk" aria-hidden="true">*</span>}
      </label>

      {as === 'select' ? (
        <select id={id} className={fieldClass} aria-required={required} aria-describedby={hint || error ? `${id}-desc` : undefined} {...(rest as SelectHTMLAttributes<HTMLSelectElement>)}>
          {(props as SelectProps).children}
        </select>
      ) : (
        <input id={id} className={`${fieldClass} ${error ? 'border-risk' : ''}`} aria-required={required} aria-describedby={hint || error ? `${id}-desc` : undefined} aria-invalid={!!error} {...(rest as InputHTMLAttributes<HTMLInputElement>)} />
      )}

      {(hint || error) && (
        <p id={`${id}-desc`} className={`mt-0.5 text-xs ${error ? 'text-risk' : 'text-text-sub'}`}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
