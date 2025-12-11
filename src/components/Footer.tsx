import Link from 'next/link';
import { Facebook, Instagram, Twitter } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-10 px-4 md:px-6">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
        {/* Coluna 1: Sobre */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4">ASFUS</h3>
          <p className="text-sm">
            Associação dos Funcionários da SUFRAMA.
          </p>
        </div>

        {/* Coluna 2: Endereço */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Localização</h3>
          <p className="text-sm">
            Av. Portuária, S/N, T-01<br />
            Complexo Industrial Portuário, Suape<br />
            Ipojuca - PE, 55590-000
          </p>
        </div>

        {/* Coluna 3: Redes Sociais */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Siga-nos</h3>
          <div className="flex justify-center md:justify-start space-x-4">
            <Link href="#" className="hover:text-white">
              <Facebook className="h-6 w-6" />
            </Link>
            <Link href="#" className="hover:text-white">
              <Instagram className="h-6 w-6" />
            </Link>
            <Link href="#" className="hover:text-white">
              <Twitter className="h-6 w-6" />
            </Link>
          </div>
        </div>
      </div>
      <div className="mt-8 border-t border-slate-700 pt-6 text-center">
        <p className="text-sm text-slate-400">
          &copy; {new Date().getFullYear()} ASFUS. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}