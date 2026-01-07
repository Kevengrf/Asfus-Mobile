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

    const [isFlipped, setIsFlipped] = React.useState(false);

    if (isLoading) return <div className="h-64 animate-pulse bg-slate-100 rounded-xl max-w-sm mx-auto shadow-md"></div>;
    if (!profile) return null;

    const displayImage = profile.profile_image;
    const isPending = !!profile.pending_profile_image;

    // Format Date
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "N/A";
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    return (
        <div className="flex flex-col items-center mb-8">
            {/* Card Container - Perspective */}
            <div className="group relative w-full max-w-[320px] h-[500px] cursor-pointer" onClick={() => setIsFlipped(!isFlipped)} style={{ perspective: '1000px' }}>

                {/* Card Inner - Transform Sync */}
                <div className={`relative w-full h-full transition-all duration-700 ease-in-out transform shadow-2xl rounded-2xl ${isFlipped ? 'rotate-y-180' : ''}`} style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>

                    {/* --- FRONT SIDE --- */}
                    <div className="absolute w-full h-full bg-white rounded-2xl overflow-hidden backface-hidden flex flex-col items-center border border-slate-200" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
                        {/* Background Design */}
                        <div className="absolute top-0 w-full h-40 bg-gradient-to-br from-blue-600 to-blue-800 rounded-b-[40%] shadow-md z-0"></div>

                        {/* Header Text */}
                        <div className="z-10 mt-6 text-center">
                            <h1 className="text-white font-bold text-xl tracking-wider">ASFUS</h1>
                            <p className="text-blue-100 text-xs uppercase tracking-widest">Associação dos Funcionários</p>
                        </div>

                        {/* Photo with Ring */}
                        <div className="z-10 mt-6 relative group/photo">
                            <div className="w-32 h-32 rounded-full p-1 bg-white shadow-lg">
                                <Avatar className="w-full h-full rounded-full border-4 border-blue-50">
                                    <AvatarImage src={displayImage} className="object-cover" />
                                    <AvatarFallback><User className="w-12 h-12 text-slate-300" /></AvatarFallback>
                                </Avatar>
                            </div>

                            {/* Edit Button (Prevent flip when clicking this) */}
                            <div className="absolute bottom-0 right-0 z-20" onClick={(e) => e.stopPropagation()}>
                                <label htmlFor="photo-upload" className="cursor-pointer bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors shadow-lg flex items-center justify-center border-2 border-white">
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

                        {/* Name & Basic Info */}
                        <div className="z-10 mt-6 text-center px-4 w-full">
                            <h2 className="text-2xl font-bold text-slate-800 uppercase leading-tight line-clamp-2">{profile.nome_completo}</h2>
                            <p className="text-blue-600 font-bold uppercase tracking-widest mt-2 text-sm">{profile.role === 'admin' ? 'Administrador' : 'Associado'}</p>

                            <div className="mt-8 grid grid-cols-2 gap-4 w-full border-t pt-4">
                                <div className="text-center">
                                    <p className="text-xs text-slate-400 uppercase">Matrícula</p>
                                    <p className="font-mono font-bold text-slate-700 text-lg">{profile.matricula || '---'}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-slate-400 uppercase">Status</p>
                                    <p className={`font-bold text-lg ${profile.status === 'ativo' ? 'text-green-600' : 'text-red-500'}`}>
                                        {profile.status?.toUpperCase() || '---'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer Decoration */}
                        <div className="mt-auto w-full h-4 bg-blue-600"></div>

                        {isPending && (
                            <div className="absolute top-2 right-2 z-20 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-1 rounded shadow-sm animate-pulse">
                                FOTO EM ANÁLISE
                            </div>
                        )}
                    </div>

                    {/* --- BACK SIDE --- */}
                    <div className="absolute w-full h-full bg-slate-50 rounded-2xl overflow-hidden backface-hidden flex flex-col border border-slate-200 transform rotate-y-180"
                        style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>

                        <div className="bg-slate-800 p-4 text-white text-center">
                            <h3 className="font-bold uppercase tracking-wider">Detalhes Pessoais</h3>
                        </div>

                        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                            <div className="space-y-1">
                                <label className="text-xs text-slate-400 uppercase font-bold">CPF</label>
                                <p className="font-medium text-slate-700">{profile.cpf || 'Não informado'}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-slate-400 uppercase font-bold">Email</label>
                                <p className="font-medium text-slate-700 text-sm break-all">{profile.email}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-slate-400 uppercase font-bold">Data de Nascimento</label>
                                <p className="font-medium text-slate-700">{formatDate(profile.dt_nasc)}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-slate-400 uppercase font-bold">Telefone</label>
                                <p className="font-medium text-slate-700">{profile.telefone || '---'}</p>
                            </div>

                            {/* Dependents Section */}
                            {profile.dependentes && profile.dependentes.length > 0 && (
                                <div className="pt-4 border-t border-slate-200">
                                    <label className="text-xs text-slate-400 uppercase font-bold block mb-2">Dependentes</label>
                                    <ul className="space-y-2">
                                        {profile.dependentes.map((dep: any, i: number) => (
                                            <li key={i} className="text-sm bg-white p-2 rounded border border-slate-100 shadow-sm flex justify-between">
                                                <span className="font-medium text-slate-700">{dep.nome}</span>
                                                <span className="text-slate-400 text-xs">{dep.parentesco}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-slate-100 text-center text-xs text-slate-400 border-t">
                            <p>Clique para virar</p>
                            <div className="mt-1 font-mono">{profile.id.substring(0, 8)}...</div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Hint Text */}
            <div className="mt-4 flex items-center gap-2 text-slate-400 text-sm animate-bounce">
                <Loader2 className="w-4 h-4" /> Clique no cartão para ver detalhes
            </div>


            {/* Crop Modal (Kept Outside Check) */}
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
