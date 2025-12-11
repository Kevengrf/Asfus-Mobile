import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/ui/logo";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/gallery", label: "Galeria" },
  { href: "/contact", label: "Contato" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-gray-700 bg-[#003366] px-4 md:px-6">
      {/* Logo */}
      <div className="flex items-center">
        <Logo />
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden items-center gap-6 md:flex">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm font-medium text-white transition-colors hover:text-gray-300"
          >
            {link.label}
          </Link>
        ))}
        <Button asChild variant="secondary" className="bg-green-600 hover:bg-green-700 text-white">
          <Link href="/login">Login</Link>
        </Button>
      </nav>

      {/* Mobile Navigation (Hamburger Menu) */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0 bg-transparent text-white border-gray-400 hover:bg-white/20">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menu de navegação</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-[#003366] text-white border-none">
            <SheetHeader className="hidden">
                <SheetTitle className="sr-only">Menu Principal</SheetTitle>
            </SheetHeader>
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-start p-4">
                 <Logo />
              </div>
              <Separator className="bg-white/20 my-2" />
              <nav className="grid gap-4 p-4 text-base font-medium">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-md px-3 py-2 hover:bg-white/10"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <Separator className="bg-white/20 my-2" />
               <div className="p-4">
                 <Button asChild variant="secondary" className="w-full bg-green-600 hover:bg-green-700 text-white">
                    <Link href="/login">Login</Link>
                 </Button>
               </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}