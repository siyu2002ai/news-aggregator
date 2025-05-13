// src/app/api/news/route.ts  <-- 确保路径是这个，如果你的 app 目录在 src 下

// export const runtime = 'edge'; //cloudflare 
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

// 确保 NewsItem 的导入路径正确
// 选项1: 如果 NewsItem 定义在 @/types/index.ts (或类似文件)
import type { NewsItem } from '@/types';
// 选项2: 如果 NewsItem 定义在并导出自 @/lib/services/news-aggregation.ts
// import type { NewsItem } from '@/lib/services/news-aggregation';


import { URL } from 'url'; // Node.js 内置模块，用于处理 URL

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

      // --- 获取标题和链接 ---
      // 通常标题在 h3.c-card__title 内的 a 标签
      const titleLinkElement = articleElement.find('h3.c-card__title a');
      let title = titleLinkElement.text().trim();
      let link = titleLinkElement.attr('href');

      // 如果通过 h3 > a 找不到，可以尝试文章主链接，例如图片链接也可能是文章链接
      if (!link) {
          const mainArticleLink = articleElement.find('a.c-card__image-link'); // 根据HTML结构，图片外层有a标签
          if (mainArticleLink.length) {
              link = mainArticleLink.attr('href');
              // 如果此时标题仍为空，可以尝试从其他地方获取，但RHG的h3.c-card__title a应是主要的
          }
      }
      // 最终检查，如果整个article本身是个链接
      if (!link && articleElement.is('a')) {
          link = articleElement.attr('href');
      }


      // --- 获取摘要 ---
      const summaryText = articleElement.find('p.c-card__description').text().trim();

      // --- 获取日期 ---
      const timeElement = articleElement.find('time.c-card__date');
      let dateText = timeElement.attr('datetime'); // 优先获取 datetime 属性
      if (!dateText) {
          dateText = timeElement.text().trim(); // 其次获取文本内容
      }

      // --- 获取图片 ---
      // 根据截图，最精确的 img 标签选择器
      const imageTag = articleElement.find('img.c-card__image.o-media__image');

      let rawSrc = imageTag.attr('src');
      let rawSrcset = imageTag.attr('srcset');
      let parsedImageUrl: string | undefined = undefined;

      // 优先使用 src 属性，它通常是一个有效的、可直接使用的图片链接
      if (rawSrc) {
        parsedImageUrl = rawSrc;
      }
      // 如果 src 不存在或为空，再尝试从 srcset 获取第一个链接
      // （对于 RHG，src 应该总是存在的）
      else if (rawSrcset) {
        const firstSrcsetEntry = rawSrcset.split(',')[0].trim();
        if (firstSrcsetEntry) {
          parsedImageUrl = firstSrcsetEntry.split(' ')[0]; // srcset 条目是 "url descriptor"
        }
      }

      // --- 日志记录 ---
      console.log(`RHG API Item ${index} PRE-PUSH ---`);
      console.log(`  Raw Title: "${title}"`);
      console.log(`  Raw Link: "${link}"`);
      console.log(`  Raw Summary Text: "${summaryText}"`);
      console.log(`  Raw Date Text: "${dateText}"`);
      console.log(`  Image Tag found: ${imageTag.length > 0}`);
      console.log(`  Raw img src Attr: "${rawSrc}"`);
      console.log(`  Raw img srcset Attr: "${rawSrcset}"`);
      console.log(`  Parsed Image URL (from src/srcset): "${parsedImageUrl}"`);
      // --- 日志记录结束 ---

      if (title && link) {
        // --- 处理链接 (确保是绝对路径) ---
        if (link && !link.startsWith('http')) {
          const baseDomain = new URL(url).origin; // url is 'https://rhg.com/china/research/'
          try {
            link = new URL(link, baseDomain).href;
          } catch (e) {
            console.warn(`RHG API: Failed to construct absolute URL for link: ${link}`, e);
            link = '#'; // Fallback link
          }
        }

        // --- 处理日期 ---
        let publishedDate = new Date().toISOString(); // Fallback to current date
        if (dateText) {
          try {
            const parsedDate = new Date(dateText);
            if (!isNaN(parsedDate.getTime())) {
              publishedDate = parsedDate.toISOString();
            } else {
              console.warn(`RHG API: Could not parse date: "${dateText}" for item: "${title}". Using fallback.`);
            }
          } catch (e) {
            console.warn(`RHG API: Error parsing date: "${dateText}" for item: "${title}". Using fallback.`, e);
          }
        } else {
            console.warn(`RHG API: Date text not found for item: "${title}". Using fallback.`);
        }

        // --- 处理图片URL (确保是绝对路径) ---
        let finalImageUrl: string | undefined = undefined;
        if (parsedImageUrl) {
          if (!parsedImageUrl.startsWith('http') && !parsedImageUrl.startsWith('//')) {
            // 如果是相对路径如 /path/to/image.jpg
            const baseDomain = new URL(url).origin;
            try {
              finalImageUrl = new URL(parsedImageUrl, baseDomain).href;
            } catch (e) {
              console.warn(`RHG API: Failed to construct absolute URL for image: ${parsedImageUrl}`, e);
            }
          } else if (parsedImageUrl.startsWith('//')) {
            // 如果是协议相对URL如 //assets.example.com/image.jpg
            finalImageUrl = `https:${parsedImageUrl}`;
          } else {
            // 已经是绝对URL
            finalImageUrl = parsedImageUrl;
          }
        }

        const newsItem: NewsItem = {
          id: link, // 使用链接作为ID
          title,
          link,
          source: 'RHG',
          publishedDate,
          summary: summaryText || undefined,
          imageUrl: finalImageUrl || undefined,
        };
        console.log(`  Final NewsItem imageUrl: "${newsItem.imageUrl}"`);
        items.push(newsItem);
      } else {
        console.warn(`RHG API: Skipping item at index ${index} due to missing title or link.`);
        console.log(`  RHG API Item ${index} SKIPPED --- Title: "${title}", Link: "${link}"`);
      }
    });

    console.log(`RHG API: Successfully parsed ${items.length} news items.`);
    return items;

  } catch (error: any) {
    console.error('RHG API fetchRhgNews FUNCTION ERROR:', error.message);
    console.error('RHG API fetchRhgNews FUNCTION STACK:', error.stack);
    if (axios.isAxiosError(error) && error.response) {
        console.error('RHG API Axios Error Response Status:', error.response.status);
        console.error('RHG API Axios Error Response Data:', error.response.data);
    } else if (axios.isAxiosError(error)) {
        console.error('RHG API Axios Error Request:', error.request);
    }
    // 为了让上层能捕获并返回500，这里应该抛出错误
    throw new Error(`Problem in fetchRhgNews for RHG: ${error.message}`);
  }
}



