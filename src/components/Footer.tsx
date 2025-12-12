import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-10 px-4 md:px-6">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 text-center md:text-left">
        {/* Coluna 1: Sobre */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4">ASFUS</h3>
          <p className="text-sm">
            Associação dos Funcionários da SUAPE.
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
      </div>
      <div className="mt-8 border-t border-slate-700 pt-6 text-center">
        <p className="text-sm text-slate-400">
          &copy; {new Date().getFullYear()} ASFUS. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}