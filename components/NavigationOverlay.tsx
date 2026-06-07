"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export const NAVIGATION_LOADING_EVENT = "omnipay:navigation-start";

export function startNavigationLoading() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(NAVIGATION_LOADING_EVENT));
  }
}

export function NavigationOverlay() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    function handleStart() {
      setIsVisible(true);
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setIsVisible(false), 8000);
    }

    window.addEventListener(NAVIGATION_LOADING_EVENT, handleStart);
    return () => {
      window.removeEventListener(NAVIGATION_LOADING_EVENT, handleStart);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const timeoutId = setTimeout(() => setIsVisible(false), 180);
    return () => clearTimeout(timeoutId);
  }, [pathname, isVisible]);

  if (!isVisible) return null;

  return (
    <div className="navigation-overlay" role="status" aria-live="polite">
      <div className="navigation-progress" />
      <div className="navigation-toast">
        <span className="navigation-spinner" />
        <div>
          <strong>Loading page</strong>
          <small>Preparing checkout experience…</small>
        </div>
      </div>
    </div>
  );
}
