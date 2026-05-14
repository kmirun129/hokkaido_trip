import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ModeProvider } from "@/lib/mode";
import { SettingsProvider } from "@/lib/settings";

export const metadata: Metadata = {
  title: "北海道旅行プラン",
  description: "北海道旅行の旅程管理アプリ",
};

// iOS Safari で input にフォーカスした際の自動拡大を抑止する
// （現状の小さいフォントサイズを維持しつつズーム挙動を止めるため）
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body className="min-h-screen">
        <SettingsProvider>
          <ModeProvider>{children}</ModeProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
