import Image from 'next/image';

interface DirectorCardProps {
  imageUrl: string;
  name: string;
}

export function DirectorCard({ imageUrl, name }: DirectorCardProps) {
  return (
    <div className="relative w-full h-full overflow-hidden rounded-lg">
      <Image
        src={imageUrl}
        alt={name}
        layout="fill"
        objectFit="cover"
        className="block"
      />
      <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/70 to-transparent">
        <span className="text-lg font-bold text-white text-shadow-md">{name}</span>
      </div>
    </div>
  );
}
