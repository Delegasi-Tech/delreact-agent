import { NodeHtmlMarkdown } from 'node-html-markdown';

export interface FetchPageToMarkdownInput {
  url: string;
}

const cleanHtml = (html: string): string => {
  // Remove script and style tags and their content
  let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');
  
  // Remove other noise elements
  cleaned = cleaned.replace(/<(?:header|footer|nav|aside|form|input|button|select|textarea)\b[^>]*>[\s\S]*?<\/(?:header|footer|nav|aside|form|input|button|select|textarea)>/gi, '');
  
  return cleaned;
};

const extractMainContent = (html: string): string => {
  // Try to find main content areas
  const contentSelectors = [
    /<main\b[^>]*>([\s\S]*?)<\/main>/i,
    /<article\b[^>]*>([\s\S]*?)<\/article>/i,
    /<div[^>]*(?:class="[^"]*(?:content|main|article|post)[^"]*")[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*(?:id="[^"]*(?:content|main|article|post)[^"]*")[^>]*>([\s\S]*?)<\/div>/i,
  ];

  for (const selector of contentSelectors) {
    const match = html.match(selector);
    if (match && match[1] && match[1].trim().length > 100) {
      return match[1];
    }
  }

  // Fallback: try to get body content
  const bodyMatch = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch && bodyMatch[1]) {
    return bodyMatch[1];
  }

  return html;
};

export const fetchPageToMarkdownTool = async ({ url }: FetchPageToMarkdownInput): Promise<string> => {
  try {
    // Validate URL
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Only HTTP and HTTPS URLs are supported');
    }

    console.log(`📄 Fetching page: ${url}`);

    // Fetch the HTML content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }

    const html = await response.text();
    
    if (!html || html.trim().length === 0) {
      throw new Error('No content received from the URL');
    }

    console.log(`✅ Successfully fetched HTML (${html.length} characters)`);

    // Extract main content and clean HTML
    const mainContent = extractMainContent(html);
    const cleanedHtml = cleanHtml(mainContent);

    // Create NodeHtmlMarkdown instance with optimized options
    const nhm = new NodeHtmlMarkdown({
      // Use bullet marker for lists
      bulletMarker: '-',
      // Use fenced code blocks
      codeBlockStyle: 'fenced',
      // Use ** for strong text
      strongDelimiter: '**',
      // Use _ for emphasis
      emDelimiter: '_',
      // Use ~~ for strikethrough  
      strikeDelimiter: '~~',
      // Ignore elements that are typically noise
      ignore: ['script', 'style', 'noscript', 'iframe', 'object', 'embed'],
      // Treat these as block elements
      blockElements: ['div', 'section', 'article', 'header', 'footer', 'nav'],
      // Maximum consecutive newlines
      maxConsecutiveNewlines: 2,
      // Keep data images if they're small
      keepDataImages: false,
      // Use inline links for better readability
      useInlineLinks: true,
      // Text replacements for better formatting
      textReplace: [
        // Clean up excessive whitespace
        [/\s+/g, ' '],
        // Clean up markdown artifacts
        [/\*\*\s*\*\*/g, ''],
        [/__\s*__/g, ''],
      ]
    });

    // Convert to markdown
    const markdown = nhm.translate(cleanedHtml);

    // Add page metadata at the beginning
    const pageTitle = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || 'Untitled';
    const metaDescription = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1]?.trim();
    
    let finalMarkdown = `# ${pageTitle}\n\n**Source:** ${url}\n\n`;
    
    if (metaDescription) {
      finalMarkdown += `**Description:** ${metaDescription}\n\n`;
    }
    
    // Additional cleaning of the final markdown
    const cleanedMarkdown = markdown
      .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
      .replace(/^\s+$/gm, '') // Remove lines with only whitespace
      .replace(/\*\*\s*\*\*/g, '') // Remove empty bold tags
      .replace(/__\s*__/g, '') // Remove empty italic tags
      .trim();
    
    finalMarkdown += cleanedMarkdown;

    return finalMarkdown;

  } catch (error: any) {
    console.error(`❌ Error fetching page to markdown:`, error);
    
    if (error.name === 'TimeoutError') {
      return `Error: Request timeout while fetching ${url}. The page took too long to respond.`;
    }
    
    if (error.message.includes('HTTP error')) {
      return `Error: Failed to fetch ${url}. ${error.message}`;
    }
    
    if (error.message.includes('Only HTTP and HTTPS')) {
      return `Error: Invalid URL protocol. Only HTTP and HTTPS URLs are supported. Provided: ${url}`;
    }
    
    return `Error fetching page: ${error.message}. URL: ${url}`;
  }
};

import { tool } from "@langchain/core/tools";
import z from "zod";

export const fetchPageToMarkdownToolDef = tool(
  async ({ url }: { url: string }): Promise<string> => {
    return await fetchPageToMarkdownTool({ url });
  },
  {
    name: "fetch-page-to-markdown",
    description: "Fetch a web page and convert its content to markdown format. This tool can extract the main content from web pages and convert it to readable markdown, making it easier for AI to understand and process the information. It handles various HTML elements including headings, paragraphs, lists, links, images, tables, code blocks, and more.",
    schema: z.object({
      url: z.string().describe("The URL of the web page to fetch and convert to markdown. Must be a valid HTTP or HTTPS URL."),
    }),
  }
); 