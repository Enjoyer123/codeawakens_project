import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * Reusable form input component with label and error handling
 */
const FormInput = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  disabled = false,
  error,
  className,
  labelClassName,
  ...props
}) => {
  const inputId = name || `input-${label?.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            'block text-sm font-medium text-gray-700 mb-1',
            labelClassName
          )}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <Input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(error && 'border-red-500')}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
};

export default FormInput;

