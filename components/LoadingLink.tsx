"use client";

import Link, { LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import { AnchorHTMLAttributes, MouseEvent, ReactNode, useState } from "react";

type LoadingLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    children: ReactNode;
    className?: string;
    loadingLabel?: string;
  };

function getHrefString(href: LinkProps["href"]) {
  if (typeof href === "string") return href;
  const pathname = href.pathname || "";
  const hash = href.hash ? `#${String(href.hash).replace(/^#/, "")}` : "";
  return `${pathname}${hash}`;
}

function stripHash(value: string) {
  return value.split("#")[0] || "/";
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
    const targetPath = stripHash(hrefString);
    const sameRoute = targetPath === pathname || (pathname === "/" && targetPath === "");
    const hashOnly = hrefString.startsWith("#") || (sameRoute && hrefString.includes("#"));

    if (sameRoute && !hashOnly) {
      event.preventDefault();
      return;
    }

    if (!hashOnly) setIsPending(true);
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
