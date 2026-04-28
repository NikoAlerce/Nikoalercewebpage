"use client";

import { type ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import TokenViewerModal from "./TokenViewerModal";
import { TokenViewerProvider } from "./TokenViewerContext";
import { WalletProvider } from "./WalletContext";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <WalletProvider>
      <TokenViewerProvider>
        <Navbar />
        <main className="relative">{children}</main>
        <Footer />
        <TokenViewerModal />
      </TokenViewerProvider>
    </WalletProvider>
  );
}
