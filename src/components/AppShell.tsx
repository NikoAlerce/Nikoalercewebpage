"use client";

import { type ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import TokenViewerModal from "./TokenViewerModal";
import BackgroundMusic from "./BackgroundMusic";
import CharacterStage from "./CharacterStage";
import Analytics from "./Analytics";
import { TokenViewerProvider } from "./TokenViewerContext";
import { WalletProvider } from "./WalletContext";
import { LangProvider, type Lang } from "@/lib/i18n";

export default function AppShell({ children, initialLang }: { children: ReactNode; initialLang: Lang }) {
  return (
    <LangProvider initialLang={initialLang}>
    <WalletProvider>
      <TokenViewerProvider>
        <Navbar />
        <main className="relative">{children}</main>
        <Footer />
        <TokenViewerModal />
        <BackgroundMusic />
        {/* One shared WebGL context that renders every title character (drei <View>). */}
        <CharacterStage />
        {/* GoatCounter analytics (skips localhost by itself). */}
        <Analytics />
      </TokenViewerProvider>
    </WalletProvider>
    </LangProvider>
  );
}
