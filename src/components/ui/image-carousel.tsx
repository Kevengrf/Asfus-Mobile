"use client";

import { useState, useEffect } from 'react';
import { DirectorCard } from './director-card';

interface ImageCarouselProps {
  images: {
    imageUrl: string;
    name: string;
  }[];
}

export function ImageCarousel({ images }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000); // Change image every 3 seconds

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="relative w-full max-w-4xl mx-auto overflow-hidden rounded-lg shadow-lg">
      <div className="flex justify-center items-center w-full aspect-video bg-gray-100 dark:bg-gray-800">
        <DirectorCard
          imageUrl={images[currentIndex].imageUrl}
          name={images[currentIndex].name}
        />
      </div>
    </div>
  );
}
