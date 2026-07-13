import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import CustomCursor from "@/components/CustomCursor";
import SplashScreen from "@/components/SplashScreen";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "iVEST",
  description: "AI-powered Investment Research Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={cn(
        inter.variable, 
        jetbrainsMono.variable, 
        "bg-[#050505] text-white antialiased min-h-screen"
      )}>
        <CustomCursor />
        <SplashScreen />
        
        {/* Cyberpunk Portfolio Background */}
        <div className="bg-noise"></div>
        <div className="bg-grid"></div>
        
        {/* Page Content */}
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
