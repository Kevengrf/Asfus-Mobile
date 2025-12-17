
"use client";

import * as React from "react";
import * as XLSX from "xlsx";
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
import { Download, Loader2, ShieldCheck } from "lucide-react";
import { AddAssociateModal } from "@/components/admin/AddAssociateModal";
import { promoteToAdmin } from "./actions";

type Profile = {
    id: string;
    nome_completo: string;
    email: string;
    cpf: string | null;
    telefone: string | null;
    matricula: string | null;
    status: 'ativo' | 'pendente' | 'rejeitado';
    role: 'admin' | 'user';
    codtipo: string | null;
    chapa: string | null;
    dt_nasc: string | null;
    sexo: string | null;
};

export default function AssociatesPage() {
  const [allProfiles, setAllProfiles] = React.useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = React.useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isPromoting, setIsPromoting] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const fetchProfiles = React.useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from("profiles").select("*").order('nome_completo', { ascending: true });
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
    const filtered = allProfiles.filter(profile => 
        Object.values(profile).some(value => 
            String(value).toLowerCase().includes(lowercasedQuery)
        )
    );
    setFilteredProfiles(filtered);
    setCurrentPage(1);
  }, [searchQuery, allProfiles]);

  const handlePromote = async (userId: string) => {
    if (confirm('Tem certeza que deseja promover este usuário a Administrador?')) {
        setIsPromoting(userId);
        await promoteToAdmin(userId);
        await fetchProfiles(); // Refresh data to show the new role
        setIsPromoting(null);
    }
  }

  const handleExportXLSX = () => {
    const dataToExport = filteredProfiles.map(p => ({
        "Nome Completo": p.nome_completo,
        "Email": p.email,
        "CPF": p.cpf,
        "Telefone": p.telefone,
        "Matrícula": p.matricula,
        "Data de Nascimento": p.dt_nasc,
        "Sexo": p.sexo,
        "Código do Tipo": p.codtipo,
        "Chapa": p.chapa,
        "Status": p.status,
        "Papel": p.role,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Associados");
    XLSX.writeFile(workbook, `relatorio_associados_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const lastItemIndex = currentPage * itemsPerPage;
  const firstItemIndex = lastItemIndex - itemsPerPage;
  const currentProfiles = filteredProfiles.slice(firstItemIndex, lastItemIndex);
  const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold">Gerenciamento de Associados</h1>
            <p className="text-muted-foreground">Visualize, adicione, promova e exporte os dados.</p>
        </div>
        <div className="flex gap-2">
            <AddAssociateModal onAssociateAdded={fetchProfiles} />
            <Button onClick={handleExportXLSX} disabled={filteredProfiles.length === 0}>
                <Download className="mr-2 h-4 w-4"/>
                Exportar para XLSX
            </Button>
        </div>
      </div>

      <Input
          placeholder="Buscar por qualquer informação..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />

      <div className="border rounded-lg overflow-x-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin"/></div>
        ) : (
          <>
            <Table className="min-w-max">
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentProfiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">{profile.nome_completo}</TableCell>
                      <TableCell>{profile.email}</TableCell>
                      <TableCell>
                        <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'}>
                          {profile.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{profile.cpf || "N/A"}</TableCell>
                      <TableCell>{profile.telefone || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant={profile.status === 'ativo' ? 'default' : (profile.status === 'pendente' ? 'secondary' : 'destructive')} className={profile.status === 'ativo' ? 'bg-green-600' : ''}>
                          {profile.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {profile.role !== 'admin' && (
                            <Button size="sm" onClick={() => handlePromote(profile.id)} disabled={isPromoting === profile.id}>
                                {isPromoting === profile.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ShieldCheck className="mr-2 h-4 w-4"/>}
                                Tornar Admin
                            </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                }
              </TableBody>
            </Table>
            <div className="flex justify-end items-center gap-4 p-4">
              <span>Página {currentPage} de {totalPages}</span>
              <Button variant="outline" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>Anterior</Button>
              <Button variant="outline" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0}>Próxima</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
