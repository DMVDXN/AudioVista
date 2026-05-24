import type { Metadata } from "next";
import { SessionProvider } from "@/components/auth/SessionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "AudioVista — See your music from every angle",
  description:
    "An interactive music data visualization platform that turns songs, artists, lyrics, and listening habits into clear visual insights.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
