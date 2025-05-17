import Constants from 'expo-constants';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { z } from 'zod';

interface RetryOptions {
  maxRetries?: number;
  zodSchema?: z.ZodType<any>;
  errorMessage?: string;
}

class OpenAIService {
  private openai: OpenAI;
  private static instance: OpenAIService;

  private constructor() {
    this.openai = new OpenAI({
      apiKey: Constants.expoConfig?.extra?.openaiApiKey,
    });
  }

  public static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  /**
   * Generate a response with automatic retries and optional Zod validation
   */
  private async generateWithRetry<T>(
    messages: ChatCompletionMessageParam[],
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      zodSchema,
      errorMessage = 'Failed to generate valid response',
    } = options;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o',
          messages,
        });

        const content = response.choices[0]?.message?.content?.trim();
        if (!content) {
          throw new Error('Empty response from OpenAI');
        }

        // If a Zod schema was provided, validate the response
        if (zodSchema) {
          try {
            // We assume schema validation is for the content string or something parsed from it
            return zodSchema.parse(content) as T;
          } catch (validationError) {
            console.warn(
              `Validation failed (attempt ${attempt + 1}):`,
              validationError
            );
            throw new Error(
              `Validation failed: ${(validationError as Error).message}`
            );
          }
        }

        return content as unknown as T;
      } catch (error) {
        console.warn(`Attempt ${attempt + 1} failed:`, error);
        lastError = error as Error;
        // Continue to the next retry
      }
    }

    console.error(`All ${maxRetries} attempts failed. Last error:`, lastError);
    throw new Error(errorMessage);
  }

  async generateInsight(
    question: string,
    answer: string | number
  ): Promise<string> {
    try {
      const prompt = `
Given the following question and answer about personal wellness, provide a brief, encouraging insight (max 2 sentences):
Question: ${question}
Answer: ${answer}`;

      return await this.generateWithRetry<string>([
        {
          role: 'system',
          content:
            'You are a supportive wellness coach providing brief, encouraging insights.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ]);
    } catch (error) {
      console.error('Error generating insight:', error);
      return 'Unable to generate insight at this time.';
    }
  }

  async generateTodoSuggestion(context: string): Promise<string> {
    try {
      const prompt = `
Based on the following context about the user's wellness journey, suggest a specific, actionable self-care task (max 10 words):
Context: ${context}`;

      return await this.generateWithRetry<string>([
        {
          role: 'system',
          content:
            'You are a wellness coach suggesting specific, actionable self-care tasks.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ]);
    } catch (error) {
      console.error('Error generating todo suggestion:', error);
      return 'Unable to generate suggestion at this time.';
    }
  }

  async generateCustomResponse(
    prompt: string,
    systemMessage: string = 'You are a helpful assistant.',
    options: RetryOptions = {}
  ): Promise<string> {
    try {
      return await this.generateWithRetry<string>(
        [
          {
            role: 'system',
            content: systemMessage,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        options
      );
    } catch (error) {
      console.error('Error generating custom response:', error);
      return 'Unable to generate response at this time.';
    }
  }

  async generateWithZodSchema<T>(
    prompt: string,
    systemMessage: string,
    zodSchema: z.ZodType<T>,
    maxRetries: number = 3
  ): Promise<T> {
    return await this.generateWithRetry<T>(
      [
        {
          role: 'system',
          content: systemMessage,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      {
        maxRetries,
        zodSchema,
        errorMessage: 'Failed to generate and validate response',
      }
    );
  }
}

export default OpenAIService;
