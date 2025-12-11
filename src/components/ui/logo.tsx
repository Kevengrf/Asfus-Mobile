import { Anchor } from 'lucide-react';
import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <Anchor className="h-6 w-6 text-white" />
      <span className="text-xl font-bold text-white">ASFUS</span>
    </Link>
  );
}
