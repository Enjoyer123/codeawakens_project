import { cn } from '@/lib/utils';

/**
 * Reusable form textarea component with label
 */
const FormTextarea = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  rows = 4,
  error,
  className,
  labelClassName,
  textareaClassName,
  ...props
}) => {
  const textareaId = name || `textarea-${label?.replace(/\s+/g, '-').toLowerCase()}`;

  const defaultTextareaClassName = cn(
    'w-full border border-gray-300 rounded-md px-3 py-2 text-sm',
    'focus:outline-none focus:ring-2 focus:ring-primary',
    'resize-y',
    error && 'border-red-500',
    textareaClassName
  );

  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <label
          htmlFor={textareaId}
          className={cn(
            'block text-sm font-medium text-gray-700 mb-1',
            labelClassName
          )}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={defaultTextareaClassName}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
};

export default FormTextarea;

