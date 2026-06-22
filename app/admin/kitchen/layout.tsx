export default function KitchenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="max-w-none">{children}</div>;
}
