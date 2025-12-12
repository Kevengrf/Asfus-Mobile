"use client";

import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { AsfusLogo } from "@/components/ui/asfus-logo";
import { Menu } from "lucide-react";

export function Navbar() {
  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/gallery", label: "Galeria" },
    { href: "/contact", label: "Contato" },
  ];

  const authLinks = [
    { href: "/login", label: "Login Associado" },
    { href: "/admin/login", label: "Login Admin" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/95 shadow-sm backdrop-blur-sm">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <AsfusLogo />
        </Link>

        <nav className="hidden lg:flex gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-slate-600 font-medium transition-colors hover:text-blue-700"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-4">
          {authLinks.map((link) => (
            <Button key={link.href} variant="ghost" asChild>
              <Link href={link.href} className="text-slate-700 hover:text-blue-700">
                {link.label}
              </Link>
            </Button>
          ))}
          <Button
            asChild
            className="bg-[#003366] text-white rounded-full px-6 hover:bg-blue-800"
          >
            <Link href="/register">Pré-Cadastro</Link>
          </Button>
        </div>

        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6 text-slate-800" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-white">
              <div className="flex flex-col gap-8 p-6">
                <SheetClose asChild>
                  <Link href="/" className="flex items-center gap-2">
                    <AsfusLogo />
                  </Link>
                </SheetClose>
                <nav className="flex flex-col gap-6">
                  {navLinks.map((link) => (
                    <SheetClose asChild key={link.href}>
                      <Link
                        href={link.href}
                        className="text-lg font-medium text-slate-700"
                      >
                        {link.label}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>
                <div className="flex flex-col gap-6 border-t pt-6">
                  {authLinks.map((link) => (
                    <SheetClose asChild key={link.href}>
                      <Link
                        href={link.href}
                        className="text-lg font-medium text-slate-700"
                      >
                        {link.label}
                      </Link>
                    </SheetClose>
                  ))}
                  <SheetClose asChild>
                    <Button
                      asChild
                      className="bg-[#003366] text-white rounded-full px-6 py-3 text-lg hover:bg-blue-800"
                    >
                      <Link href="/register">Pré-Cadastro</Link>
                    </Button>
                  </SheetClose>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
