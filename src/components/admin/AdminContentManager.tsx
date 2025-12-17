"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface AdminContentManagerProps<T> {
  contentType: string;
  fetchFunction: () => Promise<T[]>;
  createFunction: (data: any) => Promise<T>;
  deleteFunction: (id: number) => Promise<void>;
  uploadImageFunction?: (file: File, bucketName?: string) => Promise<string>;
  fields: { name: string; label: string; type: string; required?: boolean; placeholder?: string; options?: { value: string; label: string }[] }[];
  displayFields: { key: string; label: string }[];
}

export function AdminContentManager<T extends { id: number; title?: string; name?: string; created_at?: string; event_date?: string }>({
  contentType,
  fetchFunction,
  createFunction,
  deleteFunction,
  uploadImageFunction,
  fields,
  displayFields,
}: AdminContentManagerProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [formState, setFormState] = useState<any>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Or make this a prop

  const fetchItems = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFunction();
      setItems(data);
    } catch (err: any) {
      setError(err.message || `Falha ao buscar ${contentType}`);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, contentType]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (e.target.type === 'file') {
      setSelectedFile((e.target as HTMLInputElement).files?.[0] || null);
    } else {
      setFormState({ ...formState, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    for (const field of fields) {
        if (field.required && !formState[field.name] && field.type !== 'image') {
            setError(`O campo "${field.label}" é obrigatório.`);
            return;
        }
        if (field.required && field.type === 'image' && !selectedFile) {
            setError(`O campo "${field.label}" é obrigatório.`);
            return;
        }
    }

    setLoading(true);
    setError(null);

    try {
      let imageUrl: string | undefined = formState.image_url;

      if (selectedFile && uploadImageFunction) {
        imageUrl = await uploadImageFunction(selectedFile, 'content-images');
      }

      const dataToCreate = { ...formState, image_url: imageUrl };
      await createFunction(dataToCreate);
      setFormState({});
      setSelectedFile(null);
      const fileInput = document.getElementById('image_url-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      await fetchItems();
    } catch (err: any) {
      setError(err.message || `Falha ao criar ${contentType.slice(0, -1)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar este item?')) return;
    setLoading(true);
    setError(null);
    try {
      await deleteFunction(id);
      await fetchItems();
    } catch (err: any) {
      setError(err.message || 'Falha ao deletar item');
    } finally {
      setLoading(false);
    }
  };
  
  // Pagination logic
  const lastItemIndex = currentPage * itemsPerPage;
  const firstItemIndex = lastItemIndex - itemsPerPage;
  const currentItems = items.slice(firstItemIndex, lastItemIndex);
  const totalPages = Math.ceil(items.length / itemsPerPage);

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Adicionar Novo {contentType.slice(0, -1)}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field) => (
              <div key={field.name} className="grid gap-2">
                <Label htmlFor={field.name}>{field.label}</Label>
                {field.type === 'textarea' ? (
                  <textarea
                    id={field.name}
                    name={field.name}
                    value={formState[field.name] || ''}
                    onChange={handleChange}
                    required={field.required}
                    placeholder={field.placeholder}
                    className="flex h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                ) : field.type === 'select' ? (
                  <select
                    id={field.name}
                    name={field.name}
                    value={formState[field.name] || ''}
                    onChange={handleChange}
                    required={field.required}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Selecione um {field.label}</option>
                    {field.options?.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                ) : field.type === 'image' ? (
                  <Input
                    id={`${field.name}-input`}
                    name={field.name}
                    type="file"
                    onChange={handleChange}
                    required={field.required}
                  />
                ) : (
                  <Input
                    id={field.name}
                    name={field.name}
                    type={field.type}
                    value={formState[field.name] || ''}
                    onChange={handleChange}
                    required={field.required}
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            ))}
            <div className="md:col-span-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'Adicionando...' : `Adicionar ${contentType.slice(0, -1)}`}
              </Button>
            </div>
            {error && <p className="text-red-500 mt-2 md:col-span-2">{error}</p>}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gerenciar {contentType}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && items.length === 0 ? (
            <p>Carregando {contentType}...</p>
          ) : items.length === 0 ? (
            <p>Nenhum(a) {contentType.toLowerCase()} encontrado(a).</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {displayFields.map((field) => (
                        <TableHead key={field.key}>{field.label}</TableHead>
                      ))}
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentItems.map((item) => (
                      <TableRow key={item.id}>
                        {displayFields.map((field) => (
                          <TableCell key={field.key}>
                              {/* @ts-ignore */}
                              {item[field.key] instanceof Date ? item[field.key].toLocaleDateString() : String(item[field.key] ?? '')}
                          </TableCell>
                        ))}
                        <TableCell className="text-right">
                          <Button
                            variant="destructive"
                            onClick={() => handleDelete(item.id)}
                            disabled={loading}
                          >
                            Deletar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-end items-center gap-4 mt-4">
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
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
