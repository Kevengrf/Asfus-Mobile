
import { createClient } from '@supabase/supabase-js'

// Pega a URL e a Chave Anônima do arquivo .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cria e exporta o cliente Supabase para ser usado no lado do navegador
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// --- News Functions ---
export async function getAllNews() {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching news:', error);
    return [];
  }
  return data;
}

export async function createNews(newsData: { title: string; summary?: string; content_html: string; image_url?: string }) {
  const { data, error } = await supabase
    .from('news')
    .insert([newsData])
    .select();
  if (error) {
    console.error('Error creating news:', error);
    throw error;
  }
  return data[0];
}

export async function deleteNews(id: number) {
  const { error } = await supabase
    .from('news')
    .delete()
    .eq('id', id);
  if (error) {
    console.error('Error deleting news:', error);
    throw error;
  }
}

// --- Partners Functions ---
export async function getAllPartners() {
  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .order('name', { ascending: true });
  if (error) {
    console.error('Error fetching partners:', error);
    return [];
  }
  return data;
}

export async function createPartner(partnerData: { name: string; category?: string; benefit_desc: string; logo_url?: string }) {
  const { data, error } = await supabase
    .from('partners')
    .insert([partnerData])
    .select();
  if (error) {
    console.error('Error creating partner:', error);
    throw error;
  }
  return data[0];
}

export async function deletePartner(id: number) {
  const { error } = await supabase
    .from('partners')
    .delete()
    .eq('id', id);
  if (error) {
    console.error('Error deleting partner:', error);
    throw error;
  }
}

// --- Events Functions ---
export async function getAllEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: false });
  if (error) {
    console.error('Error fetching events:', error);
    return [];
  }
  return data;
}

export async function createEvent(eventData: { title: string; description: string; image_url?: string; event_date: string; location?: string }) {
  const { data, error } = await supabase
    .from('events')
    .insert([eventData])
    .select();
  if (error) {
    console.error('Error creating event:', error);
    throw error;
  }
  return data[0];
}

export async function deleteEvent(id: number) {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id);
  if (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
}

// --- Storage Functions ---
export async function uploadImage(file: File, bucketName: string = 'content-images') {
  const fileExt = file.name.split('.').pop();
  const filePath = `${bucketName}/${Math.random().toString(36).substring(2, 15)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file);

  if (uploadError) {
    console.error('Error uploading image:', uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

// --- Gallery Functions ---
export async function getAllGallery() {
  const { data, error } = await supabase
    .from('gallery')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching gallery:', error);
    return [];
  }
  return data;
}

export async function createGallery(galleryData: { image_url: string; caption?: string }) {
  const { data, error } = await supabase
    .from('gallery')
    .insert([galleryData])
    .select();
  if (error) {
    console.error('Error creating gallery item:', error);
    throw error;
  }
  return data[0];
}

export async function deleteGallery(id: number) {
  const { error } = await supabase
    .from('gallery')
    .delete()
    .eq('id', id);
  if (error) {
    console.error('Error deleting gallery item:', error);
    throw error;
  }
}

