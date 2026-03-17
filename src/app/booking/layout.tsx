import { CustomerShell } from "@/components/layout/customer-shell";

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return <CustomerShell>{children}</CustomerShell>;
}
