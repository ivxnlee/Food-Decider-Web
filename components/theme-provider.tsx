// theme-provider.tsx
"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
      scriptProps={{ type: "application/json" }} // This is a workaround for a known issue with Next.js and the next-themes library. It prevents a hydration mismatch error when the theme is changed on the client side.
    >
      {children}
    </NextThemesProvider>
  );
}
