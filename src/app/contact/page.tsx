"use client"

import { ImageCarousel } from "@/components/ui/image-carousel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const leadershipImages = [
  { imageUrl: '/leadership/Marcelo.jpg', name: 'Marcelo' },
  { imageUrl: '/leadership/Ricardo Novaes.jpg', name: 'Ricardo' },
  { imageUrl: '/leadership/Taneha.png', name: 'Taneha' },
  { imageUrl: '/leadership/Pedro.jpg', name: 'Pedro' },
];

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl md:text-5xl font-bold text-blue-900 dark:text-blue-300 mb-4">
        Fale Conosco
      </h1>
      <p className="text-lg text-gray-600 dark:text-gray-300 mb-12">
        Estamos aqui para ajudar! Entre em contato conosco através dos canais abaixo.
      </p>

      <div className="flex flex-wrap justify-center gap-8 items-stretch">
        <Card className="flex-1 min-w-[300px] text-left shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-2xl text-blue-800 dark:text-blue-400 border-b-2 border-blue-500 pb-2 inline-block">
              Informações de Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-base">
            <p><strong>Endereço:</strong> Rua Laurentino Gomes, s/n - Gaibu, Cabo de Santo Agostinho - PE, 54500-992</p>
            <p><strong>Telefone:</strong> (81) 3512-0735</p>
            <p><strong>Email:</strong> contato@asfus.com.br</p>
            <p><strong>Horário:</strong> Segunda a Sexta, 8h às 18h</p>
          </CardContent>
        </Card>

        <Card className="flex-1 min-w-[300px] shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-2xl text-blue-800 dark:text-blue-400 border-b-2 border-blue-500 pb-2 inline-block">
              Nossa Diretoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ImageCarousel images={leadershipImages} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}