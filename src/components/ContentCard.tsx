"use client";

import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ContentCardProps {
  title: string;
  description: string;
  imageUrl?: string;
  date?: string; // For news and events
  category?: string; // For partners
  link?: string; // Optional link to full content
}

export function ContentCard({ title, description, imageUrl, date, category, link }: ContentCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      {imageUrl && (
        <div className="relative h-48 w-full">
          <Image
            src={imageUrl}
            alt={title}
            layout="fill"
            objectFit="cover"
            className="rounded-t-lg"
          />
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
        {category && <CardDescription className="text-sm text-gray-500">{category}</CardDescription>}
        {date && <CardDescription className="text-sm text-gray-500">{new Date(date).toLocaleDateString()}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-gray-700 dark:text-gray-300">{description}</p>
        {/* {link && (
          <a href={link} className="text-blue-600 hover:underline mt-4 block">Read More</a>
        )} */}
      </CardContent>
    </Card>
  );
}
