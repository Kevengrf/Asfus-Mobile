"use client";

import { AdminContentManager } from "@/components/admin/AdminContentManager";
import { getAllPartners, createPartner, deletePartner, uploadImage } from "@/lib/supabase/client"; // Import uploadImage

interface Partner {
  id: number;
  name: string;
  category?: string;
  benefit_desc: string;
  logo_url?: string;
}

export default function AdminPartnersPage() {
  const partnerFields = [
    { name: 'name', label: 'Partner Name', type: 'text', required: true },
    { name: 'category', label: 'Category', type: 'text' },
    { name: 'benefit_desc', label: 'Benefit Description', type: 'textarea', required: true },
    { name: 'logo_url', label: 'Logo', type: 'image' }, // Changed type to 'image'
  ];

  const partnerDisplayFields = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'category', label: 'Category' },
    { key: 'benefit_desc', label: 'Benefit' },
    { key: 'logo_url', label: 'Logo URL' },
  ];

  return (
    <AdminContentManager<Partner>
      contentType="partners"
      fetchFunction={getAllPartners}
      createFunction={createPartner}
      deleteFunction={deletePartner}
      uploadImageFunction={uploadImage} // Pass the uploadImage function
      fields={partnerFields}
      displayFields={partnerDisplayFields}
    />
  );
}
