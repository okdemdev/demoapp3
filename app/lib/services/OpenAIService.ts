import Constants from 'expo-constants';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { z } from 'zod';

// Simplified interface for retry options
interface RetryOptions {
  maxRetries?: number;
  zodSchema?: z.ZodType<any>;
}

// Type for OpenAI API errors
interface OpenAIError extends Error {
  status?: number;
  type?: string;
  code?: string;
}

class OpenAIService {
  private openai: OpenAI;
  private static instance: OpenAIService;
  private readonly REQUEST_TIMEOUT = 120000; // 2 minutes in milliseconds

  private constructor() {
    // Get API key from config
    const apiKey = Constants.expoConfig?.extra?.openaiApiKey;

    if (!apiKey) {
      console.error(
        'OpenAI API key is missing. Please check your configuration.'
      );
    }

    // Initialize OpenAI client
    try {
      this.openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true, // Allow in browser/mobile environment
        timeout: this.REQUEST_TIMEOUT,
      });
    } catch (error) {
      console.error('Failed to initialize OpenAI client:', error);
      throw new Error('Failed to initialize OpenAI client');
    }
  }

  public static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  /**
   * Generate a response with simplified retry logic
   */
  private async generateWithRetry<T>(
    messages: ChatCompletionMessageParam[],
    options: RetryOptions = {}
  ): Promise<T> {
    const { maxRetries = 5, zodSchema } = options;
    let lastError: OpenAIError | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Create an AbortController for this attempt
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, this.REQUEST_TIMEOUT);

        const response = await this.openai.chat.completions.create(
          {
            model: 'gpt-4.1',
            messages,
            temperature: 0.5, // Lower temperature for more deterministic responses
          },
          { signal: controller.signal }
        );

        clearTimeout(timeoutId);

        // Log success status
        console.debug(
          `OpenAI request successful [Attempt ${attempt + 1}/${maxRetries}]`
        );

        const content = response.choices[0]?.message?.content?.trim();

        if (!content) {
          throw new Error('Empty response from OpenAI');
        }

        // If a Zod schema was provided, validate the response
        if (zodSchema) {
          try {
            const parsed = zodSchema.parse(content);
            return parsed as T;
          } catch (validationError) {
            throw new Error(
              `Validation failed: ${(validationError as Error).message}`
            );
          }
        }

        return content as unknown as T;
      } catch (error) {
        lastError = error as OpenAIError;

        // Log error details quietly
        console.debug(`OpenAI attempt ${attempt + 1}/${maxRetries} failed:`, {
          status: lastError.status,
          type: lastError.type,
          message: lastError.message,
          isTimeout:
            lastError.name === 'AbortError' || lastError.code === 'ETIMEDOUT',
        });

        if (attempt < maxRetries - 1) {
          // Exponential backoff: 1s, 2s, 4s, 8s, 16s
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // Only throw the error after all retries are exhausted
    if (lastError) {
      const errorMessage = lastError.status
        ? `OpenAI request failed with status ${lastError.status}`
        : 'Failed to generate response after multiple attempts';
      throw new Error(errorMessage);
    }

    throw new Error('Failed to generate response after multiple attempts');
  }

  /**
   * Generate with Zod schema validation - simplified version
   */
  async generateWithZodSchema<T>(
    prompt: string,
    systemMessage: string,
    zodSchema: z.ZodType<T>,
    maxRetries: number = 5
  ): Promise<T> {
    try {
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
        }
      );
    } catch (error) {
      // Only log the error, don't expose details
      console.debug('Error generating response with schema:', error);
      throw error;
    }
  }

  /**
   * Simpler method to generate a custom response
   */
  async generateCustomResponse(
    prompt: string,
    systemMessage: string = 'You are a helpful assistant.'
  ): Promise<string> {
    try {
      return await this.generateWithRetry<string>([
        {
          role: 'system',
          content: systemMessage,
        },
        {
          role: 'user',
          content: prompt,
        },
      ]);
    } catch (error) {
      console.debug('Error generating custom response:', error);
      return 'Unable to generate response at this time.';
    }
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
      console.debug('Error generating insight:', error);
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
      console.debug('Error generating todo suggestion:', error);
      return 'Unable to generate suggestion at this time.';
    }
  }
}

export default OpenAIService;
