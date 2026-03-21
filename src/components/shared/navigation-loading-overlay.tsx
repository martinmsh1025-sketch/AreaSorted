"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { PageLoading } from "@/components/shared/page-loading";

function isInternalNavigationLink(anchor: HTMLAnchorElement) {
  if (!anchor.href) return false;
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;

  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return false;

  const current = new URL(window.location.href);
  if (url.pathname === current.pathname && url.search === current.search && url.hash === current.hash) {
    return false;
  }

  return true;
}

export function NavigationLoadingOverlay() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const originRouteRef = useRef<string>("");
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const routeKey = `${pathname}?${searchParams.toString()}`;

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a") as HTMLAnchorElement | null;
      if (!anchor || !isInternalNavigationLink(anchor)) return;

      startedAtRef.current = Date.now();
      originRouteRef.current = routeKey;
      setLoading(true);

      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = setTimeout(() => {
        setLoading(false);
      }, 2500);
    };

    const handleSubmit = (event: Event) => {
      if (event.defaultPrevented) return;
      const target = event.target;
      if (!(target instanceof HTMLFormElement)) return;

      startedAtRef.current = Date.now();
      originRouteRef.current = routeKey;
      setLoading(true);

      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = setTimeout(() => {
        setLoading(false);
      }, 2500);
    };

    document.addEventListener("click", handleClick, true);
    document.addEventListener("submit", handleSubmit, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("submit", handleSubmit, true);
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!loading) return;
    if (!originRouteRef.current || routeKey === originRouteRef.current) return;

    const elapsed = startedAtRef.current ? Date.now() - startedAtRef.current : 0;
    const remaining = Math.max(220 - elapsed, 0);

    const timer = setTimeout(() => {
      setLoading(false);
      startedAtRef.current = null;
      originRouteRef.current = "";
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    }, remaining);

    return () => clearTimeout(timer);
  }, [routeKey, loading]);

  if (!loading) return null;

  return (
    <PageLoading
      fullscreen
      title="Loading page..."
      message="Please wait while AreaSorted gets everything ready."
    />
  );
}
