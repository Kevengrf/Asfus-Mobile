"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";
import { Camera, Loader2, User } from "lucide-react";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
    return centerCrop(
        makeAspectCrop(
            {
                unit: '%',
                width: 90,
            },
            aspect,
            mediaWidth,
            mediaHeight,
        ),
        mediaWidth,
        mediaHeight,
    )
}

export function ProfileHeader() {
    const [profile, setProfile] = React.useState<any>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    // Upload State
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
    const [imgSrc, setImgSrc] = React.useState('');
    const [crop, setCrop] = React.useState<Crop>();
    const [completedCrop, setCompletedCrop] = React.useState<PixelCrop>();
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [isUploading, setIsUploading] = React.useState(false);

    const imgRef = React.useRef<HTMLImageElement>(null);

    const fetchProfile = React.useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (data) setProfile(data);
        setIsLoading(false);
    }, []);

    React.useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files && e.target.files.length > 0) {
            setCrop(undefined); // Makes crop preview update between images
            const reader = new FileReader();
            reader.addEventListener('load', () =>
                setImgSrc(reader.result?.toString() || ''),
            );
            reader.readAsDataURL(e.target.files[0]);
            setSelectedFile(e.target.files[0]);
            setIsDialogOpen(true);
        }
    }

    function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        const { width, height } = e.currentTarget;
        setCrop(centerAspectCrop(width, height, 1));
    }

    async function onUpload() {
        if (!completedCrop || !imgRef.current || !selectedFile || !profile) return;
        setIsUploading(true);

        try {
            // 1. Create Canvas to crop
            const image = imgRef.current;
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('No 2d context');

            const scaleX = image.naturalWidth / image.width;
            const scaleY = image.naturalHeight / image.height;
            const pixelRatio = window.devicePixelRatio;

            canvas.width = Math.floor(completedCrop.width * scaleX * pixelRatio);
            canvas.height = Math.floor(completedCrop.height * scaleY * pixelRatio);

            ctx.scale(pixelRatio, pixelRatio);
            ctx.imageSmoothingQuality = 'high';

            const cropX = completedCrop.x * scaleX;
            const cropY = completedCrop.y * scaleY;

            const centerX = image.naturalWidth / 2;
            const centerY = image.naturalHeight / 2;

            ctx.save();

            // 5) Move the crop origin to the canvas origin (0,0)
            ctx.translate(-cropX, -cropY);
            ctx.drawImage(
                image,
                0,
                0,
                image.naturalWidth,
                image.naturalHeight,
                0,
                0,
                image.naturalWidth,
                image.naturalHeight,
            );

            ctx.restore();

            // 2. Convert to Blob
            const blob = await new Promise<Blob | null>((resolve) =>
                canvas.toBlob(resolve, 'image/jpeg', 0.95)
            );

            if (!blob) throw new Error('Canvas is empty');

            // 3. Upload to Supabase Storage
            const fileName = `${profile.id}/pending_${Date.now()}.jpg`;
            const { error: uploadError } = await supabase.storage
                .from('profiles')
                .upload(fileName, blob, { upsert: true });

            if (uploadError) throw uploadError;

            // 4. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('profiles')
                .getPublicUrl(fileName);

            // 5. Update Profile
            await supabase
                .from('profiles')
                .update({ pending_profile_image: publicUrl })
                .eq('id', profile.id);

            alert("Foto enviada para aprovação!");
            setIsDialogOpen(false);
            fetchProfile(); // Refresh UI to show pending status

        } catch (e: any) {
            alert(`Erro ao enviar foto: ${e.message}`);
        } finally {
            setIsUploading(false);
        }
    }

    if (isLoading) return <div className="h-20 animate-pulse bg-slate-100 rounded-lg"></div>;
    if (!profile) return null;

    const displayImage = profile.profile_image;
    const isPending = !!profile.pending_profile_image;

    return (
        <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border mb-6">
            <div className="relative">
                <Avatar className="w-16 h-16 border-2 border-white shadow-sm">
                    <AvatarImage src={displayImage} className="object-cover" />
                    <AvatarFallback><User className="w-8 h-8 text-slate-400" /></AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1">
                    <label htmlFor="photo-upload" className="cursor-pointer bg-slate-900 text-white p-1.5 rounded-full hover:bg-slate-700 transition-colors shadow flex items-center justify-center">
                        <Camera className="w-4 h-4" />
                        <input
                            id="photo-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={onSelectFile}
                        />
                    </label>
                </div>
            </div>

            <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{profile.nome_completo}</h2>
                <p className="text-sm text-slate-500">{profile.email}</p>
                {isPending && (
                    <span className="inline-block mt-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-medium">
                        Foto em análise
                    </span>
                )}
            </div>

            {/* Crop Modal */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Ajustar Foto</DialogTitle>
                        <DialogDescription>
                            Recorte sua foto para o perfil.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex justify-center p-4 bg-slate-100 rounded border border-dashed">
                        {imgSrc && (
                            <ReactCrop
                                crop={crop}
                                onChange={(_, percentCrop) => setCrop(percentCrop)}
                                onComplete={(c) => setCompletedCrop(c)}
                                aspect={1}
                                circularCrop
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    ref={imgRef}
                                    alt="Crop me"
                                    src={imgSrc}
                                    style={{ maxHeight: '60vh' }}
                                    onLoad={onImageLoad}
                                />
                            </ReactCrop>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isUploading}>
                            Cancelar
                        </Button>
                        <Button onClick={onUpload} disabled={isUploading || !completedCrop?.width || !completedCrop?.height}>
                            {isUploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Enviar Foto
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
