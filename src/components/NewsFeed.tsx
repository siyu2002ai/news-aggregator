"use client";

import type { FC } from 'react';
import type { NewsItem } from '@/services/news-aggregation';
import NewsCard from './NewsCard';
import { Skeleton } from "@/components/ui/skeleton";

interface NewsFeedProps {
  newsItems: NewsItem[];
  isLoading: boolean;
}

const NewsFeed: FC<NewsFeedProps> = ({ newsItems, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <CardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (!newsItems || newsItems.length === 0) {
    return <p className="text-center text-muted-foreground py-10">No news items found for the selected sources.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {newsItems.map((item) => (
        <NewsCard key={item.id} item={item} />
      ))}
    </div>
  );
};

const CardSkeleton: FC = () => (
  <div className="border bg-card text-card-foreground shadow-sm rounded-lg p-4 space-y-3">
    <div className="flex justify-between items-center">
      <Skeleton className="h-5 w-1/4" />
      <Skeleton className="h-4 w-1/3" />
    </div>
    <Skeleton className="h-6 w-3/4" />
    <Skeleton className="h-32 w-full rounded-md" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-5/6" />
    <div className="flex justify-between pt-2">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-8 w-1/4" />
    </div>
  </div>
);


export default NewsFeed;
