"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

// Definindo o tipo para os dados do perfil
type Profile = {
  id: string;
  nome_completo: string;
  email: string;
  cpf: string;
};

export default function DashboardHomePage() {
  const [pendingProfiles, setPendingProfiles] = React.useState<Profile[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Função para buscar os perfis pendentes
  const fetchPendingProfiles = React.useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, nome_completo, email, cpf")
      .eq("status", "pendente");

    if (data) {
      setPendingProfiles(data);
    }
    setIsLoading(false);
  }, []);

  // useEffect para buscar os dados quando o componente montar
  React.useEffect(() => {
    fetchPendingProfiles();
  }, [fetchPendingProfiles]);

  // Função para aprovar um usuário
  const handleApprove = async (userId: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ status: "ativo" })
      .eq("id", userId);

    if (!error) {
      // Remove o usuário da lista local para atualizar a UI instantaneamente
      setPendingProfiles(prev => prev.filter(p => p.id !== userId));
    } else {
      alert("Erro ao aprovar o usuário.");
    }
  };

  // Função para rejeitar um usuário
  const handleReject = async (userId: string) => {
    // Apenas deleta o perfil. O usuário de autenticação continuará existindo,
    // mas não terá um perfil associado.
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (!error) {
      setPendingProfiles(prev => prev.filter(p => p.id !== userId));
    } else {
      alert("Erro ao rejeitar o usuário.");
    }
  };


  return (
    <>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Painel de Controle</h1>
      </div>

      {/* Quick Summary Cards (sem alteração) */}
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        {/* ... (cards de resumo) ... */}
      </div>

      {/* Pending Approvals Card */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Aprovações Pendentes</CardTitle>
            <CardDescription>
              Novas solicitações de cadastro para revisar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : pendingProfiles.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome Completo</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="hidden md:table-cell">CPF</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingProfiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">{profile.nome_completo}</TableCell>
                      <TableCell>{profile.email}</TableCell>
                      <TableCell className="hidden md:table-cell">{profile.cpf}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleApprove(profile.id)}>Aprovar</Button>
                        <Button variant="destructive" size="sm" onClick={() => handleReject(profile.id)}>Rejeitar</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhuma solicitação pendente no momento.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}