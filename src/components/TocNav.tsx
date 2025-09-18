"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type TocItem = { href: string; label: string };

type TocNavProps = {
  items: TocItem[];
  className?: string;
  offset?: number; // pixels from top to consider a heading active
};

export function TocNav({ items, className, offset = 120 }: TocNavProps) {
  const [activeId, setActiveId] = useState<string>(() => items[0]?.href.replace("#", "") ?? "");
  const tickingRef = useRef(false);

  useEffect(() => {
    function onScroll() {
      if (tickingRef.current) return;
      tickingRef.current = true;
      window.requestAnimationFrame(() => {
        const currentY = window.scrollY + offset;
        let currentActive = items[0]?.href.replace("#", "") ?? "";
        for (const item of items) {
          const id = item.href.replace("#", "");
          const el = document.getElementById(id);
          if (!el) continue;
          if (el.offsetTop <= currentY) {
            currentActive = id;
          } else {
            break;
          }
        }
        setActiveId(currentActive);
        tickingRef.current = false;
      });
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [items, offset]);

  return (
    <nav className={cn("flex flex-col gap-2 text-sm", className)} aria-label="Table of contents">
      {items.map((item) => {
        const id = item.href.replace("#", "");
        const isActive = activeId === id;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-sm px-2 py-1 transition-colors border-l-2",
              isActive
                ? "text-foreground font-medium border-l-foreground"
                : "text-muted-foreground hover:text-foreground border-l-transparent"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default TocNav;


