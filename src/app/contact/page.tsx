import { DirectorCard } from "@/components/ui/director-card";

const directors = [
  {
    name: "Pedro Roberto Amora Maciel",
    title: "Presidente",
    email: "Pedro.maciel@suape.pe.gov.br",
    phone: "(81) 98810-6970",
    imageSrc: "/leadership/Pedro.jpg",
  },
  {
    name: "Manoel Cicero Ricarte de Moura",
    title: "Vice-Presidente",
    email: "ricarte@suape.pe.gov.br",
    phone: "(81) 99664-8140 – 99488 4771",
    imageSrc: "/leadership/Pedro.jpg", // Placeholder, assuming the user will replace with actual image.
  },
  {
    name: "Taneha Thais dos Santos Fidélis",
    title: "Diretora Secretária",
    email: "taneha.fidelise@suape.pe.gov.br",
    phone: "(81) 99636-2915",
    imageSrc: "/leadership/Taneha.png",
  },
  {
    name: "Paulo Marcelo Foerster",
    title: "Diretor Financeiro",
    email: "Paulo.foerster@suape.pe.gov.br",
    phone: "(81) 98714-5474",
    imageSrc: "/leadership/Marcelo.jpg",
  },
  {
    name: "Girlene Adeilda da Silva",
    title: "Diretor Administrativo",
    email: "Girlene.silva@suape.pe.gov.br",
    phone: "(81) 99661-9658",
    imageSrc: "/leadership/Pedro.jpg", // Placeholder, assuming the user will replace with actual image.
  },
  {
    name: "José Ricardo Novaes de Lima",
    title: "Diretora de Promoção Social",
    email: "Ricardo.novaes@suape.pe.gov.br",
    phone: "(81) 99488.2795/ 98678.7881",
    imageSrc: "/leadership/Ricardo Novaes.jpg",
  },
];

const conselho = [
  "ADRIANO ALVES DE ALENCAR",
  "ANA PAULA MARIA DE AMORIM",
  "AURENICE DE SALES LINS CAVALCANTI",
  "CARLOS MARCEL LUNA CARVALHO",
  "EDUARDO CARVALHO BELTRÃO",
  "FLÁVIO ANTÃO DOS SANTOS",
  "JOÃO RICARDO BEZERRA DOS SANTOS",
  "MARIÂNGELA LAURIANO DA SILVA CRUZ BARBOSA",
  "PABLO DUARTE TEIXEIRA",
  "THAIS DE SANTANA OLIVEIRA",
];

export default function ContactPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <section className="mb-16">
        <h2 className="text-4xl font-extrabold text-center mb-10 text-blue-800">Sobre Nós</h2>
        <div className="max-w-3xl mx-auto text-lg text-gray-700 leading-relaxed space-y-6">
          <div>
            <h3 className="text-2xl font-bold mb-3 text-blue-700">História da Associação</h3>
            <p>
              A ASFUS é uma associação dedicada a promover o bem-estar e a integração dos funcionários de SUAPE. Desde a sua fundação, temos trabalhado para criar um ambiente de união e lazer para toda a família, fortalecendo os laços comunitários e oferecendo suporte aos nossos associados.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-3 text-blue-700">Missão, Visão e Valores</h3>
            <p>
              Nossa <strong className="text-blue-600">Missão</strong> é ser o elo entre os funcionários, oferecendo um espaço seguro e acolhedor para o desenvolvimento social e recreativo, e promovendo a qualidade de vida.
            </p>
            <p>
              Nossa <strong className="text-blue-600">Visão</strong> é ser reconhecida como a principal associação de funcionários da região, sinônimo de excelência em serviços e lazer.
            </p>
            <p>
              Nossos <strong className="text-blue-600">Valores</strong> são pautados no respeito mútuo, ética impecável, transparência em todas as ações, solidariedade entre os membros e compromisso com o desenvolvimento sustentável.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-3 text-blue-700">Estrutura e Instalações</h3>
            <p>
              Contamos com uma sede moderna e equipada, projetada para proporcionar o máximo de conforto e diversão. Nossas instalações incluem piscinas para adultos e crianças, quadras poliesportivas, salão de festas espaçoso, churrasqueiras, parquinho infantil e áreas verdes para relaxamento. Toda a infraestrutura é mantida com rigor para garantir segurança e bem-estar.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-3xl font-bold text-center mb-8">Diretoria</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
          {directors.map((director) => (
            <DirectorCard key={director.name} {...director} />
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-3xl font-bold text-center mb-8">Conselho Deliberativo</h2>
        <div className="flex justify-center">
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-gray-700">
            {conselho.map((member) => (
              <li key={member} className="text-center md:text-left text-lg">{member}</li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-bold text-center mb-8">Informações de Contato</h2>
        <div className="text-center max-w-lg mx-auto text-gray-700 space-y-2">
          <p className="text-lg"><strong>CNPJ:</strong> 089.085.840/0001-00</p>
          <p className="text-lg"><strong>Endereço:</strong> Rua Laurentino Gomes, s/n - Gaibu, Cabo de Santo Agostinho - PE, 54500-992</p>
          <p className="text-lg"><strong>Telefone Clube:</strong> (81) 3512-0735</p>
          <p className="text-lg"><strong>Telefone:</strong> (81) 3527-5027</p>
        </div>
      </section>
    </div>
  );
}