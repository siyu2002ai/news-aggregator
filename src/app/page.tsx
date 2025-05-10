
"use client";

import { useState, useEffect, useCallback } from 'react';
import AppHeader from '@/components/AppHeader';
import NewsFeed from '@/components/NewsFeed';
import SourceFilter from '@/components/SourceFilter';
// import type { NewsItem } from '@/services/news-aggregation';
import { getNews } from '@/services/news-aggregation';
import { useToast } from "@/hooks/use-toast";
import type { NewsItem } from '@/types'; 
// const ALL_SOURCES = ['Reddit', 'YouTube', 'NYT', 'WSJ', 'RHG', 'S&P Global'];
// const ALL_SOURCES = ['RHG','McKinsey',]; // 待会删

const ALL_SOURCES = ['S&P',]; // 待会删，调试专用

export default function Home() {
  const [allNews, setAllNews] = useState<NewsItem[]>([]);
  const [filteredNews, setFilteredNews] = useState<NewsItem[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>(ALL_SOURCES);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchAllNews = useCallback(async () => {
    setIsLoading(true);
    try {
      const newsPromises = ALL_SOURCES.map(source => getNews(source));
      const results = await Promise.allSettled(newsPromises);
      
      let fetchedItems: NewsItem[] = [];
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          fetchedItems = fetchedItems.concat(result.value);
        } else {
          console.error(`Failed to fetch news from ${ALL_SOURCES[index]}:`, result.reason);
          toast({
            title: "Error Fetching News",
            description: `Could not load news from ${ALL_SOURCES[index]}. Please try again later.`,
            variant: "destructive",
          });
        }
      });
      
      // Sort by publishedDate in descending order (newest first)
      fetchedItems.sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
      setAllNews(fetchedItems);

    } catch (error) {
      console.error("Error fetching news:", error);
      toast({
        title: "Error",
        description: "Failed to fetch news. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAllNews();
  }, [fetchAllNews]);

  useEffect(() => {
    const filtered = allNews.filter(item => selectedSources.includes(item.source));
    setFilteredNews(filtered);
  }, [allNews, selectedSources]);

  const handleSourceToggle = (source: string) => {
    setSelectedSources(prev =>
      prev.includes(source)
        ? prev.filter(s => s !== source)
        : [...prev, source]
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-8 flex-grow">
        <SourceFilter
          sources={ALL_SOURCES}
          selectedSources={selectedSources}
          onSourceToggle={handleSourceToggle}
        />
        <NewsFeed newsItems={filteredNews} isLoading={isLoading} />
      </main>
      <footer className="text-center py-4 text-muted-foreground text-sm border-t">
        <p>&copy; {new Date().getFullYear()} News Digest Hub. All rights reserved.</p>
      </footer>
    </div>
  );
}
