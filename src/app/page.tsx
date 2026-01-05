"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Carousel } from "@/components/ui/carousel";
import { Target, Waves, PartyPopper } from "lucide-react";
import { getAllNews, getAllPartners, getAllEvents } from "@/lib/supabase/client"; // Import Supabase client functions
import { ContentCard } from "@/components/ContentCard"; // Import ContentCard component

const slogans = [
  "União e Lazer para Toda a Família",
  "Seu Bem-Estar, Nossa Prioridade",
  "Conectando Pessoas, Criando Memórias",
  "Tradição e Modernidade em um Só Lugar"
];

interface NewsItem {
  id: number;
  created_at: string;
  title: string;
  summary: string;
  image_url?: string;
}

interface PartnerItem {
  id: number;
  name: string;
  category: string;
  benefit_desc: string;
  logo_url?: string;
}

interface EventItem {
  id: number;
  created_at: string;
  title: string;
  description: string;
  image_url?: string;
  event_date: string;
  location?: string;
}

export default function Home() {
  const [currentSlogan, setCurrentSlogan] = useState(slogans[0]);
  const [fade, setFade] = useState(true);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [partners, setPartners] = useState<PartnerItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    async function fetchData() {
      try {
        const [newsData, partnersData, eventsData] = await Promise.all([
          getAllNews(),
          getAllPartners(),
          getAllEvents(),
        ]);
        setNews(newsData);
        setPartners(partnersData);
        setEvents(eventsData);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
        <p className="text-xl">Loading content...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-100 dark:bg-red-900 p-4">
        <p className="text-xl text-red-700">Error: {error}</p>
      </div>
    );
  }

  return (
    <>
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <Carousel />
        <div className="absolute top-0 left-0 w-full h-full bg-black/50 z-10"></div>
        <div className="relative z-20 text-center text-white px-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-shadow-md">
            Associação dos Funcionários da SUAPE
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

      {/* News Section */}
      <section className="py-16 md:py-24 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-blue-900 dark:text-blue-300">Últimas Notícias</h2>
          {news.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {news.map((item) => (
                <ContentCard
                  key={item.id}
                  title={item.title}
                  description={item.summary}
                  imageUrl={item.image_url}
                  date={item.created_at}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600 dark:text-gray-300">Nenhuma notícia encontrada.</p>
          )}
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-16 md:py-24 bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-blue-900 dark:text-blue-300">Convênios e Parceiros</h2>
          {partners.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {partners.map((item) => (
                <ContentCard
                  key={item.id}
                  title={item.name}
                  description={item.benefit_desc}
                  imageUrl={item.logo_url}
                  category={item.category}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600 dark:text-gray-300">Nenhum convênio ou parceiro encontrado.</p>
          )}
        </div>
      </section>

      {/* Events Section */}
      <section className="py-16 md:py-24 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-blue-900 dark:text-blue-300">Próximos Eventos</h2>
          {events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map((item) => (
                <ContentCard
                  key={item.id}
                  title={item.title}
                  description={item.description}
                  imageUrl={item.image_url}
                  date={item.event_date}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600 dark:text-gray-300">Nenhum evento encontrado.</p>
          )}
        </div>
      </section>

      {/* Mobile Video Feed FAB */}
      <Link
        href="/videos"
        className="fixed bottom-6 right-6 z-50 md:hidden bg-black text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform animate-bounce"
      >
        <PartyPopper className="h-6 w-6 text-pink-500" />
      </Link >
    </>
  );
}