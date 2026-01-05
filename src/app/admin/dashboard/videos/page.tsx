"use client";

import * as React from "react";
import { supabase } from "@/lib/supabase/client";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog";
import { Loader2, Upload, Trash2, PlusCircle, PlayCircle, Eye } from "lucide-react";

type VideoItem = {
    id: number;
    title: string;
    description: string | null;
    video_url: string;
    created_at: string;
};

export default function AdminVideosPage() {
    const [videos, setVideos] = React.useState<VideoItem[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isUploading, setIsUploading] = React.useState(false);
    const [uploadError, setUploadError] = React.useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = React.useState(false);

    // Fetch Videos
    const fetchVideos = React.useCallback(async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('videos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching videos:', error);
        } else if (data) {
            setVideos(data);
        }
        setIsLoading(false);
    }, []);

    React.useEffect(() => {
        fetchVideos();
    }, [fetchVideos]);

    const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setUploadError(null);
        setIsUploading(true);

        const form = event.currentTarget;
        const fileInput = form.elements.namedItem('videoFile') as HTMLInputElement;
        const titleInput = form.elements.namedItem('title') as HTMLInputElement;
        const descriptionInput = form.elements.namedItem('description') as HTMLTextAreaElement;

        const file = fileInput.files?.[0];
        const title = titleInput.value;
        const description = descriptionInput.value;

        if (!file || !title) {
            setUploadError("Por favor, selecione um vídeo e informe um título.");
            setIsUploading(false);
            return;
        }

        // 1. Upload to Storage
        const filePath = `videos/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        const { error: uploadErrorStorage } = await supabase.storage.from('videos').upload(filePath, file);

        if (uploadErrorStorage) {
            setUploadError(`Erro no upload do arquivo: ${uploadErrorStorage.message}`);
            setIsUploading(false);
            return;
        }

        // 2. Get Public URL
        const { data: publicUrlData } = supabase.storage.from('videos').getPublicUrl(filePath);

        if (!publicUrlData || !publicUrlData.publicUrl) {
            setUploadError("Não foi possível obter a URL pública do vídeo.");
            await supabase.storage.from('videos').remove([filePath]); // Cleanup
            setIsUploading(false);
            return;
        }

        // 3. Insert into Database
        const { data: newVideo, error: dbError } = await supabase
            .from('videos')
            .insert({
                title,
                description: description || null,
                video_url: publicUrlData.publicUrl
            })
            .select()
            .single();

        if (dbError) {
            setUploadError(`Erro ao salvar no banco: ${dbError.message}`);
            // Cleanup storage if DB fails
            await supabase.storage.from('videos').remove([filePath]);
        } else if (newVideo) {
            setVideos(prev => [newVideo, ...prev]);
            form.reset();
            setIsModalOpen(false);
        }

        setIsUploading(false);
    };

    const handleDelete = async (id: number, videoUrl: string) => {
        if (!confirm('Tem certeza que deseja remover este vídeo?')) return;

        setIsLoading(true);
        try {
            // Extract filename from URL
            // URL format: .../storage/v1/object/public/videos/videos/timestamp_filename
            const urlParts = videoUrl.split('/videos/');
            // The bucket name 'videos' might be repeated depending on Supabase version url structure.
            // Usually: supabase.co/.../storage/v1/object/public/BUCKET/PATH
            // If bucket is 'videos', then path starts after that.

            // Let's try to parse the path assuming standard supabase storage URL
            // publicUrl: https://xyz.supabase.co/storage/v1/object/public/videos/videos/filename.mp4 
            // wait, if I uploaded to 'videos' bucket with path 'videos/filename', then public url is .../videos/videos/filename?
            // The code above was `gallery/${Date.now()}_...` inside 'galeria' bucket.
            // Here I used `videos/${Date.now()}...` inside 'videos' bucket.
            // So path is `videos/filename`.

            let filePath = "";
            try {
                const urlObj = new URL(videoUrl);
                // Pathname: /storage/v1/object/public/videos/videos/123_test.mp4
                // We need: videos/123_test.mp4 inside bucket 'videos'
                const pathParts = urlObj.pathname.split('/public/videos/');
                if (pathParts.length > 1) {
                    filePath = decodeURIComponent(pathParts[1]);
                }
            } catch (e) {
                // Fallback manual split
                filePath = videoUrl.split('/videos/').pop() || "";
            }

            if (filePath) {
                const { error: storageDelError } = await supabase.storage.from('videos').remove([filePath]);
                if (storageDelError) console.warn("Storage delete warning:", storageDelError);
            }

            const { error: dbDelError } = await supabase.from('videos').delete().eq('id', id);
            if (dbDelError) throw dbDelError;

            setVideos(prev => prev.filter(v => v.id !== id));
        } catch (err: any) {
            console.error('Erro ao deletar vídeo:', err);
            setUploadError(`Erro ao deletar: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Gerenciamento de Vídeos Mobile</h1>
                    <p className="text-muted-foreground">Envie vídeos curtos (formato vertical tipo TikTok) para o app.</p>
                </div>
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                        <Button className="w-full md:w-auto">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Adicionar Vídeo
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Enviar Novo Vídeo</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="videoFile" className="text-sm font-medium">Arquivo de Vídeo (MP4/MOV)</label>
                                <Input id="videoFile" name="videoFile" type="file" accept="video/*" required />
                                <p className="text-xs text-muted-foreground">Recomendado: Formato vertical (9:16), máx 50MB.</p>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="title" className="text-sm font-medium">Título</label>
                                <Input id="title" name="title" type="text" placeholder="Ex: Festa dos Servidores" required />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="description" className="text-sm font-medium">Descrição</label>
                                <Textarea id="description" name="description" placeholder="Uma breve descrição..." />
                            </div>

                            {uploadError && <p className="text-sm text-red-500 bg-red-50 p-2 rounded">{uploadError}</p>}

                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="secondary">Cancelar</Button>
                                </DialogClose>
                                <Button type="submit" disabled={isUploading}>
                                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                    {isUploading ? "Enviando..." : "Enviar Vídeo"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader><CardTitle>Vídeos Publicados</CardTitle><CardDescription>Total: {videos.length}</CardDescription></CardHeader>
                <CardContent>
                    {isLoading ? <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /> : (
                        videos.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">Nenhum vídeo publicado ainda.</div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {videos.map(video => (
                                    <div key={video.id} className="relative group border rounded-lg overflow-hidden bg-black/5">
                                        {/* Thumbnail / Video Preview */}
                                        <div className="aspect-[9/16] bg-black relative">
                                            <video
                                                src={video.video_url}
                                                className="w-full h-full object-cover"
                                                preload="metadata"
                                                muted // Muted to allow autoplay metadata loading if needed
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                                                <PlayCircle className="text-white w-12 h-12 opacity-80" />
                                            </div>
                                        </div>

                                        <div className="p-3 bg-white border-t">
                                            <h3 className="font-semibold truncate" title={video.title}>{video.title}</h3>
                                            <p className="text-xs text-muted-foreground truncate">{new Date(video.created_at).toLocaleDateString()}</p>
                                        </div>

                                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => window.open(video.video_url, '_blank')}
                                                title="Visualizar"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => handleDelete(video.id, video.video_url)}
                                                disabled={isLoading}
                                                title="Deletar"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
