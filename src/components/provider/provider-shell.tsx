"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ClipboardList,
  CreditCard,
  PoundSterling,
  ShoppingCart,
  UserCircle,
  FileText,
  LogOut,
  Building2,
  MapPin,
  Clock,
  Briefcase,
  Bell,
  Receipt,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { NotificationBell } from "@/components/provider/notification-bell";

/* ── Types ─────────────────────────────────── */

export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export interface NavGroup {
  label: string | null; // null = no section header (main group)
  items: NavItem[];
}

/* ── Icon mapping ──────────────────────────── */

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Home: Home,
  Onboarding: ClipboardList,
  Application: FileText,
  Payment: CreditCard,
  Coverage: MapPin,
  Pricing: PoundSterling,
  Availability: Clock,
  Orders: ShoppingCart,
  Account: UserCircle,
  Business: Briefcase,
  Notifications: Bell,
  Invoices: Receipt,
};

/* ── Helpers ───────────────────────────────── */

function statusVariant(status: string | null): "default" | "secondary" | "destructive" | "outline" {
  if (!status) return "outline";
  if (status === "ACTIVE") return "default";
  if (status === "SUSPENDED" || status === "REJECTED") return "destructive";
  return "secondary";
}

/* ── Grouped sidebar nav ──────────────────── */

function ProviderSidebarNav({ navGroups }: { navGroups: NavGroup[] }) {
  const pathname = usePathname();

  return (
    <>
      {navGroups.map((group, groupIdx) => (
        <SidebarGroup key={group.label ?? `main-${groupIdx}`}>
          {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => {
                const Icon = iconMap[item.icon] || Home;
                const isActive =
                  (item.href === "/provider" && pathname === "/provider") ||
                  (item.href !== "/provider" && pathname.startsWith(item.href));
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.label}
                      render={<Link href={item.href} />}
                    >
                      <Icon className="size-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}

/* ── Shell ─────────────────────────────────── */

interface ProviderShellProps {
  children: React.ReactNode;
  providerName: string | null;
  providerStatus: string | null;
  statusLabel: string | null;
  navGroups: NavGroup[];
  logoutAction: () => Promise<void>;
}

export function ProviderShell({
  children,
  providerName,
  providerStatus,
  statusLabel,
  navGroups,
  logoutAction,
}: ProviderShellProps) {
  if (!providerName) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" render={<Link href="/provider" />}>
                <div className="bg-blue-600 text-white flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Building2 className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold">{providerName || "AreaSorted"}</span>
                  <span className="text-muted-foreground truncate text-xs">Provider Portal</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <ProviderSidebarNav navGroups={navGroups} />
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            {providerStatus && (
              <SidebarMenuItem>
                <div className="px-2 py-1.5 group-data-[collapsible=icon]:hidden">
                  <Badge variant={statusVariant(providerStatus)} className="text-xs">
                    {statusLabel || providerStatus}
                  </Badge>
                </div>
              </SidebarMenuItem>
            )}
            <SidebarMenuItem>
              <form action={logoutAction}>
                <SidebarMenuButton type="submit" className="w-full">
                  <LogOut className="size-4" />
                  <span>Log Out</span>
                </SidebarMenuButton>
              </form>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="bg-background sticky top-0 z-10 flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-semibold text-blue-700 border-blue-200">
              Provider
            </Badge>
            {providerName && (
              <span className="text-muted-foreground text-sm hidden sm:inline">{providerName}</span>
            )}
          </div>
          <div className="ml-auto">
            <NotificationBell />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
