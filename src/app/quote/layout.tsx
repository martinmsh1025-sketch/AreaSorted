import { CustomerShell } from "@/components/layout/customer-shell";

export default function QuoteLayout({ children }: { children: React.ReactNode }) {
  return <CustomerShell>{children}</CustomerShell>;
}
