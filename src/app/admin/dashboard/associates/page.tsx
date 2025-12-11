
"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import { Loader2, UserPlus } from "lucide-react";

type Profile = {
    id: string;
    nome_completo: string;
    email: string;
    cpf: string | null;
    matricula: string | null;
    status: 'ativo' | 'pendente' | 'rejeitado';
};

export default function AssociatesPage() {
  const [allProfiles, setAllProfiles] = React.useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = React.useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchProfiles = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.from("profiles").select("*");
      if (data) {
        setAllProfiles(data);
        setFilteredProfiles(data);
      }
      setIsLoading(false);
    };
    fetchProfiles();
  }, []);

  React.useEffect(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    const filtered = allProfiles.filter(profile => {
      return (
        profile.nome_completo?.toLowerCase().includes(lowercasedQuery) ||
        profile.email?.toLowerCase().includes(lowercasedQuery) ||
        profile.cpf?.includes(searchQuery)
      );
    });
    setFilteredProfiles(filtered);
  }, [searchQuery, allProfiles]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gerenciamento de Associados</h1>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Adicionar Associado
        </Button>
      </div>

      <div>
        <Input
          placeholder="Buscar por nome, email ou CPF..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="border rounded-lg">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome Completo</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Matrícula</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProfiles.length > 0 ? (
                filteredProfiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">{profile.nome_completo}</TableCell>
                    <TableCell>{profile.email}</TableCell>
                    <TableCell>{profile.matricula || "N/A"}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={profile.status === 'ativo' ? 'default' : (profile.status === 'pendente' ? 'secondary' : 'destructive')}
                        className={profile.status === 'ativo' ? 'bg-green-600' : ''}
                      >
                        {profile.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Nenhum resultado encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
