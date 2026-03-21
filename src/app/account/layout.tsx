import { CustomerShell } from "@/components/layout/customer-shell";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <CustomerShell>{children}</CustomerShell>;
}
