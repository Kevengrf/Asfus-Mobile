"use client";

import { AdminContentManager } from "@/components/admin/AdminContentManager";
import { getAllNews, createNews, deleteNews, uploadImage } from "@/lib/supabase/client"; // Import uploadImage

interface News {
  id: number;
  created_at: string;
  title: string;
  summary?: string;
  content_html: string;
  image_url?: string;
}

export default function AdminNewsPage() {
  const newsFields = [
    { name: 'title', label: 'Título', type: 'text', required: true, placeholder: 'Ex: Nova parceria com a Academia Corpo & Mente' },
    { name: 'summary', label: 'Resumo', type: 'textarea', placeholder: 'Ex: A ASFUS fechou uma nova parceria que oferece 20% de desconto para associados.' },
    { name: 'content_html', label: 'Conteúdo (HTML)', type: 'textarea', required: true, placeholder: 'Ex: <p>É com grande alegria que anunciamos nossa nova parceria com a <b>Academia Corpo & Mente</b>.</p>' },
    { name: 'image_url', label: 'Imagem', type: 'image' },
  ];

  const newsDisplayFields = [
    { key: 'id', label: 'ID' },
    { key: 'title', label: 'Título' },
    { key: 'summary', label: 'Resumo' },
    { key: 'created_at', label: 'Criado em' },
    { key: 'image_url', label: 'URL da Imagem' },
  ];

  return (
    <AdminContentManager<News>
      contentType="Notícias"
      fetchFunction={getAllNews}
      createFunction={createNews}
      deleteFunction={deleteNews}
      uploadImageFunction={uploadImage} // Pass the uploadImage function
      fields={newsFields}
      displayFields={newsDisplayFields}
    />
  );
}
