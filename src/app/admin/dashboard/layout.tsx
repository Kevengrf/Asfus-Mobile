"use client";

import Link from "next/link";
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { logout } from "@/app/admin/actions";
import {
  Home,
  Newspaper,
  Handshake,
  Calendar,
  Users,
  LogOut,
  Menu,
  CalendarCheck,
  Image, // Ícone para Galeria
  Shield, // Ícone para Admins
  CalendarPlus, // Ícone para Fazer Agendamento
  Video, // Ícone para Vídeos
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const navLinks = [
  { href: "/admin/dashboard", label: "Início / Aprovações", icon: Home },
  { href: "/admin/dashboard/profiles", label: "Aprovações Perfil", icon: Users },
  { href: "/admin/dashboard/appointments", label: "Agendamentos", icon: CalendarCheck },
  { href: "/admin/dashboard/news", label: "Notícias", icon: Newspaper },
  { href: "/admin/dashboard/gallery", label: "Galeria", icon: Image },
  { href: "/admin/dashboard/videos", label: "Vídeos (Mobile)", icon: Video }, // Link dos Vídeos
  { href: "/admin/dashboard/partners", label: "Convênios", icon: Handshake },
  { href: "/admin/dashboard/events", label: "Eventos", icon: Calendar },
  { href: "/admin/dashboard/associates", label: "Associados", icon: Users },
  { href: "/admin/dashboard/admins", label: "Admins", icon: Shield },
  { href: "/admin/dashboard/lottery", label: "Sorteio", icon: CalendarPlus }, // Using CalendarPlus as placeholder or maybe a different icon? Using CalendarPlus for 'Fazer Agendamento' below too?
  { href: "/admin/dashboard/fazer-agendamento", label: "Fazer Agendamento", icon: CalendarPlus },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* --- Desktop Sidebar --- */}
      <div className="hidden border-r bg-blue-900 text-white md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b border-blue-800 px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="">ASFUS Admin</span>
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-blue-200 transition-all hover:text-white hover:bg-blue-800 ${pathname === link.href ? 'bg-blue-800 text-white' : ''}`}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="mt-auto p-4">
            <form action={logout}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-blue-200 transition-all hover:text-white hover:bg-blue-800"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* --- Main Content Area --- */}
      <div className="flex flex-col">
        {/* Mobile Header */}
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menu de navegação</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col bg-blue-900 text-white p-0">
              <SheetHeader className="h-14 flex-row items-center border-b border-blue-800 px-4">
                <SheetTitle>
                  <Link href="/" className="flex items-center gap-2 font-semibold text-white" onClick={() => setIsSheetOpen(false)}>
                    ASFUS Admin
                  </Link>
                </SheetTitle>
              </SheetHeader>
              <nav className="grid gap-2 text-lg font-medium p-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={`flex items-center gap-4 rounded-xl px-3 py-2 text-blue-200 hover:text-white hover:bg-blue-800 ${pathname === link.href ? 'bg-blue-800 text-white' : ''}`}
                    onClick={() => setIsSheetOpen(false)}
                  >
                    <link.icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-auto p-4 border-t border-blue-800">
                <form action={logout}>
                  <button type="submit" className="flex w-full items-center gap-4 rounded-xl px-3 py-2 text-blue-200 hover:text-white hover:bg-blue-800">
                    <LogOut className="h-5 w-5" />
                    Sair
                  </button>
                </form>
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex-1 text-center">
            <h1 className="text-xl font-semibold">Painel de Controle</h1>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-slate-50 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}