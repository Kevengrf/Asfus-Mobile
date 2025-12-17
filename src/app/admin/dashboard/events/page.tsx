"use client";

import { AdminContentManager } from "@/components/admin/AdminContentManager";
import { getAllEvents, createEvent, deleteEvent, uploadImage } from "@/lib/supabase/client"; // Import uploadImage

interface Event {
  id: number;
  created_at: string;
  title: string;
  description: string;
  image_url?: string;
  event_date: string;
  location?: string;
}

export default function AdminEventsPage() {
  const eventFields = [
    { name: 'title', label: 'Título do Evento', type: 'text', required: true, placeholder: 'Ex: Festa de Fim de Ano da ASFUS' },
    { name: 'description', label: 'Descrição', type: 'textarea', required: true, placeholder: 'Ex: Venha celebrar conosco mais um ano de conquistas!' },
    { name: 'image_url', label: 'Imagem do Evento', type: 'image' },
    { name: 'event_date', label: 'Data do Evento', type: 'date', required: true },
    { name: 'location', label: 'Localização', type: 'text', placeholder: 'Ex: Sede da ASFUS' },
  ];

  const eventDisplayFields = [
    { key: 'id', label: 'ID' },
    { key: 'title', label: 'Título' },
    { key: 'event_date', label: 'Data do Evento' },
    { key: 'location', label: 'Local' },
    { key: 'image_url', label: 'URL da Imagem' },
  ];

  return (
    <AdminContentManager<Event>
      contentType="Eventos"
      fetchFunction={getAllEvents}
      createFunction={createEvent}
      deleteFunction={deleteEvent}
      uploadImageFunction={uploadImage}
      fields={eventFields}
      displayFields={eventDisplayFields}
    />
  );
}
