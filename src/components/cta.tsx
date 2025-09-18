"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CTA as CTAType } from "@/lib/cms/types";
import { cn } from "@/lib/utils";

type Props = {
  cta: CTAType;
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
};

function mapStyleToVariant(style?: CTAType["style"]) {
  switch (style) {
    case "primary":
      return "default" as const;
    case "secondary":
      return "outline" as const;
    case "link":
      return "link" as const;
    default:
      return "default" as const;
  }
}

export function CTAButton({ cta, size = "default", className }: Props) {
  const variant = mapStyleToVariant(cta.style);
  const isInternal = typeof cta.href === "string" && cta.href.startsWith("/");

  const content = (
    <span className={cn("group inline-flex items-center gap-2", className)}>
      <span>{cta.label}</span>
      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
    </span>
  );

  if (isInternal) {
    return (
      <Button asChild size={size} variant={variant}>
        <Link href={cta.href}>{content}</Link>
      </Button>
    );
  }

  return (
    <Button asChild size={size} variant={variant}>
      <a href={cta.href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    </Button>
  );
}


