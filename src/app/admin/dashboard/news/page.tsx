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
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'summary', label: 'Summary', type: 'textarea' },
    { name: 'content_html', label: 'Content (HTML)', type: 'textarea', required: true },
    { name: 'image_url', label: 'Image', type: 'image' }, // Changed type to 'image'
  ];

  const newsDisplayFields = [
    { key: 'id', label: 'ID' },
    { key: 'title', label: 'Title' },
    { key: 'summary', label: 'Summary' },
    { key: 'created_at', label: 'Created At' },
    { key: 'image_url', label: 'Image URL' },
  ];

  return (
    <AdminContentManager<News>
      contentType="news"
      fetchFunction={getAllNews}
      createFunction={createNews}
      deleteFunction={deleteNews}
      uploadImageFunction={uploadImage} // Pass the uploadImage function
      fields={newsFields}
      displayFields={newsDisplayFields}
    />
  );
}
