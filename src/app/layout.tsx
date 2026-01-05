"use client"
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { usePathname } from "next/navigation";

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
  const isAdminPage = pathname.startsWith('/admin');

  return (
    <html lang="pt-BR">
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
        <div className="flex flex-col min-h-screen">
          {!isAdminPage && !pathname.startsWith('/videos') && <Navbar />}
          <main className="flex-grow">{children}</main>
          {!isAdminPage && !pathname.startsWith('/videos') && <Footer />}
        </div>
      </body>
    </html>
  );
}
