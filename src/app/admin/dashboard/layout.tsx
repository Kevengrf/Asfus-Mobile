import Link from "next/link";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const navLinks = [
    { href: "/admin/dashboard", label: "Início / Aprovações", icon: Home },
    { href: "/admin/dashboard/appointments", label: "Agendamentos", icon: CalendarCheck },
    { href: "/admin/dashboard/news", label: "Notícias", icon: Newspaper },
    { href: "/admin/dashboard/gallery", label: "Galeria", icon: Image }, // Link da Galeria
    { href: "/admin/dashboard/partners", label: "Convênios", icon: Handshake },
    { href: "/admin/dashboard/events", label: "Eventos", icon: Calendar },
    { href: "/admin/dashboard/associates", label: "Associados", icon: Users },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Desktop Sidebar */}
      <div className="hidden border-r bg-blue-900 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b border-blue-800 px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold text-white">
              <span className="">ASFUS Admin</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-blue-200 transition-all hover:text-white hover:bg-blue-800"
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="mt-auto p-4">
             <Link
                href="/"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-blue-200 transition-all hover:text-white hover:bg-blue-800"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Link>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        {/* Mobile Header */}
        <header className="flex h-14 items-center gap-4 border-b bg-white px-4 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col bg-blue-900 text-white p-0">
                <SheetHeader className="hidden">
                    <SheetTitle className="sr-only">Menu Administrativo</SheetTitle>
                </SheetHeader>
                <div className="flex h-14 items-center border-b border-blue-800 px-4">
                    <Link href="/" className="flex items-center gap-2 font-semibold text-white">
                        <span>ASFUS Admin</span>
                    </Link>
                </div>
                <nav className="grid gap-2 text-lg font-medium p-4">
                    {navLinks.map((link) => (
                        <Link
                        key={link.label}
                        href={link.href}
                        className="flex items-center gap-4 rounded-xl px-3 py-2 text-blue-200 hover:text-white hover:bg-blue-800"
                        >
                        <link.icon className="h-5 w-5" />
                        {link.label}
                        </Link>
                    ))}
                </nav>
                <div className="mt-auto p-4 border-t border-blue-800">
                    <Link
                        href="/"
                        className="flex items-center gap-4 rounded-xl px-3 py-2 text-blue-200 hover:text-white hover:bg-blue-800"
                    >
                        <LogOut className="h-5 w-5" />
                        Sair
                    </Link>
                </div>
            </SheetContent>
          </Sheet>
          <h1 className="font-semibold">Painel de Controle</h1>
        </header>
        {/* Main Content */}
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-slate-50 light">
          {children}
        </main>
      </div>
    </div>
  );
}