//mckinsey
// src/app/api/news/route.ts
// ... (其他 imports 和 fetchRhgNews 函数) ...

// src/app/api/news/route.ts
// ... (确保顶部有这些 import)
// import { NextRequest, NextResponse } from 'next/server';
// import axios from 'axios';
// import * as cheerio from 'cheerio';
// import type { NewsItem } from '@/types';
// import { URL } from 'url';

async function fetchMckinseyNews(): Promise<NewsItem[]> {
  const url = 'https://www.mckinsey.com/featured-insights';
  const baseDomain = new URL(url).origin;
  console.log(`McKinsey API: Attempting to fetch from ${url}`);

  try {
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      }
    });
    console.log(`McKinsey API: Successfully fetched HTML (length: ${html.length})`);

    const $ = cheerio.load(html);
    const items: NewsItem[] = [];

    // 尝试更通用的选择器，涵盖不同类型的 "卡片" 或 "条目"
    const selectorsToTry = [
        'div[class*="GenericItem_mck-c-generic-item--"]', // 主要依赖这个，因为它似乎包裹了内容
        'article[class*="item"]', // 如果有<article>标签
        'div[data-module-name="one-up-medium"] div.mck-o-container > div[class*="UpModule_mck-c-up"]', // 对应之前截图的另一种结构
        'div[data-component*="teaser"]', // 通用 teaser data-component
    ];

    let insightCards: cheerio.Cheerio<any> | null = null;

    for (const selector of selectorsToTry) {
        const foundElements = $(selector);
        if (foundElements.length > 0) {
            insightCards = foundElements;
            console.log(`McKinsey API: Using selector "${selector}", found ${insightCards.length} potential items.`);
            break;
        }
    }

    if (!insightCards || insightCards.length === 0) {
        console.warn('McKinsey API: No insight items found with any of the tried selectors.');
        return [];
    }
    
    const filteredCards = insightCards.filter((i, el) => {
        const $el = $(el);
        const hasTitleLinkH2 = $el.find('h2[data-component="mdc-c-heading"] a[data-component="mdc-c-link"]').length > 0;
        const hasTitleLinkH5 = $el.find('h5[data-component="mdc-c-heading"] a[data-component="mdc-c-link"]').length > 0;
        const hasImageLink = $el.find('div[class*="GenericItem_mck-c-generic-item_image"] a[data-component="mdc-c-link"]').length > 0;
        const hasImageTag = $el.find('picture[data-component="mdc-c-picture"] img').length > 0;
        
        return hasImageTag && (hasTitleLinkH2 || hasTitleLinkH5 || hasImageLink);
    });

    console.log(`McKinsey API: After filtering, ${filteredCards.length} items remain.`);

    filteredCards.each((index, element) => {
      const card = $(element);
      let title = '';
      let link = '';

      // --- 尝试提取标题和链接 (多种策略) ---
      // 策略 A: 尝试从 H2 > A
      const titleLinkH2 = card.find('h2[data-component="mdc-c-heading"] a[data-component="mdc-c-link"]');
      if (titleLinkH2.length > 0) {
        title = titleLinkH2.find('span').first().text().trim() || titleLinkH2.text().trim();
        link = titleLinkH2.attr('href') || '';
        // if (title && link) console.log(`  DEBUG (Item ${index}): Strategy A (H2) - Title: "${title}", Link: "${link}"`);
      }

      // 策略 B: 尝试从 H5 > A
      if (!link) { // 只有当策略 A 未成功获取链接时才主要依赖策略 B 获取链接
        const titleLinkH5 = card.find('h5[data-component="mdc-c-heading"] a[data-component="mdc-c-link"]');
        if (titleLinkH5.length > 0) {
          const h5Text = titleLinkH5.find('span').first().text().trim() || titleLinkH5.text().trim();
          const h5Link = titleLinkH5.attr('href') || '';
          if (h5Link) link = h5Link;
          if (h5Text && !title) title = h5Text; // 如果之前没有标题，用H5的
          // if (title && link) console.log(`  DEBUG (Item ${index}): Strategy B (H5) - Title: "${title}", Link: "${link}"`);
        }
      }

      // 策略 C: 从图片区域的链接获取链接 (如果之前没有链接)
      // 并且，如果标题仍为空，尝试使用图片的 alt 文本作为标题。
      const imageAreaLinkElement = card.find('div[class*="GenericItem_mck-c-generic-item_image"] a[data-component="mdc-c-link"]');
      if (imageAreaLinkElement.length > 0) {
        const imageLinkHref = imageAreaLinkElement.attr('href');
        if (imageLinkHref && !link) {
          link = imageLinkHref;
          // console.log(`  DEBUG (Item ${index}): Strategy C set Link from ImageArea: "${link}"`);
        }
        if (!title) {
          const imageAlt = imageAreaLinkElement.find('img').attr('alt')?.trim();
          if (imageAlt) {
            title = imageAlt;
            // console.log(`  DEBUG (Item ${index}): Strategy C set Title from Image Alt: "${title}"`);
          }
        }
      }
      
      // 策略 D: 如果有链接但标题为空，尝试独立的 H5 (不含链接的H5)
      if (!title && link) {
          const standaloneH5 = card.find('h5[data-component="mdc-c-heading"]:not(:has(a))');
          if (standaloneH5.length > 0) {
              title = standaloneH5.text().trim();
              // if (title) console.log(`  DEBUG (Item ${index}): Strategy D set Title from standalone H5: "${title}"`);
          }
      }

      // 最后的保险：如果还没有标题，但有链接，尝试直接从卡片内的任何图片alt获取
      if (!title && link) {
          const anyImgAlt = card.find('picture[data-component="mdc-c-picture"] img').attr('alt')?.trim();
          if (anyImgAlt) {
              title = anyImgAlt;
              // console.log(`  DEBUG (Item ${index}): Final Fallback - Title from any Image Alt: "${title}"`);
          }
      }

      // --- 摘要 ---
      let summary = card.find('div[data-component="mdc-c-description"] span[class*="GenericItem_mck-c-generic-item_description"]').text().trim();
      if (!summary) {
        summary = card.find('div[data-component="mdc-c-description"]').text().trim();
      }
      const eyebrowText = card.find('div[class*="mdc-c-eyebrow"]').text().trim();
      if (summary.startsWith(eyebrowText) && eyebrowText.length > 0) {
          summary = summary.substring(eyebrowText.length).trim();
      }
      if (summary.endsWith('Twitter Facebook LinkedIn Email') || summary.endsWith('Facebook LinkedIn Email Twitter')) {
          summary = summary.replace(/Twitter Facebook LinkedIn Email$/, '').replace(/Facebook LinkedIn Email Twitter$/, '').trim();
      }


      // --- 日期 ---
      const timeElement = card.find('time');
      let dateText = timeElement.attr('datetime');
      if (!dateText && timeElement.length > 0) {
        dateText = timeElement.text().trim();
      }

      // --- 图片 URL ---
      const imgElement = card.find('picture[data-component="mdc-c-picture"] img');
      let imageUrl = imgElement.attr('src');
      if (!imageUrl && imgElement.length > 0) {
          const srcset = imgElement.attr('srcset');
          if (srcset) {
              imageUrl = srcset.split(',')[0].trim().split(' ')[0];
          }
      }

      // PRE-PUSH 日志，根据需要调整条件
      if (!title || !link || !imageUrl) { // 只在关键信息缺失时打印，或在调试时全部打印
        console.log(`McKinsey API Item ${index} PRE-PUSH (DEBUG) ---`);
        console.log(`  Raw Title: "${title}"`);
        console.log(`  Raw Link: "${link}"`);
        console.log(`  Raw Summary: "${summary}"`);
        console.log(`  Raw Date: "${dateText}"`);
        console.log(`  Raw Image Src: "${imageUrl}" (Img tag found: ${imgElement.length > 0})`);
      }


      if (title && link) {
        if (link && !link.startsWith('http')) {
          try { link = new URL(link, baseDomain).href; } catch (e) { console.error(`McKinsey: Invalid link URL ${link}`); link = '#';}
        }
        if (imageUrl && !imageUrl.startsWith('http')) {
          try { imageUrl = new URL(imageUrl, baseDomain).href; } catch (e) { console.error(`McKinsey: Invalid image URL ${imageUrl}`); imageUrl = undefined;}
        } else if (imageUrl && imageUrl.startsWith('//')) {
          imageUrl = `https:${imageUrl}`;
        }

        let publishedDate = new Date().toISOString();
        if (dateText) {
          try {
            const parsed = new Date(dateText);
            if (!isNaN(parsed.getTime())) {
              publishedDate = parsed.toISOString();
            } else { /* console.warn */ }
          } catch (e) { /* console.warn */ }
        }

        const newsItem: NewsItem = {
          id: link,
          title,
          link,
          source: 'McKinsey',
          publishedDate,
          summary: summary || undefined,
          imageUrl: imageUrl || undefined,
        };
        // console.log(`  Final NewsItem imageUrl for item ${index}: "${newsItem.imageUrl}"`);
        items.push(newsItem);
      } else {
        console.warn(`McKinsey API: Skipping item at index ${index} due to missing title or link (Title: "${title}", Link: "${link}")`);
      }
    });

    console.log(`McKinsey API: Successfully parsed ${items.length} news items.`);
    return items;

  } catch (error: any) {
    console.error('McKinsey API fetchMcKinseyNews FUNCTION ERROR:', error.message, error.stack);
    throw new Error(`Problem in fetchMcKinseyNews for McKinsey: ${error.message}`);
  }
}

