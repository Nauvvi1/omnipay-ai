"use client";

import Link, { LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import { AnchorHTMLAttributes, MouseEvent, ReactNode, useState } from "react";
import { startNavigationLoading } from "@/components/NavigationOverlay";

type LoadingLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    children: ReactNode;
    className?: string;
    loadingLabel?: string;
  };

function getHrefString(href: LinkProps["href"]) {
  return typeof href === "string" ? href : href.pathname || "";
}

export function LoadingLink({ children, className, loadingLabel = "Loading…", onClick, href, ...props }: LoadingLinkProps) {
  const pathname = usePathname();
  const [isPending, setIsPending] = useState(false);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;

    const isModifiedClick = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
    if (isModifiedClick || props.target === "_blank") return;

    const hrefString = getHrefString(href);
    const isSamePageHash = hrefString.startsWith("#") || hrefString === `${pathname}#flow` || (pathname === "/" && hrefString === "/#flow");

    if (!isSamePageHash) {
      setIsPending(true);
      startNavigationLoading();
    }
  }

  return (
    <Link
      {...props}
      href={href}
      onClick={handleClick}
      className={`${className || ""}${isPending ? " is-loading" : ""}`.trim()}
      aria-busy={isPending}
    >
      {isPending ? (
        <>
          <span className="inline-spinner" />
          <span>{loadingLabel}</span>
        </>
      ) : children}
    </Link>
  );
}
