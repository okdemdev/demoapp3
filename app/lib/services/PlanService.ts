import { z } from 'zod';
import { Plan } from '../planStorage';
import OpenAIService from './OpenAIService';

const planWeekSchema = z.object({
  weekNumber: z.number(),
  improvements: z.array(
    z.object({
      text: z.string(),
      category: z.string(),
    })
  ),
});

const planSchema = z.object({
  weeks: z.array(planWeekSchema),
});

const DEFAULT_ICON = '➡️';

export class PlanService {
  private static instance: PlanService;
  private openai: OpenAIService;

  private constructor() {
    this.openai = OpenAIService.getInstance();
  }

  public static getInstance(): PlanService {
    if (!PlanService.instance) {
      PlanService.instance = new PlanService();
    }
    return PlanService.instance;
  }

  private getIconForCategory(category: string): string {
    const categoryIcons: { [key: string]: string } = {
      // Physical Health
      meditation: '🧘‍♂️',
      exercise: '💪',
      sleep: '😴',
      water: '💧',
      breathing: '🫁',
      walking: '🚶',
      stretching: '🤸‍♂️',
      nutrition: '🥗',
      workout: '💪',
      fitness: '🏃',
      yoga: '🧘',
      health: '❤️',

      // Mental Well-being
      mindfulness: '🎯',
      gratitude: '🙏',
      journaling: '📝',
      reflection: '🤔',
      focus: '🎯',
      clarity: '🧠',
      mood: '😊',
      mental: '🧠',

      // Learning & Growth
      reading: '📚',
      knowledge: '📖',
      learning: '📚',
      study: '📖',
      growth: '🌱',

      // Habits & Routine
      routine: '📅',
      habits: '✨',
      planning: '📋',
      organization: '📊',
      productivity: '⚡️',

      // Social & Emotional
      confidence: '🌟',
      social: '👥',
      communication: '💭',
      connection: '🤝',
      emotional: '💝',

      // Energy & Vitality
      energy: '⚡️',
      vitality: '✨',
      metabolism: '🔥',
      recovery: '🔄',
    };

    const lowerCategory = category.toLowerCase();
    return categoryIcons[lowerCategory] || DEFAULT_ICON;
  }

  private generateDateRange(weekNumber: number): {
    startDate: string;
    endDate: string;
  } {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + (weekNumber - 1) * 7);

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  }

  public async generatePlan(userData: any): Promise<Plan> {
    try {
      const systemMessage = `You are a life coach and wellness expert. Your task is to create a 4-week improvement plan based on the user's data. Each week should have 2-4 specific, actionable improvements that build upon each other. Focus on habits, routines, and measurable actions.

Response Format Instructions:
1. Respond ONLY with a JSON object
2. The JSON must match this exact structure:
{
  "weeks": [
    {
      "weekNumber": number,
      "improvements": [
        {
          "text": string (specific, actionable improvement),
          "category": string (one of: meditation, exercise, sleep, water, breathing, walking, stretching, nutrition, workout, fitness, yoga, health, mindfulness, gratitude, journaling, reflection, focus, clarity, mood, mental, reading, knowledge, learning, study, growth, routine, habits, planning, organization, productivity, confidence, social, communication, connection, emotional, energy, vitality, metabolism, recovery)
        }
      ]
    }
  ]
}
3. Do not include any additional text or explanation
4. Ensure all JSON properties match the exact names shown above
5. Always include a category that best matches the improvement`;

      const userPrompt = `
Create a 4-week improvement plan based on this user data:
${JSON.stringify(userData, null, 2)}

Plan Requirements:
1. Week 1: Start with 2-3 basic, easy habits that anyone can do
2. Week 2: Add 2-3 slightly more challenging habits while maintaining week 1 habits
3. Week 3: Introduce 2-3 habits focused on mental well-being and personal growth
4. Week 4: Add 2-3 advanced habits that combine physical and mental improvement

Guidelines for improvements:
- Each improvement must be specific and actionable (e.g., "Meditate for 10 minutes every morning" instead of "Start meditating")
- Include measurable metrics where possible (time, repetitions, frequency)
- Focus on sustainable, long-term habits
- Consider the user's current lifestyle and capabilities
- Ensure improvements build upon each other progressively
- For each improvement, assign a category from the list in the system message that best matches the activity

Example improvement:
{
  "text": "Meditate for 10 minutes every morning after waking up",
  "category": "meditation"
}

Remember to respond ONLY with the JSON object matching the specified structure.`.trim();

      const rawPlan = await this.openai.generateWithZodSchema(
        userPrompt,
        systemMessage,
        planSchema,
        3, // maxRetries
        true // jsonMode
      );

      // Add dates and icons to the plan
      const enhancedPlan: Plan = {
        generatedAt: new Date().toISOString(),
        weeks: rawPlan.weeks.map((week) => {
          const { startDate, endDate } = this.generateDateRange(
            week.weekNumber
          );
          return {
            ...week,
            startDate,
            endDate,
            improvements: week.improvements.map((improvement) => ({
              ...improvement,
              icon: this.getIconForCategory(improvement.category),
            })),
          };
        }),
      };

      return enhancedPlan;
    } catch (error) {
      console.error('Error generating plan:', error);
      throw error;
    }
  }
}
