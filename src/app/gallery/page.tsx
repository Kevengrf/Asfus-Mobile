"use client";

import * as React from "react";
import { supabase } from "@/lib/supabase/client";
import { Loader2, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type GalleryImage = {
    id: number;
    url: string;
    caption: string | null;
};

export default function GalleryPage() {
    const [images, setImages] = React.useState<GalleryImage[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);

    React.useEffect(() => {
        const fetchImages = async () => {
            setIsLoading(true);
            const { data } = await supabase.from('gallery').select('*').order('created_at', { ascending: false });
            if (data) setImages(data);
            setIsLoading(false);
        };
        fetchImages();
    }, []);

    const openLightbox = (index: number) => {
        setSelectedImageIndex(index);
        setIsLightboxOpen(true);
    };

    const goToNext = () => {
        setSelectedImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    };

    const goToPrevious = () => {
        setSelectedImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
    };

    return (
        <div className="container mx-auto px-4 py-16">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold">Nossa Galeria</h1>
                <p className="text-lg text-muted-foreground mt-2">Momentos especiais da nossa associação.</p>
            </div>

            {isLoading ? (
                <div className="flex justify-center"><Loader2 className="h-12 w-12 animate-spin" /></div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {images.map((image, index) => (
                        <div key={image.id} onClick={() => openLightbox(index)} className="aspect-square cursor-pointer overflow-hidden rounded-lg">
                            <img src={image.url} alt={image.caption || 'Imagem da galeria'} className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" />
                        </div>
                    ))}
                </div>
            )}
            
            {/* Lightbox Dialog */}
            <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-transparent border-none flex items-center justify-center">
                    {images.length > 0 && (
                        <div className="relative w-full h-full">
                            <img src={images[selectedImageIndex].url} alt={images[selectedImageIndex].caption || ''} className="max-w-full max-h-[80vh] object-contain mx-auto" />
                            <p className="text-white text-center mt-2 bg-black/50 p-2 rounded-b-lg">{images[selectedImageIndex].caption}</p>
                            
                            {/* Navigation Buttons */}
                            {images.length > 1 && (
                                <>
                                    <Button onClick={goToPrevious} variant="outline" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2">
                                        <ChevronLeft />
                                    </Button>
                                    <Button onClick={goToNext} variant="outline" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2">
                                        <ChevronRight />
                                    </Button>
                                </>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}