"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface AdminContentManagerProps<T> {
  contentType: 'news' | 'partners' | 'events';
  fetchFunction: () => Promise<T[]>;
  createFunction: (data: any) => Promise<T>;
  deleteFunction: (id: number) => Promise<void>;
  uploadImageFunction?: (file: File, bucketName?: string) => Promise<string>; // New prop for image upload
  fields: { name: string; label: string; type: string; required?: boolean; options?: { value: string; label: string }[] }[];
  // Specific fields for display in the table
  displayFields: { key: string; label: string }[];
}

export function AdminContentManager<T extends { id: number; title?: string; name?: string; created_at?: string; event_date?: string }>({
  contentType,
  fetchFunction,
  createFunction,
  deleteFunction,
  uploadImageFunction, // Destructure new prop
  fields,
  displayFields,
}: AdminContentManagerProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [formState, setFormState] = useState<any>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // New state for file
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFunction();
      setItems(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (e.target.type === 'file') {
      setSelectedFile((e.target as HTMLInputElement).files?.[0] || null);
    } else {
      setFormState({ ...formState, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let imageUrl: string | undefined = formState.image_url; // Keep existing image_url if not uploading new one

      if (selectedFile && uploadImageFunction) {
        imageUrl = await uploadImageFunction(selectedFile, 'content-images'); // Assuming 'content-images' bucket
      }

      const dataToCreate = { ...formState, image_url: imageUrl };
      await createFunction(dataToCreate);
      setFormState({}); // Clear form
      setSelectedFile(null); // Clear selected file
      await fetchItems(); // Refresh list
    } catch (err: any) {
      setError(err.message || 'Failed to create item');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    setLoading(true);
    setError(null);
    try {
      await deleteFunction(id);
      await fetchItems(); // Refresh list
    } catch (err: any) {
      setError(err.message || 'Failed to delete item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="capitalize">Add New {contentType.slice(0, -1)}</CardTitle>
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
                    <option value="">Select a {field.label}</option>
                    {field.options?.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                ) : field.type === 'image' ? ( // Handle image type
                  <Input
                    id={field.name}
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
                  />
                )}
              </div>
            ))}
            <div className="md:col-span-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'Adding...' : 'Add'} {contentType.slice(0, -1)}
              </Button>
            </div>
            {error && <p className="text-red-500 mt-2 md:col-span-2">{error}</p>}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="capitalize">Manage {contentType}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && items.length === 0 ? (
            <p>Loading {contentType}...</p>
          ) : items.length === 0 ? (
            <p>No {contentType} found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {displayFields.map((field) => (
                      <TableHead key={field.key}>{field.label}</TableHead>
                    ))}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      {displayFields.map((field) => (
                        <TableCell key={field.key}>
                            {/* @ts-ignore */}
                            {item[field.key] instanceof Date ? item[field.key].toLocaleDateString() : item[field.key]}
                        </TableCell>
                      ))}
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          onClick={() => handleDelete(item.id)}
                          disabled={loading}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
