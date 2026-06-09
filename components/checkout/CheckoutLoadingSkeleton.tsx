export default function CheckoutLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="rounded-3xl border border-white/5 bg-[#1a1a1a] p-5 space-y-4">
        <div className="h-5 w-32 rounded-lg bg-white/10" />
        <div className="h-12 w-full rounded-2xl bg-white/5" />
        <div className="h-12 w-full rounded-2xl bg-white/5" />
        <div className="h-12 w-full rounded-2xl bg-white/5" />
      </div>
      <div className="rounded-3xl border border-white/5 bg-[#1a1a1a] p-5 space-y-3">
        <div className="h-5 w-40 rounded-lg bg-white/10" />
        <div className="h-16 w-full rounded-2xl bg-white/5" />
        <div className="h-16 w-full rounded-2xl bg-white/5" />
      </div>
      <div className="rounded-3xl border border-white/5 bg-[#1a1a1a] p-5 space-y-3">
        <div className="h-5 w-36 rounded-lg bg-white/10" />
        <div className="h-14 w-full rounded-2xl bg-white/5" />
        <div className="h-14 w-full rounded-2xl bg-white/5" />
      </div>
    </div>
  );
}
