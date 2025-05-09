// @/services/news-aggregation.ts or a shared types file


import type { NewsItem } from '@/types';
export async function getNews(source: string): Promise<NewsItem[]> {
  try {
    // Construct the URL to your own API endpoint
    const apiUrl = `/api/news?source=${encodeURIComponent(source)}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      // Try to parse error message from your API if available
      const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
      console.error(`Failed to fetch news from custom API for ${source}:`, errorData.message || response.statusText);
      throw new Error(`Could not load news from ${source} via API: ${errorData.message || response.statusText}`);
    }

    const data: NewsItem[] = await response.json();
    return data;
  } catch (error) {
    console.error(`Error in getNews for ${source}:`, error);
    // Re-throw the error so it can be caught by Promise.allSettled in page.tsx
    throw error;
  }
}// @/services/news-aggregation.ts
// import type { NewsItem } from './news-aggregation'; // or wherever you define it

