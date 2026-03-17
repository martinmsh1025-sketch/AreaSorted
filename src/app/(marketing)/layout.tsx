import { CustomerShell } from "@/components/layout/customer-shell";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <CustomerShell>{children}</CustomerShell>;
}
