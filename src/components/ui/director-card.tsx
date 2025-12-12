import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone } from 'lucide-react';

interface DirectorCardProps {
  name: string;
  title: string;
  email: string;
  phone: string;
  imageSrc: string;
}

export function DirectorCard({ name, title, email, phone, imageSrc }: DirectorCardProps) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="flex flex-col items-center text-center">
        <Image
          src={imageSrc}
          alt={`Foto de ${name}`}
          width={128}
          height={128}
          className="rounded-full mb-4"
        />
        <CardTitle>{name}</CardTitle>
        <p className="text-sm text-muted-foreground">{title}</p>
      </CardHeader>
      <CardContent className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Mail className="h-4 w-4" />
          <a href={`mailto:${email}`} className="text-sm hover:underline">
            {email}
          </a>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Phone className="h-4 w-4" />
          <span className="text-sm">{phone}</span>
        </div>
      </CardContent>
    </Card>
  );
}