import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit, Montserrat } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import "./globals.css";
import "./custom-styles.css";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import StarfieldBackground from "@/components/starfieldBG";

const montserratHeading = Montserrat({
  subsets: ["latin"],
  variable: "--font-heading",
});

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Food Decider",
  description:
    "A food discovery and decision-making app that helps you decide on your next meal. Browse food options, filter by dietary preferences, and lock in on your meal.",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "Food Decider",
    description:
      "A food discovery and decision-making app that helps you decide on your next meal. Browse food options, filter by dietary preferences, and lock in on your meal.",
    url: "https://food.ivanl.dev",
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
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        outfit.variable,
        montserratHeading.variable,
      )}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <StarfieldBackground count={35} speed={0.35} />
          <TooltipProvider>
            {children}
            <Toaster richColors />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
