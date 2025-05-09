export interface NewsItem {
    id: string;
    title: string;
    link: string;
    source: string;
    publishedDate: string; // ISO 8601 format
    summary?: string;
    imageUrl?: string;
  }