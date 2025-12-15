
"use client";

import * as React from "react";
import { supabase, deleteGallery } from "@/lib/supabase/client"; // Import deleteGallery
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, Trash2 } from "lucide-react"; // Import Trash2 icon

type GalleryImage = {
    id: number;
    image_url: string;
    caption: string | null;
};

export default function AdminGalleryPage() {
    const [images, setImages] = React.useState<GalleryImage[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isUploading, setIsUploading] = React.useState(false);
    const [uploadError, setUploadError] = React.useState<string | null>(null);

    // Busca imagens existentes
    const fetchImages = React.useCallback(async () => { // Use useCallback for fetchImages
        setIsLoading(true);
        const { data, error } = await supabase.from('gallery').select('id, image_url, caption').order('created_at', { ascending: false });
        if (error) {
            console.error('Error fetching images:', error);
            setUploadError('Erro ao buscar imagens existentes.');
        } else if (data) {
            setImages(data);
        }
        setIsLoading(false);
    }, []);

    React.useEffect(() => {
        fetchImages();
    }, [fetchImages]);

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
        const { error: uploadErrorStorage } = await supabase.storage // Renamed error variable
            .from('galeria') // Nome do seu bucket PÚBLICO
            .upload(filePath, file);
        
        if (uploadErrorStorage) { // Use renamed error variable
            setUploadError(`Erro no upload: ${uploadErrorStorage.message}`);
            setIsUploading(false);
            return;
        }

        // 2. Obter a URL pública da imagem
        const { data: publicUrlData } = supabase.storage
            .from('galeria')
            .getPublicUrl(filePath);

        if (!publicUrlData || !publicUrlData.publicUrl) { // Added check for publicUrlData.publicUrl
            setUploadError("Não foi possível obter a URL pública da imagem.");
            setIsUploading(false);
            return;
        }

        // 3. Salvar a URL e legenda na tabela 'gallery'
        const { data: newImage, error: dbError } = await supabase
            .from('gallery')
            .insert({ image_url: publicUrlData.publicUrl, caption: captionInput.value || null })
            .select('id, image_url, caption')
            .single();

        if (dbError) {
            setUploadError(`Erro ao salvar no banco: ${dbError.message}`);
            // Optionally, delete the uploaded file from storage if DB insert fails
            await supabase.storage.from('galeria').remove([filePath]);
        } else if (newImage) {
            setImages(prev => [newImage, ...prev]);
            form.reset();
        }

        setIsUploading(false);
    };

    const handleDelete = async (id: number, imageUrl: string) => {
        if (!confirm('Tem certeza que deseja remover esta imagem da galeria?')) {
            return;
        }
        setIsLoading(true);
        try {
            // 1. Deletar do Storage
            const filePath = imageUrl.split('galeria/').pop(); // Extract file path from URL
            if (filePath) {
                const { error: storageError } = await supabase.storage
                    .from('galeria')
                    .remove([`gallery/${filePath}`]); // Ensure correct path for removal
                if (storageError) throw storageError;
            }

            // 2. Deletar do Banco de Dados
            await deleteGallery(id);
            await fetchImages(); // Refresh the list
        } catch (err: any) {
            console.error('Erro ao deletar imagem:', err);
            setUploadError(`Erro ao deletar imagem: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
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
                                <div key={image.id} className="relative aspect-square group"> {/* Added group for styling */}
                                    <img src={image.image_url} alt={image.caption || 'Imagem da galeria'} className="w-full h-full object-cover rounded-md" />
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                        onClick={() => handleDelete(image.id, image.image_url)}
                                        disabled={isLoading}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
