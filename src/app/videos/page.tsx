"use client";

import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { Heart, MessageCircle, ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";

type Video = {
    id: number;
    title: string;
    description: string | null;
    video_url: string;
    created_at: string;
    likes_count?: number; // Calculated field or separate query
};

type Comment = {
    id: number;
    author_name: string;
    content: string;
    created_at: string;
};

export default function MobileVideoFeed() {
    const [videos, setVideos] = useState<Video[]>([]);
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Interactions
    const [likes, setLikes] = useState<Record<number, number>>({});
    const [likedVideos, setLikedVideos] = useState<Record<number, boolean>>({});
    const [comments, setComments] = useState<Record<number, Comment[]>>({});
    const [newComment, setNewComment] = useState("");
    const [commentAuthor, setCommentAuthor] = useState("");

    // Session ID for anonymous likes
    const [sessionId, setSessionId] = useState("");

    useEffect(() => {
        // Generate or retrieve session ID
        let sid = localStorage.getItem('asfus_video_session_id');
        if (!sid) {
            sid = Math.random().toString(36).substring(2) + Date.now().toString(36);
            localStorage.setItem('asfus_video_session_id', sid);
        }
        setSessionId(sid);

        fetchVideos();
    }, []);

    const fetchVideos = async () => {
        const { data, error } = await supabase
            .from('videos')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) {
            setVideos(data);
            // Fetch initial likes for these videos
            data.forEach(v => fetchLikes(v.id));
        }
    };

    const fetchLikes = async (videoId: number) => {
        const { count } = await supabase
            .from('video_likes')
            .select('*', { count: 'exact', head: true })
            .eq('video_id', videoId);

        setLikes(prev => ({ ...prev, [videoId]: count || 0 }));

        // Check if current user liked
        const sid = localStorage.getItem('asfus_video_session_id');
        if (sid) {
            const { data } = await supabase
                .from('video_likes')
                .select('*')
                .eq('video_id', videoId)
                .eq('session_id', sid)
                .maybeSingle();

            if (data) {
                setLikedVideos(prev => ({ ...prev, [videoId]: true }));
            }
        }
    };

    const toggleLike = async (videoId: number) => {
        const isLiked = likedVideos[videoId];
        const sid = sessionId;

        if (isLiked) {
            // Unlike
            await supabase.from('video_likes').delete().match({ video_id: videoId, session_id: sid });
            setLikedVideos(prev => ({ ...prev, [videoId]: false }));
            setLikes(prev => ({ ...prev, [videoId]: Math.max(0, (prev[videoId] || 1) - 1) }));
        } else {
            // Like
            await supabase.from('video_likes').insert({ video_id: videoId, session_id: sid });
            setLikedVideos(prev => ({ ...prev, [videoId]: true }));
            setLikes(prev => ({ ...prev, [videoId]: (prev[videoId] || 0) + 1 }));
        }
    };

    const fetchComments = async (videoId: number) => {
        const { data } = await supabase
            .from('video_comments')
            .select('*')
            .eq('video_id', videoId)
            .order('created_at', { ascending: true });

        if (data) {
            setComments(prev => ({ ...prev, [videoId]: data }));
        }
    };

    const submitComment = async (videoId: number) => {
        if (!newComment.trim() || !commentAuthor.trim()) return;

        const { data, error } = await supabase
            .from('video_comments')
            .insert({
                video_id: videoId,
                author_name: commentAuthor,
                content: newComment
            })
            .select()
            .single();

        if (data) {
            setComments(prev => ({
                ...prev,
                [videoId]: [...(prev[videoId] || []), data]
            }));
            setNewComment("");
        }
    };

    // Scroll Handling
    const handleScroll = () => {
        if (!containerRef.current) return;
        const scrollPosition = containerRef.current.scrollTop;
        const height = containerRef.current.clientHeight;
        const index = Math.round(scrollPosition / height);
        if (index !== currentVideoIndex && index >= 0 && index < videos.length) {
            setCurrentVideoIndex(index);
        }
    };

    return (
        <div className="bg-black h-[100dvh] w-full relative overflow-hidden text-white">
            {/* Back Button */}
            <Link href="/" className="absolute top-4 left-4 z-50 p-2 bg-black/50 rounded-full">
                <ArrowLeft className="text-white" />
            </Link>

            <div
                ref={containerRef}
                className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
                onScroll={handleScroll}
            >
                {videos.map((video, index) => (
                    <div key={video.id} className="h-full w-full snap-start relative flex items-center justify-center bg-zinc-900">
                        {/* Video Player */}
                        <VideoPlayer
                            videoUrl={video.video_url}
                            isActive={index === currentVideoIndex}
                        />

                        {/* Overlay Info */}
                        <div className="absolute bottom-0 left-0 w-full z-20 pt-12 pb-6 px-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                            <div className="mr-14">
                                <h3 className="font-bold text-lg text-shadow">{video.title}</h3>
                                <p className="text-sm opacity-90 line-clamp-3">{video.description}</p>
                            </div>
                        </div>

                        {/* Sidebar Actions */}
                        <div className="absolute bottom-8 right-2 flex flex-col items-center gap-6 z-30">
                            <div className="flex flex-col items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`rounded-full h-12 w-12 bg-black/40 hover:bg-black/60 ${likedVideos[video.id] ? 'text-red-500' : 'text-white'}`}
                                    onClick={() => toggleLike(video.id)}
                                >
                                    <Heart className={`h-8 w-8 ${likedVideos[video.id] ? 'fill-current' : ''}`} />
                                </Button>
                                <span className="text-xs font-semibold">{likes[video.id] || 0}</span>
                            </div>

                            <Drawer>
                                <DrawerTrigger asChild>
                                    <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => fetchComments(video.id)}>
                                        <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 bg-black/40 hover:bg-black/60 text-white">
                                            <MessageCircle className="h-8 w-8" />
                                        </Button>
                                        <span className="text-xs font-semibold">Comentar</span>
                                    </div>
                                </DrawerTrigger>
                                <DrawerContent className="bg-zinc-900 border-zinc-800 text-white h-[70vh]">
                                    <DrawerHeader>
                                        <DrawerTitle>Comentários</DrawerTitle>
                                    </DrawerHeader>
                                    <div className="p-4 flex-1 overflow-y-auto space-y-4">
                                        {comments[video.id]?.length > 0 ? (
                                            comments[video.id].map(comment => (
                                                <div key={comment.id} className="flex flex-col gap-1 p-2 bg-zinc-800 rounded">
                                                    <span className="font-bold text-sm text-zinc-400">{comment.author_name}</span>
                                                    <p className="text-sm">{comment.content}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-center text-zinc-500 mt-10">Seja o primeiro a comentar!</p>
                                        )}
                                    </div>
                                    <DrawerFooter className="pt-2">
                                        <div className="flex flex-col gap-2">
                                            <Input
                                                placeholder="Seu nome"
                                                className="bg-zinc-800 border-zinc-700 text-white"
                                                value={commentAuthor}
                                                onChange={e => setCommentAuthor(e.target.value)}
                                            />
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Adicione um comentário..."
                                                    className="bg-zinc-800 border-zinc-700 text-white"
                                                    value={newComment}
                                                    onChange={e => setNewComment(e.target.value)}
                                                />
                                                <Button onClick={() => submitComment(video.id)} size="icon" className="shrink-0 bg-blue-600 hover:bg-blue-700">
                                                    <Send className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </DrawerFooter>
                                </DrawerContent>
                            </Drawer>
                        </div>
                    </div>
                ))}

                {videos.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center">
                        <p>Nenhum vídeo disponível no momento.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function VideoPlayer({ videoUrl, isActive }: { videoUrl: string, isActive: boolean }) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (isActive) {
            // Play if active
            videoRef.current?.play().catch(e => console.log('Autoplay blocked:', e));
        } else {
            // Pause if not active
            videoRef.current?.pause();
            if (videoRef.current) videoRef.current.currentTime = 0;
        }
    }, [isActive]);

    return (
        <video
            ref={videoRef}
            src={videoUrl}
            className="h-full w-full object-cover md:max-w-[500px]"
            loop
            playsInline
            muted={false}
            onClick={(e) => {
                const v = e.currentTarget;
                v.paused ? v.play() : v.pause();
            }}
        />
    );
}
