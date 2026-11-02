import type { Metadata } from "next";
import { Libre_Franklin, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuthProvider } from "@/components/AuthProvider";

const geistSans = Libre_Franklin({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Source_Serif_4({
  variable: "--font-reading-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://describethisimage.com"),
  title: {
    default: "Describe This Image – Free AI Image Describer, No Sign-Up",
    template: "%s | Describe This Image",
  },
  description: "Draft image descriptions, alt text and captions. Try one image without login, or sign in for 10 free descriptions per day.",
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
      <body className="min-h-full flex flex-col font-sans">
        <AuthProvider>
          <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-xl focus:bg-white focus:p-4 focus:text-blue-700">Skip to content</a>
          <Navbar />
          {children}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
