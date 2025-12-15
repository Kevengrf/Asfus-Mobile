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
    { name: 'title', label: 'Event Title', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea', required: true },
    { name: 'image_url', label: 'Image', type: 'image' }, // Changed type to 'image'
    { name: 'event_date', label: 'Event Date', type: 'date', required: true },
    { name: 'location', label: 'Location', type: 'text' },
  ];

  const eventDisplayFields = [
    { key: 'id', label: 'ID' },
    { key: 'title', label: 'Title' },
    { key: 'event_date', label: 'Event Date' },
    { key: 'location', label: 'Location' },
    { key: 'image_url', label: 'Image URL' },
  ];

  return (
    <AdminContentManager<Event>
      contentType="events"
      fetchFunction={getAllEvents}
      createFunction={createEvent}
      deleteFunction={deleteEvent}
      uploadImageFunction={uploadImage} // Pass the uploadImage function
      fields={eventFields}
      displayFields={eventDisplayFields}
    />
  );
}