// 确保在你的 route.ts 文件中，GET handler 正确调用了 fetchMckinseyNews
// export async function GET(request: NextRequest) { ... }



//gs
// src/app/api/news/route.ts
// ... (imports) ...

async function fetchUbsNews(): Promise<NewsItem[]> {
  const url = 'https://www.ubs.com/global/en/wealthmanagement/insights/house-view.html';
  const baseDomain = new URL(url).origin;
  console.log(`UBS API: Attempting to fetch from ${url} via HTML scraping`); // 标明方式

  try {
    // **重要提醒**: 这里的 axios.get 获取的是初始HTML。如果内容是JS动态加载，此方法无效。
    const { data: html } = await axios.get(url, { /* headers */ });
    console.log(`UBS API: Successfully fetched HTML (length: ${html.length})`);

    const $ = cheerio.load(html);
    const items: NewsItem[] = [];

    // 更新主选择器，基于截图
    const articleItems = $('li.sdactivitystream__listItem article.sdactivitystreamtile_tile');

    console.log(`UBS API: Found ${articleItems.length} potential items using selector 'li article'.`);

    if (articleItems.length === 0) {
        console.warn("UBS API: No items found with 'li article' selector. Content might be loaded dynamically via API.");
        // 在这里可以考虑尝试调用 API 作为后备方案，但这会增加复杂性
    }

    articleItems.each((index, element) => {
      const article = $(element);

      let title = '';
      let link = '';

      // --- 获取标题和链接 (优先内容区的 H3 > A) ---
      const titleLinkElement = article.find('div.sdactivitystreamtile_info h3.sdactivitystreamtile_hl a');
      if (titleLinkElement.length > 0) {
          title = titleLinkElement.text().trim();
          link = titleLinkElement.attr('href') || '';
      } else {
          // 备选：如果内容区没链接，尝试图片区的链接，标题用图片alt
          const imageLinkElement = article.find('div.sdactivitystreamtile_img a');
          if (imageLinkElement.length > 0) {
              link = imageLinkElement.attr('href') || '';
              title = imageLinkElement.find('img').attr('alt')?.trim() || ''; // 可能为空alt
          }
      }

      // --- 获取摘要 ---
      const summary = article.find('div.sdactivitystreamtile_info p.sdactivitystreamtile_txt').text().trim();

      // --- 获取日期 (需要确认选择器) ---
      // 尝试之前的选择器，或者需要F12检查 ul.sdactivitystreamtile_meta
      const dateElement = article.find('.sdactivitystreamtile__date time, time.sdactivitystreamtile__date, span.sdactivitystreamtile__date'); // 尝试多种可能
      let dateText = dateElement.first().attr('datetime') || dateElement.first().text().trim();
      // 如果还找不到，检查 meta 区域
      if (!dateText) {
          // const metaText = article.find('ul.sdactivitystreamtile_meta').text().trim();
          // 这里需要更具体的逻辑来从 metaText 中提取日期
      }

      // --- 获取图片 URL (优先 src) ---
      const imgElement = article.find('div.sdactivitystreamtile_img img');
      let imageUrl = imgElement.attr('src'); // 优先使用 src
      if (!imageUrl && imgElement.length > 0) { // 如果 src 为空或不存在
          const srcset = imgElement.attr('srcset');
          if (srcset) { // 尝试 srcset 的第一个
              imageUrl = srcset.split(',')[0].trim().split(' ')[0];
          }
      }

      // --- 日志记录 ---
      console.log(`UBS API Item ${index} PRE-PUSH ---`);
      console.log(`  Raw Title: "${title}"`);
      console.log(`  Raw Link: "${link}"`);
      console.log(`  Raw Summary: "${summary}"`);
      console.log(`  Raw Date: "${dateText}"`);
      console.log(`  Raw Image Src: "${imageUrl}" (Img tag found: ${imgElement.length > 0})`);


      if (title && link) {
          // URL 绝对化 (UBS的链接和图片似乎已经是绝对路径了，但以防万一)
          if (link && link.startsWith('/')) {
            try { link = new URL(link, baseDomain).href; } catch (e) { /* handle error */ link = '#'; }
          }
          if (imageUrl && imageUrl.startsWith('/')) {
            try { imageUrl = new URL(imageUrl, baseDomain).href; } catch (e) { /* handle error */ imageUrl = undefined; }
          } else if (imageUrl && imageUrl.startsWith('//')) {
            imageUrl = `https:${imageUrl}`;
          }

          // 日期解析 (保持之前的逻辑)
          let publishedDate = new Date().toISOString();
          if (dateText) {
            try {
              const parsed = new Date(dateText);
              if (!isNaN(parsed.getTime())) {
                publishedDate = parsed.toISOString();
              } else { console.warn(`UBS API: Could not parse date: "${dateText}"`); }
            } catch (e) { console.warn(`UBS API: Error parsing date: "${dateText}"`, e); }
          }

          const newsItem: NewsItem = {
            id: link,
            title,
            link,
            source: 'UBS',
            publishedDate,
            summary: summary || undefined,
            imageUrl: imageUrl || undefined,
          };
          console.log(`  Final NewsItem imageUrl: "${newsItem.imageUrl}"`);
          items.push(newsItem);
      } else {
        console.warn(`UBS API: Skipping item at index ${index} due to missing title or link (Title: "${title}", Link: "${link}")`);
      }
    });

    console.log(`UBS API: Successfully parsed ${items.length} news items via HTML scraping.`);
    return items;

  } catch (error: any) {
    // ... (错误处理) ...
    console.error('UBS API fetchUbsNews FUNCTION ERROR (HTML Scraping):', error.message, error.stack);
    throw new Error(`Problem in fetchUbsNews for UBS (HTML Scraping): ${error.message}`);
  }
}

