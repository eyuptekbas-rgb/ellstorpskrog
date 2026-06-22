type Props = {
  label: string;
  children: React.ReactNode;
};

export default function PhoneMockup({ label, children }: Props) {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
        {label}
      </p>
      <div className="relative w-[220px] overflow-hidden rounded-[2rem] border-[6px] border-[#1a1a1a] bg-black shadow-2xl shadow-black/60">
        <div className="absolute left-1/2 top-2 z-10 h-1.5 w-16 -translate-x-1/2 rounded-full bg-[#1a1a1a]" />
        <div className="h-[420px] overflow-y-auto overflow-x-hidden pt-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
