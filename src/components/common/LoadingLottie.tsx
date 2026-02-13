"use client";

import React from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

const LOTTIE_SRC =
  "https://lottie.host/0de433eb-0806-4557-ab35-b49b1026ae89/aezVw261E6.lottie";

type LoadingLottieVariant = "full" | "block" | "inline";

interface LoadingLottieProps {
  /** "full" = centered full viewport, "block" = centered in container with padding, "inline" = small for buttons */
  variant?: LoadingLottieVariant;
  className?: string;
  /** Override size (width/height in px). variant sets default size. */
  size?: number;
}

const variantStyles: Record<
  LoadingLottieVariant,
  { wrapper: string; size: number }
> = {
  full: {
    wrapper: "flex min-h-screen items-center justify-center",
    size: 200,
  },
  block: {
    wrapper: "flex items-center justify-center py-12",
    size: 120,
  },
  inline: {
    wrapper: "inline-flex items-center justify-center",
    size: 32,
  },
};

export default function LoadingLottie({
  variant = "block",
  className = "",
  size,
}: LoadingLottieProps) {
  const { wrapper, size: defaultSize } = variantStyles[variant];
  const s = size ?? defaultSize;

  return (
    <div className={`${wrapper} ${className}`}>
      <DotLottieReact
        src={LOTTIE_SRC}
        loop
        autoplay
        style={{ width: s, height: s }}
      />
    </div>
  );
}
