"use client";

import { useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

/**
 * Swagger UI still ships class components that use UNSAFE_componentWillReceiveProps.
 * Next.js runs the app in React Strict Mode in dev, which surfaces that warning.
 * Mounting Swagger UI in its own root avoids Strict Mode for this subtree only.
 */
export default function SwaggerUIViewer() {
  const hostRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<Root | null>(null);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;

    const root = rootRef.current ?? createRoot(el);
    rootRef.current = root;
    root.render(<SwaggerUI url="/api/docs" docExpansion="list" />);

    return () => {
      queueMicrotask(() => {
        if (rootRef.current === root) {
          root.unmount();
          rootRef.current = null;
        }
      });
    };
  }, []);

  return <div ref={hostRef} className="min-h-screen" suppressHydrationWarning />;
}
