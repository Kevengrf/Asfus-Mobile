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
    { name: 'name', label: 'Nome do Convênio', type: 'text', required: true, placeholder: 'Ex: Colégio Saber' },
    { name: 'category', label: 'Categoria', type: 'text', placeholder: 'Ex: Educação' },
    { name: 'benefit_desc', label: 'Descrição do Benefício', type: 'textarea', required: true, placeholder: 'Ex: 15% de desconto nas mensalidades para associados e seus dependentes.' },
    { name: 'logo_url', label: 'Logo', type: 'image' },
  ];

  const partnerDisplayFields = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Nome' },
    { key: 'category', label: 'Categoria' },
    { key: 'benefit_desc', label: 'Benefício' },
    { key: 'logo_url', label: 'URL da Logo' },
  ];

  return (
    <AdminContentManager<Partner>
      contentType="Convênios"
      fetchFunction={getAllPartners}
      createFunction={createPartner}
      deleteFunction={deletePartner}
      uploadImageFunction={uploadImage}
      fields={partnerFields}
      displayFields={partnerDisplayFields}
    />
  );
}
