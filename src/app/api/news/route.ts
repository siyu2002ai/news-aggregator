// src/app/api/news/route.ts
import { NextRequest, NextResponse } from 'next/server';
import type { NewsItem } from '@/types';

// --- Mock Data Store ---
const MOCK_NEWS_DATA: { [key: string]: NewsItem[] } = {
  RHG: [
    {
      id: 'rhg-mock-1',
      title: 'RHG Mock: The Future of China Trade (Mock Data)',
      link: 'https://rhg.com/mock/future-china-trade',
      source: 'RHG',
      publishedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      summary: 'This is a mock summary for an RHG article. Content focuses on trade policies.',
      imageUrl: 'https://picsum.photos/seed/rhg_article_1/400/250',
    },
    // ... more RHG mock data ...
  ],
  // ... mock data for other sources ...
  NYT: [],
  WSJ: [],
  'S&P GLOBAL': [],
};

const MOCK_ENABLED = true; // Set to false if you ever upgrade and want to use real scrapers

// ======================================================================================
// MAKE SURE THERE IS ONLY ONE 'export async function GET(...)' IN THIS ENTIRE FILE
// ======================================================================================
export async function GET(request: NextRequest) {
  console.log("--- API /api/news CALLED (Firebase Spark Plan Mode - Mock Data with Images) ---");

  const searchParams = request.nextUrl.searchParams;
  const source = searchParams.get('source');
  console.log(`--- Source parameter: ${source} (Firebase Spark Plan Mode) ---`);

  if (!source) {
    return NextResponse.json({ message: 'Source parameter is required' }, { status: 400 });
  }

  if (MOCK_ENABLED) {
    console.log(`--- MOCK_ENABLED is true, returning mock data for ${source} ---`);
    const sourceKey = source.toUpperCase();
    const mockDataForSource = MOCK_NEWS_DATA[sourceKey] || MOCK_NEWS_DATA[source];

    if (mockDataForSource) {
      console.log(`--- Mock data for ${source}:`, JSON.stringify(mockDataForSource, null, 2));
      return NextResponse.json(mockDataForSource);
    } else {
      console.warn(`--- No mock data defined for source: ${source}. Returning empty array. ---`);
      return NextResponse.json([]);
    }
  }

  // --- Code for REAL scraping (for Blaze plan, currently inactive due to MOCK_ENABLED=true) ---
  console.log(`--- MOCK_ENABLED is false. Attempting real fetch for ${source} (Requires Blaze Plan) ---`);
  try {
    const newsItems: NewsItem[] = [];

    console.warn("Real fetching logic is currently bypassed because MOCK_ENABLED is true.");
    return NextResponse.json(newsItems); // Return empty or placeholder if real fetching bypassed
  } catch (error: unknown) { // <--- 修改为 unknown
    let errorMessage = "An unknown error occurred during real fetch attempt";
    let errorStack: string | undefined = undefined;

    if (error instanceof Error) {
      errorMessage = error.message;
      errorStack = error.stack;
      console.error(`API ROUTE HANDLER ERROR (Real Fetch Attempt) for source [${source}]:`, errorMessage);
      if (errorStack) {
        console.error(`API ROUTE HANDLER STACK (Real Fetch Attempt) for source [${source}]:`, errorStack);
      }
    } else {
      // 如果抛出的不是 Error 对象实例，记录原始错误信息
      console.error(`API ROUTE HANDLER ERROR (Real Fetch Attempt) - Non-Error object thrown for source [${source}]:`, error);
      // 你也可以选择将 error 序列化为字符串作为 errorMessage 的一部分
      // if (typeof error === 'string') errorMessage = error;
      // else if (typeof error === 'object' && error !== null) errorMessage = JSON.stringify(error);
    }
    return NextResponse.json({ message: `Failed to fetch news for ${source} (real fetch attempt): ${errorMessage}` }, { status: 500 });
  }
}