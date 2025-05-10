// src/app/api/news/route.ts  <-- 确保路径是这个，如果你的 app 目录在 src 下


import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
// 确保 NewsItem 的导入路径正确
// 选项1: 如果 NewsItem 定义在 @/types/index.ts (或类似文件)
import type { NewsItem } from '@/types';
// 选项2: 如果 NewsItem 定义在并导出自 @/lib/services/news-aggregation.ts
// import type { NewsItem } from '@/lib/services/news-aggregation';


// --- RHG Specific Scraper ---
async function fetchRhgNews(): Promise<NewsItem[]> {
  const url = 'https://rhg.com/china/research/';
  console.log(`RHG API: Attempting to fetch from ${url}`);

  try {
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    console.log(`RHG API: Successfully fetched HTML (length: ${html.length})`);

    const $ = cheerio.load(html);
    const items: NewsItem[] = [];

    const researchItems = $('article.c-card.c-card--publication');
    console.log(`RHG API: Found ${researchItems.length} potential research items using selector 'article.c-card.c-card--publication'`);

    researchItems.each((index, element) => {
      const articleElement = $(element);

      const titleLinkElement = articleElement.find('h3.c-card__title a.c-card__link');
      let title = titleLinkElement.text().trim();
      let link = titleLinkElement.attr('href');

      const summaryText = articleElement.find('p.c-card__description').text().trim();

      const timeElement = articleElement.find('time.c-card__date');
      let dateText = timeElement.attr('datetime');
      if (!dateText) {
          dateText = timeElement.text().trim();
      }

      const imageTag = articleElement.find('div.c-card_image-wrapper picture.o-media__picture img');
      let rawSrcset = imageTag.attr('srcset');
      let parsedImageUrl: string | undefined = undefined;

      if (rawSrcset) {
        parsedImageUrl = rawSrcset.split(',')[0].trim().split(' ')[0];
      }
      if (!parsedImageUrl) {
        parsedImageUrl = imageTag.attr('src');
      }

      // --- Detailed Logging BEFORE creating NewsItem ---
      console.log(`RHG API Item ${index} PRE-PUSH ---`);
      console.log(`  Raw Title: "${title}"`);
      console.log(`  Raw Link: "${link}"`);
      console.log(`  Raw Summary Text: "${summaryText}"`);
      console.log(`  Raw Date Text: "${dateText}"`);
      console.log(`  Raw Srcset Attr: "${rawSrcset}"`);
      console.log(`  Parsed Image URL: "${parsedImageUrl}"`);
      // --- End Detailed Logging ---

      if (title && link) {
        if (link && !link.startsWith('http')) {
          const baseDomain = new URL(url).origin;
          link = new URL(link, baseDomain).href;
        }

        let publishedDate = new Date().toISOString();
        if (dateText) {
          try {
            const parsed = new Date(dateText);
            if (!isNaN(parsed.getTime())) {
              publishedDate = parsed.toISOString();
            } else {
              console.warn(`RHG API: Could not parse date: "${dateText}" for item: ${title}. Using fallback.`);
            }
          } catch (e) {
            console.warn(`RHG API: Error parsing date: "${dateText}" for item: ${title}. Using fallback.`, e);
          }
        } else {
            console.warn(`RHG API: Date text not found for item: ${title}. Using fallback.`);
        }

        let finalImageUrl: string | undefined = undefined;
        if (parsedImageUrl) {
          if (!parsedImageUrl.startsWith('http')) {
              const baseDomain = new URL(url).origin;
              finalImageUrl = new URL(parsedImageUrl, baseDomain).href;
          } else {
              finalImageUrl = parsedImageUrl;
          }
        }

        const newsItem: NewsItem = {
          id: link,
          title,
          link,
          source: 'RHG',
          publishedDate,
          summary: summaryText || undefined,
          imageUrl: finalImageUrl || undefined,
        };
        // console.log(`RHG API Item ${index} PUSHING OBJECT:`, JSON.stringify(newsItem, null, 2));
        console.log(`  Final NewsItem imageUrl: "${newsItem.imageUrl}"`);//改了
        // console.log(`RHG API Item ${index} PUSHING OBJECT:`, JSON.stringify(newsItem, null, 2)); // 可选，但上面的更直接
        // ====================================================================
        items.push(newsItem);
      } else {
        console.warn(`RHG API: Skipping item at index ${index} due to missing title or link.`);
      }
    });

    console.log(`RHG API: Successfully parsed ${items.length} news items.`);
    return items;
  } catch (error: any) {
    console.error('RHG API fetchRhgNews FUNCTION ERROR:', error.message);
    console.error('RHG API fetchRhgNews FUNCTION STACK:', error.stack);
    if (axios.isAxiosError(error)) {
        throw new Error(`RHG Axios request failed: ${error.message}`);
    }
    throw new Error(`Problem in fetchRhgNews for RHG: ${error.message}`);
  }
}

// --- Mock/Placeholder for other sources ---
async function fetchOtherSourceNews(sourceName: string): Promise<NewsItem[]> {
  console.log(`API Route: Fetching mock/empty data for ${sourceName}`);
  // Return an empty array to prevent errors for now
  return [];
  // Or you can return some mock data:
  /*
  return [
    {
      id: `${sourceName.toLowerCase()}-mock-1`,
      title: `Mock News from ${sourceName}`,
      link: '#',
      source: sourceName,
      publishedDate: new Date().toISOString(),
      summary: `This is a mock summary from ${sourceName}.`,
      imageUrl: 'https://via.placeholder.com/150'
    }
  ];
  */
}


export async function GET(request: NextRequest) {
  console.log("--- API /api/news CALLED (Local Dev) ---");
  const searchParams = request.nextUrl.searchParams;
  const source = searchParams.get('source');
  console.log(`--- API Source parameter: ${source} (Local Dev) ---`);

  if (!source) {
    return NextResponse.json({ message: 'Source parameter is required' }, { status: 400 });
  }

  try {
    let newsItems: NewsItem[] = [];
    switch (source.toUpperCase()) {
      case 'RHG':
        console.log("API Route: Routing to fetchRhgNews (Local Dev)");
        newsItems = await fetchRhgNews();
        break;
      // For other sources, you can call a mock function or implement their scrapers
      case 'REDDIT':
      case 'YOUTUBE':
      case 'NYT':
      case 'WSJ':
      case 'S&P GLOBAL': // Assuming 'S&P Global' is the exact string from ALL_SOURCES
        newsItems = await fetchOtherSourceNews(source);
        break;
      default:
        console.warn(`API Route: Source '${source}' is not supported. Returning empty array. (Local Dev)`);
        newsItems = []; // Return empty for unsupported rather than erroring immediately
        // return NextResponse.json({ message: `Source '${source}' is not supported.` }, { status: 400 });
    }
    return NextResponse.json(newsItems);
  } catch (error: any) {
    console.error(`API ROUTE HANDLER ERROR for source [${source}] (Local Dev):`, error.message);
    console.error(`API ROUTE HANDLER STACK for source [${source}] (Local Dev):`, error.stack);
    return NextResponse.json({ message: `Failed to fetch news for ${source}: ${error.message || 'Unknown server error'}` }, { status: 500 });
  }
}