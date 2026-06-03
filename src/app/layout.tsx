import { ReactNode } from "react";
import type { Metadata } from "@/types/metadata";
import "./globals.css";
import "./font.css";
import "@/styles/tiptap.scss";

type Props = {
  children: ReactNode;
};

export const metadata: Metadata = {
  metadataBase: new URL("https://cv.agentbuff.id"),
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  }
};

export default function RootLayout({ children }: Props) {
  return children;
}
