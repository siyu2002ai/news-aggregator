// src/components/NewsCard.tsx (or similar)
import type { NewsItem } from '@/types';
import Image from 'next/image'; // Using next/image for optimization

interface NewsCardProps {
  item: NewsItem;
}

export default function NewsCard({ item }: NewsCardProps) {
  return (
    <article className="bg-card p-4 rounded-lg shadow hover:shadow-md transition-shadow border border-border">
      {/* Image Section */}
      {item.imageUrl && ( // Only render image if imageUrl exists
        <div className="mb-3 aspect-video overflow-hidden rounded relative">
          {/*
            NOTE: For next/image with external URLs, you need to configure
            remotePatterns in next.config.js for the image hostnames.
            We added picsum.photos before. If you use other hosts, add them.
          */}
          <Image
            src={item.imageUrl}
            alt={`Image for ${item.title}`}
            fill // or width and height if you know them and don't want fill
            style={{ objectFit: 'cover' }} // 'cover', 'contain', etc.
            // You might want to provide width/height for non-fill images
            // width={300}
            // height={200}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Example sizes
            priority={false} // Set to true for LCP images if applicable
          />
        </div>
      )}

      <h3 className="text-lg font-semibold mb-1 text-card-foreground">
        <a href={item.link} target="_blank" rel="noopener noreferrer" className="hover:underline">
          {item.title}
        </a>
      </h3>
      <p className="text-sm text-muted-foreground mb-2">
        {new Date(item.publishedDate).toLocaleDateString()} - {item.source}
      </p>
      {item.summary && ( // Only render summary if it exists
        <p className="text-sm text-card-foreground/80 line-clamp-3">
          {item.summary}
        </p>
      )}
    </article>
  );
}