import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { ToastContainer } from "@/components/layout/ToastContainer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LuckNexa — All-In-One AI-Powered Hotel Operating System",
  description: "LuckNexa: All-In-One. AI-Powered. Total Control. Complete cloud ERP & PMS platform for Hotels, Restaurants, Resorts, and Banquets.",
  icons: {
    icon: "/lucknexa-icon.jpg",
    apple: "/lucknexa-icon.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FAFAFA] text-[#111827] selection:bg-[#EC3013] selection:text-white">
        <AuthProvider>
          <NotificationProvider>
            <div className="flex-1 flex flex-col">{children}</div>
            <ToastContainer />
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
