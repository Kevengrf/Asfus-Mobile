"use client";

import { useState, useEffect } from 'react';
import { Carousel } from "@/components/ui/carousel";
import { Target, Waves, PartyPopper } from "lucide-react";

const slogans = [
  "União e Lazer para Toda a Família",
  "Seu Bem-Estar, Nossa Prioridade",
  "Conectando Pessoas, Criando Memórias",
  "Tradição e Modernidade em um Só Lugar"
];

export default function Home() {
  const [currentSlogan, setCurrentSlogan] = useState(slogans[0]);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const sloganInterval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentSlogan(prevSlogan => {
          const currentIndex = slogans.indexOf(prevSlogan);
          return slogans[(currentIndex + 1) % slogans.length];
        });
        setFade(true);
      }, 1000); // fade out duration
    }, 5000); // Change slogan every 5 seconds

    return () => clearInterval(sloganInterval);
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <Carousel />
        <div className="absolute top-0 left-0 w-full h-full bg-black/50 z-10"></div>
        <div className="relative z-20 text-center text-white px-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-shadow-md">
            Associação dos Funcionários da SUFRAMA
          </h1>
          <div className="min-h-[3rem] mt-4">
            <h2 className={`text-2xl md:text-3xl lg:text-4xl font-semibold text-shadow transition-opacity duration-1000 ${fade ? 'opacity-100' : 'opacity-0'}`}>
              {currentSlogan}
            </h2>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 md:py-24 bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-blue-900 dark:text-blue-300">Um Espaço de Lazer e União para a Família</h2>
            <p className="max-w-3xl mx-auto text-lg text-gray-600 dark:text-gray-300 mb-12">
                A ASFUS é mais do que uma associação; é uma comunidade que valoriza o bem-estar e a integração de seus associados e suas famílias. Oferecemos um espaço seguro e acolhedor, com opções de lazer, eventos sociais e convênios que proporcionam tranquilidade e qualidade de vida.
            </p>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                <div className="flex flex-col items-center">
                    <Target className="h-12 w-12 text-blue-600 mb-4" />
                    <h3 className="text-xl font-bold mb-2">Atividades Recreativas</h3>
                    <p className="text-muted-foreground">Diversas opções de lazer para todas as idades</p>
                </div>
                <div className="flex flex-col items-center">
                    <Waves className="h-12 w-12 text-blue-600 mb-4" />
                    <h3 className="text-xl font-bold mb-2">Piscina e Esportes</h3>
                    <p className="text-muted-foreground">Infraestrutura completa para prática esportiva</p>
                </div>
                <div className="flex flex-col items-center">
                    <PartyPopper className="h-12 w-12 text-blue-600 mb-4" />
                    <h3 className="text-xl font-bold mb-2">Eventos Sociais</h3>
                    <p className="text-muted-foreground">Festejos e confraternizações regulares</p>
                </div>
            </div>
        </div>
      </section>
    </>
  );
}