"use client";

import Link from "next/link";
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { logoutAdmin } from "@/app/admin/actions";
import {
  Home,
  Newspaper,
  Handshake,
  Calendar,
  Users,
  LogOut,
  Menu,
  CalendarCheck,
  Image,
  Shield,
  CalendarPlus,
  Video,
  FileText,
  UserCheck,
  DollarSign,
  Gavel,
  FileBarChart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

const navLinks = [
  { href: "/admin/dashboard", label: "Dashboard", icon: Home },
  { href: "/admin/dashboard/profiles", label: "Aprovações Fotos", icon: UserCheck },
  { href: "/admin/dashboard/appointments", label: "Agendamentos", icon: CalendarCheck },
  { href: "/admin/dashboard/associates", label: "Associados", icon: Users },
  { href: "/admin/dashboard/admins", label: "Administradores", icon: Shield },
  { type: 'separator' },
  { href: "/admin/dashboard/news", label: "Notícias", icon: Newspaper },
  { href: "/admin/dashboard/gallery", label: "Galeria", icon: Image },
  { href: "/admin/dashboard/videos", label: "Vídeos (App)", icon: Video },
  { href: "/admin/dashboard/partners", label: "Convênios", icon: Handshake },
  { href: "/admin/dashboard/events", label: "Eventos", icon: Calendar },
  { type: 'separator' },
  { href: "/admin/dashboard/lottery", label: "Sorteio", icon: CalendarPlus },
  { href: "/admin/dashboard/audit", label: "Auditoria", icon: FileText },
  { href: "/admin/dashboard/fazer-agendamento", label: "Novo Agendamento", icon: CalendarPlus },
  { type: 'separator' },
  { href: "/admin/dashboard/prices", label: "Tabela de Preços", icon: DollarSign },
  { href: "/admin/dashboard/fines", label: "Multas", icon: Gavel },
  { href: "/admin/dashboard/billing", label: "Cobrança", icon: FileBarChart },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-slate-50">
      {/* 
        ========================================
        DESKTOP SIDEBAR 
        ========================================
      */}
      <aside className="hidden md:flex w-64 flex-col bg-slate-900 text-slate-300 border-r border-slate-800 shadow-xl fixed h-screen z-50">
        {/* Header */}
        <div className="flex h-16 items-center px-6 border-b border-slate-800 bg-slate-950/50">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-white tracking-wide">
            <Shield className="h-6 w-6 text-blue-500" />
            <span>ASFUS<span className="text-blue-500">Admin</span></span>
          </Link>
        </div>

        {/* Scrollable Nav Links */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          {navLinks.map((link, index) => {
            if (link.type === 'separator') {
              return <Separator key={`sep-${index}`} className="my-2 bg-slate-800" />;
            }

            const Icon = link.icon!;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href!}
                className={`
                  flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200
                  ${isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50'
                    : 'hover:bg-slate-800 hover:text-white text-slate-400'}
                `}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Sticky Logout Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/30">
          <div className="mb-4 px-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Conta</p>
          </div>
          <form action={logoutAdmin}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sair do Sistema
            </button>
          </form>
        </div>
      </aside>

      {/* 
        ========================================
        MAIN CONTENT WRAPPER 
        ========================================
      */}
      <div className="flex-1 flex flex-col md:pl-64 min-h-screen transition-all duration-300">
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-white/80 backdrop-blur-md px-4 shadow-sm md:hidden">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="-ml-2">
                <Menu className="h-6 w-6 text-slate-700" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[80%] max-w-[300px] p-0 flex flex-col bg-slate-900 border-r-slate-800 text-slate-300">
              <SheetHeader className="h-16 flex items-center justify-start border-b border-slate-800 px-6">
                <SheetTitle className="text-white flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-500" />
                  ASFUS Admin
                </SheetTitle>
              </SheetHeader>
              <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                {navLinks.map((link, index) => {
                  if (link.type === 'separator') {
                    return <Separator key={`mob-sep-${index}`} className="my-2 bg-slate-800" />;
                  }
                  const Icon = link.icon!;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href!}
                      className={`
                         flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors
                         ${isActive ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}
                       `}
                      onClick={() => setIsSheetOpen(false)}
                    >
                      <Icon className="h-5 w-5" />
                      {link.label}
                    </Link>
                  )
                })}
              </nav>
              <div className="p-4 border-t border-slate-800 bg-slate-950/50">
                <form action={logoutAdmin}>
                  <button type="submit" className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-sm font-medium text-red-400 hover:bg-red-950/30">
                    <LogOut className="h-5 w-5" />
                    Sair
                  </button>
                </form>
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex-1 text-center">
            <span className="font-semibold text-slate-800">Painel Administrativo</span>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          <div className="mx-auto max-w-7xl animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}