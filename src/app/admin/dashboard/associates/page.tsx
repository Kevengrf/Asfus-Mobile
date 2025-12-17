
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
import { Loader2 } from "lucide-react";
import { AddAssociateModal } from "@/components/admin/AddAssociateModal";

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
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const fetchProfiles = React.useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from("profiles").select("*");
    if (data) {
      setAllProfiles(data);
      setFilteredProfiles(data);
    }
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

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
    setCurrentPage(1); // Reset to first page on search
  }, [searchQuery, allProfiles]);

  // Pagination logic
  const lastItemIndex = currentPage * itemsPerPage;
  const firstItemIndex = lastItemIndex - itemsPerPage;
  const currentProfiles = filteredProfiles.slice(firstItemIndex, lastItemIndex);
  const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gerenciamento de Associados</h1>
        <AddAssociateModal onAssociateAdded={fetchProfiles} />
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
          <>
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
                {currentProfiles.length > 0 ? (
                  currentProfiles.map((profile) => (
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
            <div className="flex justify-end items-center gap-4 p-4">
              <span>Página {currentPage} de {totalPages}</span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Próxima
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
