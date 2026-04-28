"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { ObjktToken } from "@/lib/types";

type Ctx = {
  token: ObjktToken | null;
  open: (token: ObjktToken) => void;
  close: () => void;
};

const TokenViewerCtx = createContext<Ctx | null>(null);

export function TokenViewerProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<ObjktToken | null>(null);

  const open = useCallback((t: ObjktToken) => setToken(t), []);
  const close = useCallback(() => setToken(null), []);

  useEffect(() => {
    if (!token) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [token, close]);

  return (
    <TokenViewerCtx.Provider value={{ token, open, close }}>
      {children}
    </TokenViewerCtx.Provider>
  );
}

export function useTokenViewer(): Ctx {
  const ctx = useContext(TokenViewerCtx);
  if (!ctx)
    throw new Error("useTokenViewer must be used inside TokenViewerProvider");
  return ctx;
}
