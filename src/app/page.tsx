
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Waves, PartyPopper } from "lucide-react";

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="bg-blue-950 text-white">
        <div className="container mx-auto px-4 py-20 text-center md:py-32">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            Associação dos Funcionários da SUFRAMA
          </h1>
          <p className="mt-4 max-w-3xl mx-auto text-lg text-blue-200 md:text-xl">
            Tradição e Modernidade em um Só Lugar.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            
            <Card className="text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                    <Target className="h-12 w-12 text-blue-600" />
                </div>
                <CardTitle>Atividades Recreativas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Participe de nossas atividades e fortaleça os laços com seus colegas.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                    <Waves className="h-12 w-12 text-blue-600" />
                </div>
                <CardTitle>Piscina e Esportes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Relaxe em nossa piscina ou pratique seu esporte favorito em nossas quadras.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                    <PartyPopper className="h-12 w-12 text-blue-600" />
                </div>
                <CardTitle>Eventos Sociais</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Celebre conosco em eventos exclusivos para associados e suas famílias.
                </p>
              </CardContent>
            </Card>

          </div>
        </div>
      </section>
    </>
  );
}
