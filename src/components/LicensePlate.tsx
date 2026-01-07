import React from 'react';
import { QrCode } from 'lucide-react';

interface LicensePlateProps {
    plate: string | null;
    size?: 'sm' | 'md' | 'lg';
}

export const LicensePlate: React.FC<LicensePlateProps> = ({ plate, size = 'md' }) => {
    if (!plate) return <span className="text-slate-400 font-mono">---</span>;

    // Fixed dimensions for the design base
    const BASE_WIDTH = 200;
    const BASE_HEIGHT = 64;

    const config = {
        sm: { scale: 0.5, width: BASE_WIDTH * 0.5, height: BASE_HEIGHT * 0.5 },
        md: { scale: 1, width: BASE_WIDTH, height: BASE_HEIGHT },
        lg: { scale: 1.5, width: BASE_WIDTH * 1.5, height: BASE_HEIGHT * 1.5 },
    }[size];

    return (
        <div style={{ width: config.width, height: config.height }} className="relative select-none">
            <div
                className="absolute top-0 left-0 bg-white border-4 border-black rounded-lg overflow-hidden shadow-sm flex flex-col"
                style={{
                    width: BASE_WIDTH,
                    height: BASE_HEIGHT,
                    transform: `scale(${config.scale})`,
                    transformOrigin: 'top left'
                }}
            >
                {/* Top Bar (Blue) */}
                <div className="bg-[#003399] h-[18px] w-full flex items-center justify-between px-2 relative border-b border-white/20">
                    {/* Mercosul Text (Left) */}
                    <div className="text-white text-[5px] font-bold tracking-widest opacity-80 uppercase leading-none">
                        MERCOSUL
                    </div>

                    {/* BRASIL (Center) */}
                    <div className="text-white font-bold text-[10px] tracking-[2px] absolute left-1/2 transform -translate-x-1/2">
                        BRASIL
                    </div>

                    {/* Flag (Right) */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        className="w-5 h-3.5 rounded-[1px] object-cover border border-white/30"
                        alt="Bandeira Brasil"
                        src="https://upload.wikimedia.org/wikipedia/commons/0/05/Flag_of_Brazil.svg"
                    />
                </div>

                {/* Body */}
                <div className="flex-1 relative flex items-center justify-center bg-white h-full">
                    {/* Code */}
                    <div className="flex justify-center items-center w-full">
                        <span className="font-mono font-bold text-slate-900 text-[28px] sm:text-[32px] tracking-widest leading-none pt-1 whitespace-nowrap" style={{ fontFamily: 'sans-serif', textShadow: '1px 1px 0px rgba(0,0,0,0.1)' }}>
                            {plate.toUpperCase()}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
