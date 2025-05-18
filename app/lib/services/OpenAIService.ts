import Constants from 'expo-constants';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { z } from 'zod';

// Simplified interface for retry options
interface RetryOptions {
  maxRetries?: number;
  zodSchema?: z.ZodType<any>;
  jsonMode?: boolean;
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

  private constructor() {
    // Get API key from config
    const apiKey = Constants.expoConfig?.extra?.openaiApiKey;

    if (!apiKey) {
      console.error(
        'OpenAI API key is missing. Please check your configuration.'
      );
      throw new Error('OpenAI API key is required');
    }

    // Initialize OpenAI client
    try {
      this.openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true, // Required for React Native
        timeout: 30 * 1000,
      });
    } catch (error) {
      console.error('Failed to initialize OpenAI client:', error);
      throw new Error('Failed to initialize OpenAI client');
    }
  }

  public static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      try {
        OpenAIService.instance = new OpenAIService();
      } catch (error) {
        console.error('Failed to create OpenAI service instance:', error);
        throw error;
      }
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
    const { maxRetries = 5, zodSchema, jsonMode = false } = options;
    let lastError: OpenAIError | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4.1-mini',
          messages,
          temperature: 0.5, // Lower temperature for more consistent responses
          max_tokens: 1000, // Limit response length since we only need numbers
          presence_penalty: 0, // No need to encourage diverse responses
          frequency_penalty: 0, // No need to penalize frequent tokens
          response_format: jsonMode ? { type: 'json_object' } : undefined,
        });

        const content = response.choices[0]?.message?.content?.trim();

        if (!content) {
          throw new Error('Empty response from OpenAI');
        }

        // If a Zod schema was provided, validate the response
        if (zodSchema) {
          try {
            // Try to parse as JSON first if it's a string
            let parsedContent: any;
            if (typeof content === 'string') {
              try {
                parsedContent = JSON.parse(content);
                console.log('Successfully parsed JSON response:', JSON.stringify(parsedContent).substring(0, 100) + '...');
              } catch (e) {
                console.log('Content is not valid JSON, using as raw value:', content);
                parsedContent = content;
              }
            } else {
              parsedContent = content;
            }

            try {
              // Use the schema to validate and transform the data
              const parsed = zodSchema.parse(parsedContent);
              console.log('Validation successful, returning:', parsed);
              return parsed as T;
            } catch (validationError) {
              console.warn('Raw response that failed validation:', JSON.stringify(parsedContent));
              console.warn('Validation error details:', validationError);
              throw new Error(
                `Validation failed: ${(validationError as Error).message}`
              );
            }
          } catch (validationError) {
            console.warn('Raw response that failed validation:', content);
            console.warn('Validation error full details:', validationError);
            throw new Error(
              `Validation failed: ${(validationError as Error).message}`
            );
          }
        }

        return content as unknown as T;
      } catch (error) {
        lastError = error as OpenAIError;

        // Log error details
        console.warn(`OpenAI attempt ${attempt + 1}/${maxRetries} failed:`, {
          status: lastError.status,
          type: lastError.type,
          message: lastError.message,
          isTimeout:
            lastError.name === 'AbortError' || lastError.code === 'ETIMEDOUT',
        });

        // If it's the last attempt, or if it's a fatal error, throw immediately
        if (
          attempt === maxRetries - 1 ||
          lastError.status === 401 || // Unauthorized
          lastError.status === 403 || // Forbidden
          lastError.status === 429 // Rate limit exceeded
        ) {
          throw lastError;
        }

        // Exponential backoff with jitter
        const delay = Math.min(
          1000 * Math.pow(2, attempt) + Math.random() * 1000,
          10000
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
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
    maxRetries: number = 3,
    jsonMode: boolean = true
  ): Promise<T> {
    try {
      // If we're validating with a number schema and not in JSON mode, adjust instructions
      const isNumberSchema = zodSchema.safeParse(123).success && !zodSchema.safeParse('abc').success;

      // Add clear format instructions based on the expected response type
      let enhancedSystemMessage = systemMessage;

      if (jsonMode) {
        // For JSON responses
        enhancedSystemMessage = `${systemMessage}\n\nIMPORTANT: You must respond with a valid JSON object only. Do not include any explanatory text or markdown formatting.`;
      } else if (isNumberSchema) {
        // For direct number responses
        enhancedSystemMessage = `${systemMessage}\n\nIMPORTANT: You must respond with only a single number. No additional text, no formatting, no JSON.`;
      }

      const result = await this.generateWithRetry<T>(
        [
          {
            role: 'system',
            content: enhancedSystemMessage,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        {
          maxRetries,
          zodSchema,
          jsonMode,
        }
      );

      return result;
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
