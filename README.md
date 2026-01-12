# ASFUS Mobile - Sistema de Gestão

![Status](https://img.shields.io/badge/Status-Production-green)
![Version](https://img.shields.io/badge/Version-1.2.0-blue)
![Stack](https://img.shields.io/badge/Stack-Next.js%20%7C%20Supabase%20%7C%20Tailwind-black)

Sistema completo de gestão para a Associação dos Funcionários (ASFUS), integrando agendamentos, controle financeiro, portaria e administração de associados.

---

## 🚀 Tecnologias

O projeto foi construído utilizando as tecnologias mais modernas do mercado para garantir performance, segurança e escalabilidade.

- **Frontend**: [Next.js 14](https://nextjs.org/) (App Router), React, TypeScript.
- **Estilização**: [Tailwind CSS](https://tailwindcss.com/) e [Shadcn/UI](https://ui.shadcn.com/) para componentes acessíveis e elegantes.
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL).
  - **Auth**: Autenticação customizada via CPF.
  - **Storage**: Armazenamento de fotos de perfil e documentos.
  - **Database**: PostgreSQL com Row Level Security (RLS) rigoroso.
- **Deploy**: VPS (Hostinger) rodando Node.js via PM2.

---

## ✨ Funcionalidades

### 1. 📱 Módulo do Associado
- **Dashboard Pessoal**: Visão geral de agendamentos, status financeiro e carteirinha digital.
- **Carteirinha Digital**: Cartão virtual com efeito flip, foto de perfil e QR Code (futuro).
- **Agendamento Inteligente**:
  - Seleção visual de apartamentos e casas.
  - Regras de negócio automáticas (limite de dias, restrição de horários).
  - Cálculo dinâmico de preços para convidados e day-use.

### 2. 🛡️ Painel Administrativo (`/admin`)
- **Gestão de Associados**: Aprovação de cadastros, edição de perfis e importação em massa.
- **Controle de Agendamentos**: Visualização de calendário, aprovação/rejeição e exclusão em massa com auditoria.
- **Sorteios**: Sistema completo de sorteio (Roleta Virtual) para períodos de alta demanda.
- **Auditoria**: Logs detalhados de todas as ações sensíveis no sistema.

### 3. 💰 Módulo Financeiro
- **Central de Cobrança**: Monitoramento de dívidas (Taxas de Convidados + Multas).
- **Gestão de Multas**: Aplicação e rastreamento de infrações.
- **Tabela de Preços Dinâmica**: Ajuste de valores do sistema em tempo real.
- **Relatórios**: Exportação de dados para Excel (.xlsx).

### 4. 🚧 Controle de Portaria (`/guarita`)
- **Check-in Rápido**: Validação de entrada de veículos e pedestres.
- **Busca Otimizada**: Pesquisa por Placa, CPF ou Nome.
- **Segurança**: Operadores de portaria têm acesso restrito apenas para validação, sem poder administrativo.

---

## 📂 Estrutura do Projeto

```
/
├── src/
│   ├── app/                 # Next.js App Router (Páginas e Rotas)
│   ├── components/          # Componentes Reutilizáveis (UI)
│   ├── lib/                 # Utilitários (Supabase client, helpers)
│   └── hooks/               # Custom React Hooks
│
├── database/
│   ├── migrations/          # Arquivos SQL de Schema e Migrations
│   └── seeds/               # Dados iniciais e Backups (CSV/XLSX)
│
├── scripts/
│   └── maintenance/         # Scripts de automação e correção de dados
│
└── public/                  # Assets estáticos (Imagens, Ícones)
```

---

## 📜 Histórico de Releases

### v1.2.0 - Finance & UI Polish (Atual)
- **Financeiro**: Implementação completa (Preços, Multas, Cobrança).
- **UI**: Modo Escuro Global e correções de contraste na Guarita.
- **Mobile**: Responsividade aprimorada na aba de Cobrança.

### v1.1.0 - Lottery & Guarita
- **Sorteio**: Lógica de sorteio aleatório para datas especiais.
- **Portaria**: Módulo independente para controle de acesso.
- **Admin**: Dashboard de auditoria e logs de segurança.

### v1.0.0 - Core Launch
- Lançamento inicial com Agendamento, Autenticação CPF e Cadastro.

---

## 🔧 Configuração e Instalação

1. **Clone o repositório**
   ```bash
   git clone https://github.com/Kevengrf/Asfus-Mobile.git
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configuração de Ambiente**
   Crie um arquivo `.env.local` na raiz:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=sua_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_key
   SUPABASE_SERVICE_ROLE_KEY=sua_service_key
   ```

4. **Rodar localmente**
   ```bash
   npm run dev
   ```

---

> Desenvolvido por **Keven William**.
