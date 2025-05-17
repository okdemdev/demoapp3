import Constants from 'expo-constants';
import OpenAI from 'openai';

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

  async generateInsight(
    question: string,
    answer: string | number
  ): Promise<string> {
    try {
      const prompt = `
Given the following question and answer about personal wellness, provide a brief, encouraging insight (max 2 sentences):
Question: ${question}
Answer: ${answer}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are a supportive wellness coach providing brief, encouraging insights.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      return (
        response.choices[0]?.message?.content?.trim() || 'No insight generated.'
      );
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

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are a wellness coach suggesting specific, actionable self-care tasks.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      return (
        response.choices[0]?.message?.content?.trim() ||
        'No suggestion generated.'
      );
    } catch (error) {
      console.error('Error generating todo suggestion:', error);
      return 'Unable to generate suggestion at this time.';
    }
  }

  async generateCustomResponse(
    prompt: string,
    systemMessage: string = 'You are a helpful assistant.'
  ): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemMessage,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      return (
        response.choices[0]?.message?.content?.trim() ||
        'No response generated.'
      );
    } catch (error) {
      console.error('Error generating custom response:', error);
      return 'Unable to generate response at this time.';
    }
  }
}

export default OpenAIService;
