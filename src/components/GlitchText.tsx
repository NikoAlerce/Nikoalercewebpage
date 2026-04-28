"use client";

import clsx from "clsx";
import { createElement } from "react";

type Props = {
  children: string;
  as?: "span" | "h1" | "h2" | "h3" | "h4" | "p" | "div";
  className?: string;
};

export default function GlitchText({
  children,
  as = "span",
  className,
}: Props) {
  return createElement(
    as,
    {
      className: clsx("glitch-text relative", className),
      "data-text": children,
    },
    children,
  );
}
