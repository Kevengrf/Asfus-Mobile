
"use client";

import * as React from "react";
import Image from "next/image";
import { supabase, deleteGallery } from "@/lib/supabase/client";
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog";
import { Loader2, Upload, Trash2, PlusCircle } from "lucide-react";

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
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 12; // Adjust as needed

    const fetchImages = React.useCallback(async () => {
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

        const filePath = `gallery/${Date.now()}_${file.name}`;
        const { error: uploadErrorStorage } = await supabase.storage.from('galeria').upload(filePath, file);
        
        if (uploadErrorStorage) {
            setUploadError(`Erro no upload: ${uploadErrorStorage.message}`);
            setIsUploading(false);
            return;
        }

        const { data: publicUrlData } = supabase.storage.from('galeria').getPublicUrl(filePath);

        if (!publicUrlData || !publicUrlData.publicUrl) {
            setUploadError("Não foi possível obter a URL pública da imagem.");
            setIsUploading(false);
            return;
        }

        const { data: newImage, error: dbError } = await supabase
            .from('gallery')
            .insert({ image_url: publicUrlData.publicUrl, caption: captionInput.value || null })
            .select('id, image_url, caption')
            .single();

        if (dbError) {
            setUploadError(`Erro ao salvar no banco: ${dbError.message}`);
            await supabase.storage.from('galeria').remove([filePath]);
        } else if (newImage) {
            setImages(prev => [newImage, ...prev]);
            form.reset();
            setIsModalOpen(false);
        }

        setIsUploading(false);
    };

    const handleDelete = async (id: number, imageUrl: string) => {
        if (!confirm('Tem certeza que deseja remover esta imagem da galeria?')) return;
        
        setIsLoading(true);
        try {
            const filePath = imageUrl.split('galeria/').pop();
            if (filePath) {
                await supabase.storage.from('galeria').remove([`gallery/${filePath}`]);
            }
            await deleteGallery(id);
            await fetchImages();
        } catch (err: any) {
            console.error('Erro ao deletar imagem:', err);
            setUploadError(`Erro ao deletar imagem: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Pagination logic
    const lastItemIndex = currentPage * itemsPerPage;
    const firstItemIndex = lastItemIndex - itemsPerPage;
    const currentImages = images.slice(firstItemIndex, lastItemIndex);
    const totalPages = Math.ceil(images.length / itemsPerPage);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Gerenciamento da Galeria</h1>
                    <p className="text-muted-foreground">Envie e gerencie as fotos da galeria pública do site.</p>
                </div>
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Adicionar Imagem
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Enviar Nova Imagem</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <Input id="imageFile" type="file" accept="image/*" required />
                            <Input id="caption" type="text" placeholder="Legenda da foto (opcional)" />
                            {uploadError && <p className="text-sm text-red-500">{uploadError}</p>}
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="secondary">Cancelar</Button>
                                </DialogClose>
                                <Button type="submit" disabled={isUploading}>
                                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4"/>}
                                    Enviar
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader><CardTitle>Imagens Atuais</CardTitle></CardHeader>
                <CardContent>
                    {isLoading ? <Loader2 className="h-8 w-8 animate-spin mx-auto"/> : (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {currentImages.map(image => (
                                    <div key={image.id} className="relative aspect-square group">
                                        <Image src={image.image_url} alt={image.caption || 'Imagem da galeria'} layout="fill" className="object-cover rounded-md" />
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleDelete(image.id, image.image_url)}
                                            disabled={isLoading}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                             <div className="flex justify-end items-center gap-4 mt-4">
                                <span>Página {currentPage} de {totalPages}</span>
                                <Button
                                    variant="outline"
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    Anterior
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                >
                                    Próxima
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
