
"use client";

import * as React from "react";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Upload } from "lucide-react";

type GalleryImage = {
    id: number;
    url: string;
    caption: string | null;
};

export default function AdminGalleryPage() {
    const [images, setImages] = React.useState<GalleryImage[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isUploading, setIsUploading] = React.useState(false);
    const [uploadError, setUploadError] = React.useState<string | null>(null);

    // Busca imagens existentes
    React.useEffect(() => {
        const fetchImages = async () => {
            const { data, error } = await supabase.from('gallery').select('*');
            if (data) setImages(data);
            setIsLoading(false);
        };
        fetchImages();
    }, []);

    const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setUploadError(null);
        setIsUploading(true);

        const form = event.currentTarget;
        const fileInput = form.elements.namedItem('imageFile') as HTMLInputElement;
        const captionInput = form.elements.namedItem('caption') as HTMLInputElement;

        const file = fileInput.files?.[0];
        if (!file) {
            setUploadError("Por favor, selecione um arquivo.");
            setIsUploading(false);
            return;
        }

        // 1. Upload para o Supabase Storage
        const filePath = `gallery/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
            .from('galeria') // Nome do seu bucket PÚBLICO
            .upload(filePath, file);
        
        if (uploadError) {
            setUploadError(`Erro no upload: ${uploadError.message}`);
            setIsUploading(false);
            return;
        }

        // 2. Obter a URL pública da imagem
        const { data: publicUrlData } = supabase.storage
            .from('galeria')
            .getPublicUrl(filePath);

        if (!publicUrlData) {
            setUploadError("Não foi possível obter a URL pública da imagem.");
            setIsUploading(false);
            return;
        }

        // 3. Salvar a URL e legenda na tabela 'gallery'
        const { data: newImage, error: dbError } = await supabase
            .from('gallery')
            .insert({ url: publicUrlData.publicUrl, caption: captionInput.value || null })
            .select()
            .single();

        if (dbError) {
            setUploadError(`Erro ao salvar no banco: ${dbError.message}`);
        } else if (newImage) {
            // Adiciona a nova imagem à lista na tela
            setImages(prev => [newImage, ...prev]);
            form.reset();
        }

        setIsUploading(false);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Gerenciamento da Galeria</CardTitle>
                    <CardDescription>Envie novas fotos para a galeria pública do site.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpload} className="space-y-4">
                        <Input id="imageFile" type="file" accept="image/*" required />
                        <Input id="caption" type="text" placeholder="Legenda da foto (opcional)" />
                        <Button type="submit" disabled={isUploading}>
                            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4"/>}
                            Enviar Imagem
                        </Button>
                        {uploadError && <p className="text-sm text-red-500">{uploadError}</p>}
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Imagens Atuais</CardTitle></CardHeader>
                <CardContent>
                    {isLoading ? <Loader2 className="h-8 w-8 animate-spin"/> : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {images.map(image => (
                                <div key={image.id} className="relative aspect-square">
                                    <img src={image.url} alt={image.caption || 'Imagem da galeria'} className="w-full h-full object-cover rounded-md" />
                                    {/* Adicionar botão de deletar aqui no futuro */}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
