import * as Speech from 'expo-speech';
import { Plan } from '../planStorage';
import OpenAIService from './OpenAIService';

export class VideoService {
  private static instance: VideoService;
  private openai: OpenAIService;
  private lastGeneratedScript: string | null = null;

  private constructor() {
    this.openai = OpenAIService.getInstance();
  }

  public static getInstance(): VideoService {
    if (!VideoService.instance) {
      VideoService.instance = new VideoService();
    }
    return VideoService.instance;
  }

  private async generateScript(plan: Plan): Promise<string> {
    console.log('🎬 Generating narration script...');
    const systemMessage = `You are a professional video script writer. Create a very brief, engaging script (max 30 seconds when spoken) for a motivational video about a personal improvement plan. IMPORTANT: Use only plain text, no emojis or special characters.`;

    const userPrompt = `Create a super short script (max 30 seconds when spoken) for this ${
      plan.weeks.length
    }-week improvement plan. Keep it extremely concise:
1. One sentence introduction
2. One key improvement from each week
3. One sentence encouraging conclusion

IMPORTANT: Use only plain text, no emojis or special characters.

Plan details:
${JSON.stringify(plan, null, 2)}`;

    const script = await this.openai.generateCustomResponse(
      userPrompt,
      systemMessage
    );
    // Remove any emojis that might have slipped through
    const cleanScript = script
      .replace(
        /[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F190}-\u{1F1FF}]|[\u{1F200}-\u{1F2FF}]|[\u{2000}-\u{206F}]|[\u{2300}-\u{23FF}]|[\u{2B00}-\u{2BFF}]|[\u{2900}-\u{297F}]|[\u{2B00}-\u{2BFF}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{1F100}-\u{1F1FF}]|[\u{1F200}-\u{1F2FF}]|[\u{1F300}-\u{1F5FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]/gu,
        ''
      )
      .trim();

    console.log('📝 Generated script:', cleanScript);
    this.lastGeneratedScript = cleanScript;
    return cleanScript;
  }

  private async textToSpeech(text: string): Promise<void> {
    console.log('🗣️ Starting text-to-speech...');
    return new Promise((resolve, reject) => {
      Speech.speak(text, {
        rate: 0.9, // Slightly slower for clarity
        onStart: () => console.log('🎤 Speech started'),
        onDone: () => {
          console.log('✅ Speech completed');
          resolve();
        },
        onError: (error) => {
          console.error('❌ Speech error:', error);
          reject(error);
        },
      });
    });
  }

  public async generatePlanVideo(
    plan: Plan
  ): Promise<{ script: string; words: string[] }> {
    try {
      console.log('🎥 Starting presentation generation...');

      // 1. Generate script
      const script = await this.generateScript(plan);

      // 2. Split script into words for animation
      const words = script.split(' ');

      // 3. Start narration
      await this.textToSpeech(script);

      console.log('🎉 Presentation and narration completed!');
      return { script, words };
    } catch (error) {
      console.error('❌ Error generating presentation:', error);
      throw error;
    }
  }

  public async replayLastScript(): Promise<void> {
    if (!this.lastGeneratedScript) {
      throw new Error('No narration available to replay');
    }
    return this.textToSpeech(this.lastGeneratedScript);
  }

  public getLastScript(): string | null {
    return this.lastGeneratedScript;
  }
}
