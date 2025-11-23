import { cn } from '@/lib/utils';

/**
 * Reusable form select component with label
 */
const FormSelect = ({
  label,
  name,
  value,
  onChange,
  options = [],
  required = false,
  disabled = false,
  error,
  className,
  labelClassName,
  selectClassName,
  placeholder,
  ...props
}) => {
  const selectId = name || `select-${label?.replace(/\s+/g, '-').toLowerCase()}`;

  const defaultSelectClassName = cn(
    'w-full border border-gray-300 rounded-md px-3 py-2 text-sm',
    'focus:outline-none focus:ring-2 focus:ring-primary',
    error && 'border-red-500',
    selectClassName
  );

  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <label
          htmlFor={selectId}
          className={cn(
            'block text-sm font-medium text-gray-700 mb-1',
            labelClassName
          )}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        id={selectId}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={defaultSelectClassName}
        {...props}
      >
        {placeholder && (
          <option value="">{placeholder}</option>
        )}
        {options.map((option) => {
          const optionValue = typeof option === 'object' ? option.value : option;
          const optionLabel = typeof option === 'object' ? option.label : option;
          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
};

export default FormSelect;

