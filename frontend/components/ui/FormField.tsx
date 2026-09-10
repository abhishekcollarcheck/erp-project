'use client';
import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { UseFormRegisterReturn, FieldError } from 'react-hook-form';
import { Dropdown } from 'primereact/dropdown';

interface BaseFieldProps {
  label: string;
  error?: FieldError;
  required?: boolean;
  hint?: string;
}

interface InputFieldProps extends BaseFieldProps, InputHTMLAttributes<HTMLInputElement> {
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'tel';
  register?: UseFormRegisterReturn;
}

interface SelectFieldProps extends BaseFieldProps, SelectHTMLAttributes<HTMLSelectElement> {
  register?: UseFormRegisterReturn;
  options: { value: string | number; label: string }[];
  placeholder?: string;
}

interface TextareaFieldProps extends BaseFieldProps, TextareaHTMLAttributes<HTMLTextAreaElement> {
  register?: UseFormRegisterReturn;
}

export function InputField({ label, error, required, hint, register, ...rest }: InputFieldProps) {
  return (
    <div className="fg">
      <label>{label}{required && ' *'}</label>
      <input {...register} {...rest} />
      {hint && !error && <span style={{ fontSize: 10, color: 'var(--ink4)' }}>{hint}</span>}
      {error && <span className="err">{error.message}</span>}
    </div>
  );
}

export function SelectField({ label, error, required, hint, register, options, placeholder, value, onChange, disabled, name }: SelectFieldProps) {
  // Bridge react-hook-form's register() (built for a native <select>) onto the
  // PrimeReact <Dropdown> by synthesising the change event it expects.
  const emit = (val: string | number) => {
    register?.onChange({ target: { name: register.name ?? name, value: val }, type: 'change' } as any);
    onChange?.({ target: { value: val } } as any);
  };
  return (
    <div className="fg">
      <label>{label}{required && ' *'}</label>
      <Dropdown
        name={(register?.name ?? name) as string}
        value={(value as any) ?? ''}
        options={options}
        optionLabel="label"
        optionValue="value"
        placeholder={placeholder}
        disabled={disabled}
        filter
        style={{ width: '100%' }}
        onChange={(e) => emit(e.value)}
        onBlur={register?.onBlur as any}
      />
      {hint && !error && <span style={{ fontSize: 10, color: 'var(--ink4)' }}>{hint}</span>}
      {error && <span className="err">{error.message}</span>}
    </div>
  );
}

export function TextareaField({ label, error, required, hint, register, ...rest }: TextareaFieldProps) {
  return (
    <div className="fg">
      <label>{label}{required && ' *'}</label>
      <textarea {...register} {...rest} />
      {hint && !error && <span style={{ fontSize: 10, color: 'var(--ink4)' }}>{hint}</span>}
      {error && <span className="err">{error.message}</span>}
    </div>
  );
}
