type Props = {
  label?: string;
  size?: "sm" | "md" | "lg";
};

export default function LoadingSpinner({ label, size = "md" }: Props) {
  const sizeClass =
    size === "sm" ? "h-5 w-5 border-2" : size === "lg" ? "h-10 w-10 border-[3px]" : "h-7 w-7 border-2";

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div
        className={`${sizeClass} animate-spin rounded-full border-[#b85c38]/30 border-t-[#b85c38]`}
        role="status"
        aria-label={label ?? "Laddar"}
      />
      {label && <p className="text-sm text-white/50">{label}</p>}
    </div>
  );
}
