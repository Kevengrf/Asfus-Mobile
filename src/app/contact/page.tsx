
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

// Mock data para a diretoria
const boardMembers = [
  {
    name: "Marcelo",
    role: "Presidente",
    imageUrl: "https://placehold.co/100x100/E2E8F0/475569?text=M",
  },
  {
    name: "Ricardo",
    role: "Diretor Financeiro",
    imageUrl: "https://placehold.co/100x100/E2E8F0/475569?text=R",
  },
  {
    name: "Taneha",
    role: "Diretora Social",
    imageUrl: "https://placehold.co/100x100/E2E8F0/475569?text=T",
  },
];

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* Coluna 1: Informações de Contato */}
        <div className="space-y-6">
          <h1 className="text-4xl font-bold">Fale Conosco</h1>
          <p className="text-muted-foreground">
            Tem alguma dúvida ou sugestão? Entre em contato conosco através dos canais abaixo.
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <MapPin className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold">Endereço</h3>
                <p className="text-muted-foreground">Rua Laurentino Gomes, 123, Bloco A<br/>Distrito Industrial, Manaus - AM</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Phone className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold">Telefone</h3>
                <p className="text-muted-foreground">(81) 3512-0735</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Mail className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold">Email</h3>
                <p className="text-muted-foreground">contato@asfus.com.br</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Clock className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold">Horário de Funcionamento</h3>
                <p className="text-muted-foreground">Segunda a Sexta, das 8h às 17h</p>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna 2: Nossa Diretoria */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold">Nossa Diretoria</h2>
          <div className="space-y-4">
            {boardMembers.map((member) => (
              <Card key={member.name}>
                <CardContent className="p-4 flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={member.imageUrl} alt={`Foto de ${member.name}`} />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-lg">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
