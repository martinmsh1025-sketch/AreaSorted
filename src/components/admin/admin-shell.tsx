"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  ShoppingCart,
  Settings,
  Banknote,
  Receipt,
  LogOut,
  ShieldCheck,
  Target,
  MessageCircle,
  Mail,
  Globe,
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
import { useI18n } from "@/lib/i18n/context";
import { LOCALES, LOCALE_LABELS } from "@/lib/i18n/types";
import type { Locale } from "@/lib/i18n/types";
import type { TranslationKeys } from "@/lib/i18n/en";

function getAdminNavItems(t: TranslationKeys) {
  return [
    {
      group: t.nav.marketplace,
      items: [
        { href: "/admin/providers", label: t.nav.providers, icon: Users },
        { href: "/admin/customers", label: t.nav.customers, icon: Users },
        { href: "/admin/orders", label: t.nav.orders, icon: ShoppingCart },
        { href: "/admin/payouts", label: t.nav.payouts, icon: Banknote },
        { href: "/admin/refunds", label: t.nav.refunds, icon: Receipt },
      ],
    },
    {
      group: t.nav.acquisition,
      items: [
        { href: "/admin/leads", label: t.nav.leads, icon: Target },
        { href: "/admin/leads/whatsapp", label: t.nav.whatsapp, icon: MessageCircle },
        { href: "/admin/leads/email", label: t.nav.emailNav, icon: Mail },
      ],
    },
    {
      group: t.nav.system,
      items: [
        { href: "/admin/settings", label: t.nav.settings, icon: Settings },
      ],
    },
  ];
}

function AdminSidebarNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const adminNavItems = getAdminNavItems(t);

  return (
    <>
      {adminNavItems.map((group) => (
        <SidebarGroup key={group.group}>
          <SidebarGroupLabel>{group.group}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/admin" && pathname.startsWith(item.href));
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.label}
                      render={<Link href={item.href} />}
                    >
                      <item.icon className="size-4" />
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

function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="flex items-center gap-1.5 px-2 py-1">
      <Globe className="size-4 text-muted-foreground" />
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="flex h-7 flex-1 rounded-md border border-input bg-transparent px-2 text-xs shadow-sm group-data-[collapsible=icon]:hidden"
      >
        {LOCALES.map((l) => (
          <option key={l} value={l}>
            {LOCALE_LABELS[l]}
          </option>
        ))}
      </select>
    </div>
  );
}

interface AdminShellProps {
  children: React.ReactNode;
  adminEmail: string | null;
  logoutAction: () => Promise<void>;
}

export function AdminShell({ children, adminEmail, logoutAction }: AdminShellProps) {
  const { t } = useI18n();

  return (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" render={<Link href="/admin" />}>
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <ShieldCheck className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold">AreaSorted</span>
                  <span className="text-muted-foreground truncate text-xs">{t.common.adminPortal}</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <AdminSidebarNav />
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <LanguageSwitcher />
            </SidebarMenuItem>
            <SidebarMenuItem>
              <div className="flex items-center gap-2 px-2 py-1.5">
                <div className="bg-muted flex size-8 items-center justify-center rounded-full text-xs font-bold">
                  {adminEmail ? adminEmail.charAt(0).toUpperCase() : "A"}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="text-muted-foreground truncate text-xs">{adminEmail || t.common.admin}</span>
                </div>
              </div>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <form action={logoutAction}>
                <SidebarMenuButton type="submit" className="w-full">
                  <LogOut className="size-4" />
                  <span>{t.common.logout}</span>
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
            <Badge variant="outline" className="text-xs font-semibold">
              {t.common.admin}
            </Badge>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <form action={logoutAction}>
              <button type="submit" className="inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium text-muted-foreground hover:bg-muted">
                <LogOut className="size-3.5" />
                {t.common.logOut}
              </button>
            </form>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
