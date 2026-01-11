"use client"
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { usePathname } from "next/navigation";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

// export const metadata: Metadata = {
//   title: "ASFUS - Associação dos Funcionários de SUAPE",
//   description: "Portal da Associação dos Funcionários de SUAPE.",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  // Hide Navbar only on Admin Dashboard pages, NOT on Admin Login
  const isAdminPage = pathname.startsWith('/admin') && !pathname.startsWith('/admin/login');

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/Logo_ASFUS.svg" />
        <title>ASFUS - Associação dos Funcionários de SUAPE</title>
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex flex-col min-h-screen">
            {!isAdminPage && !pathname.startsWith('/videos') && <Navbar />}
            <main className="flex-grow">{children}</main>
            {!isAdminPage && !pathname.startsWith('/videos') && <Footer />}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
