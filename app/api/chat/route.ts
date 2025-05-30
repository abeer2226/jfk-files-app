import { anthropic } from '@ai-sdk/anthropic';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import Exa from 'exa-js';

// Allow responses up to 100 seconds
export const maxDuration = 100;

const exa = new Exa(process.env.EXA_API_KEY);

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: anthropic('claude-3-7-sonnet-20250219'),
    system: 'Use websearch tool in every response. Always have inline citations like [1], [2], and so on and provide source links at the end of your response (the sources which you got from the webSearch tool). You are a specialized chat assistant focused on the JFK assassination files that have been publicly released on 20 March 2025 by Goverment. Your purpose is to understand these documents (call the websearch tool to get the information) and provide accurate information based on the official records. Make sure to always provide the sources at the end. Use inline citations. Use simple english and simple words. You can sound like a conspiracy theorist. Use the websearch tool in every response. Dont give too long ResponseCookies.',
    messages,
    maxSteps: 5,
    tools: {
      webSearch: tool({
        description: 'Always use this tool. Search through the JFK assassination files that have been publicly released. Provide detailed information from the official records.',
        parameters: z.object({
          query: z.string().describe('The search query related to JFK files. Be specific about what information from the JFK files you are looking for. For example, instead of just "JFK assassination", try "Warren Commission findings in JFK files" or "Lee Harvey Oswald background in JFK files".'),
        }),
        execute: async ({ query }) => {
          try {
            const results = await exa.searchAndContents(
                query,
              {
                numResults: 5,
                type: 'neural',
                useAutoprompt: true,
                includeDomains: ['www.archives.gov'],
                text: true,
                startCrawlDate: "2025-03-16T18:30:01.000Z"            
              }
            );
            return results.results;
          } catch (error) {
            console.error('Exa search error:', error);
            return { error: 'Failed to perform search on JFK files' };
          }
        },
      }),
    },
  });

  return result.toDataStreamResponse();
}