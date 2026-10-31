import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://describethisimage.com"),
  title: {
    default: "Describe This Image – Free AI Image Describer, No Sign-Up",
    template: "%s | Describe This Image",
  },
  description: "Upload any photo and describe this image in detail with AI. Get object recognition, scene breakdown, alt text and captions in seconds. Free, no login.",
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
      <body className="min-h-full flex flex-col bg-white text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900">
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}

