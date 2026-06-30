"use client";

import clsx from "clsx";
import { createElement } from "react";

type Props = {
  children: string;
  as?: "span" | "h1" | "h2" | "h3" | "h4" | "p" | "div";
  className?: string;
};

// Rebrand: the animated RGB-split glitch is retired. This stays as a thin
// pass-through so existing call-sites keep working while rendering clean type.
export default function GlitchText({
  children,
  as = "span",
  className,
}: Props) {
  return createElement(
    as,
    { className: clsx("relative", className) },
    children,
  );
}
