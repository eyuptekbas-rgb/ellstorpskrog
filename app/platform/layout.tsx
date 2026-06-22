import PlatformShell from "@/app/platform/PlatformShell";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return <PlatformShell>{children}</PlatformShell>;
}
