import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "정담 서울 | JEONGDAM SEOUL",
  description:
    "잔을 기울이며 나누는 진솔한 대화, 대구 정남에서 만나는 특별한 인연",
  keywords: ["정담서울", "정남", "소개팅", "대구소개팅", "반월당", "미팅"],
  openGraph: {
    title: "정담 서울 | JEONGDAM SEOUL",
    description: "잔을 기울이며 나누는 진솔한 대화, 대구 정남에서 특별한 인연",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement => {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
};

export default RootLayout;