// ... (GET handler 保持不变，确保 case 'UBS': 调用 fetchUbsNews()) ...





// ... (GET handler 和其他函数) ...


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
        // console.log("API Route: Routing to fetchRhgNews (Local Dev)");
        newsItems = await fetchRhgNews();// 暂停使用
        break;
      // For other sources, you can call a mock function or implement their scrapers
      case 'REDDIT':
      case 'YOUTUBE':
      case 'NYT':
      case 'WSJ':
      // case 'S&P GLOBAL': // Assuming 'S&P Global' is the exact string from ALL_SOURCES
      //   newsItems = await fetchOtherSourceNews(source);
      //   break;
      case 'MCKINSEY': // <--- 确保这个 case 存在并且拼写完全正确
        console.log("API Route: Routing to fetchMckinseyNews (Local Dev)");
        newsItems = await fetchMckinseyNews();
        break;

      // case 'UBS':
      //   console.log("API Route: Routing to fetchUbsNews (Local Dev)");
      //   newsItems = await fetchUbsNews();//动态，不行
      //   break;

      // case 'GS':
      //   console.log("API Route: Routing to fetchGoldmanSachsNews (Local Dev)");
      //   newsItems = await fetchGoldmanSachsNews();
      //   break;
      // 其他来源的处理
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