type Props = {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function AccountField({
  id,
  label,
  type = "text",
  autoComplete,
  required = true,
  value,
  onChange,
  placeholder,
}: Props) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.1em] text-white/45"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#b85c38]/50 focus:outline-none"
      />
    </div>
  );
}

export function AccountSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#141414]">
      <div className="border-b border-white/[0.06] px-5 py-3.5">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
