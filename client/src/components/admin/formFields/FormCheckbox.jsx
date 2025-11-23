import { cn } from '@/lib/utils';

/**
 * Reusable form checkbox component with label
 */
const FormCheckbox = ({
  label,
  name,
  checked,
  onChange,
  disabled = false,
  error,
  className,
  labelClassName,
  checkboxClassName,
  ...props
}) => {
  const checkboxId = name || `checkbox-${label?.replace(/\s+/g, '-').toLowerCase()}`;

  const defaultCheckboxClassName = cn(
    'w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary',
    checkboxClassName
  );

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <input
        type="checkbox"
        id={checkboxId}
        name={name}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={defaultCheckboxClassName}
        {...props}
      />
      {label && (
        <label
          htmlFor={checkboxId}
          className={cn(
            'text-sm font-medium text-gray-700 cursor-pointer',
            disabled && 'cursor-not-allowed opacity-50',
            labelClassName
          )}
        >
          {label}
        </label>
      )}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default FormCheckbox;

