import { Logo } from "@/components/brand/logo";
import { AuthShowcase } from "@/features/auth/components/auth-showcase";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="flex flex-col gap-10 bg-card px-4 py-8 sm:px-10">
        <Logo href="/signup" />
        <main className="flex flex-1 items-center justify-center">{children}</main>
      </div>
      <aside className="hidden border-l bg-sidebar lg:block">
        <AuthShowcase />
      </aside>
    </div>
  );
}
