import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
};

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
};

const fieldClass =
  "w-full rounded-2xl border border-white/[0.08] bg-[#0c0c0c] px-4 py-3.5 text-white placeholder:text-white/28 transition focus:border-[#b85c38]/45 focus:bg-[#0e0e0e] focus:outline-none focus:ring-2 focus:ring-[#b85c38]/12";

export function FormInput({ label, hint, id, className, ...props }: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-sm font-medium text-white/85">
        {label}
        {props.required && <span className="ml-0.5 text-[#b85c38]">*</span>}
      </label>
      <input id={inputId} className={`${fieldClass} ${className ?? ""}`} {...props} />
      {hint && <p className="text-xs text-white/35">{hint}</p>}
    </div>
  );
}

export function FormTextarea({
  label,
  hint,
  id,
  className,
  ...props
}: TextareaProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-sm font-medium text-white/85">
        {label}
      </label>
      <textarea
        id={inputId}
        className={`${fieldClass} resize-none ${className ?? ""}`}
        {...props}
      />
      {hint && <p className="text-xs text-white/35">{hint}</p>}
    </div>
  );
}
