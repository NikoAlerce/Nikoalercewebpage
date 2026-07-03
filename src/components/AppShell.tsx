"use client";

import { type ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import TokenViewerModal from "./TokenViewerModal";
import BackgroundMusic from "./BackgroundMusic";
import CharacterStage from "./CharacterStage";
import { TokenViewerProvider } from "./TokenViewerContext";
import { WalletProvider } from "./WalletContext";
import { LangProvider } from "@/lib/i18n";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <LangProvider>
    <WalletProvider>
      <TokenViewerProvider>
        <Navbar />
        <main className="relative">{children}</main>
        <Footer />
        <TokenViewerModal />
        <BackgroundMusic />
        {/* One shared WebGL context that renders every title character (drei <View>). */}
        <CharacterStage />
      </TokenViewerProvider>
    </WalletProvider>
    </LangProvider>
  );
}
