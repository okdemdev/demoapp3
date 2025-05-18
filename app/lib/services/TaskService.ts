import { z } from 'zod';
import { MetricKey } from '../context/GlobalContext';
import OpenAIService from './OpenAIService';

// Define the schema for tasks returned from the AI
const taskSchema = z.object({
    title: z.string(),
    description: z.string(),
    difficulty: z.number().min(1).max(5),
    points: z.number().min(1).max(30),
    metric: z.enum(['wisdom', 'strength', 'focus', 'confidence', 'discipline']),
});

// Accept either an array directly or an object with a tasks property that contains the array
const tasksResponseSchema = z.union([
    z.array(taskSchema),
    z.object({
        tasks: z.array(taskSchema)
    })
]);

// Matches the Task interface from todo.tsx but simplifies for AI generation
export interface AIGeneratedTask {
    title: string;
    description: string;
    difficulty: number; // 1-5
    points: number;
    metric: MetricKey;
}

export class TaskService {
    private static instance: TaskService;
    private openai: OpenAIService;

    private constructor() {
        this.openai = OpenAIService.getInstance();
    }

    public static getInstance(): TaskService {
        if (!TaskService.instance) {
            TaskService.instance = new TaskService();
        }
        return TaskService.instance;
    }

    /**
     * Analyzes metrics to identify which areas need the most improvement
     */
    private analyzeMetrics(metrics: Record<MetricKey, number>): {
        weakestAreas: MetricKey[];
        strongestAreas: MetricKey[];
    } {
        // Create array of metrics with their values
        const metricsArray = Object.entries(metrics) as [MetricKey, number][];

        // Sort by value (ascending)
        const sortedMetrics = [...metricsArray].sort((a, b) => a[1] - b[1]);

        // Get the weakest areas (lowest values)
        const weakestAreas = sortedMetrics.slice(0, 3).map(m => m[0]);

        // Get the strongest areas (highest values)
        const strongestAreas = sortedMetrics.reverse().slice(0, 2).map(m => m[0]);

        return { weakestAreas, strongestAreas };
    }

    /**
     * Format the OpenAI response to ensure it's valid JSON if possible
     * This is a utility method to handle potential issues with the response format
     */
    private formatOpenAIResponse(response: string): string {
        // If the response starts with "```json" and ends with "```", extract the JSON content
        if (response.startsWith('```json') && response.endsWith('```')) {
            return response.substring(7, response.length - 3).trim();
        }

        // If the response is wrapped in backticks, remove them
        if (response.startsWith('```') && response.endsWith('```')) {
            return response.substring(3, response.length - 3).trim();
        }

        return response;
    }

    /**
     * Generates daily tasks based on the user's metrics
     */
    public async generateDailyTasks(
        metrics: Record<MetricKey, number>,
        currentDay: number
    ): Promise<AIGeneratedTask[]> {
        try {
            const { weakestAreas, strongestAreas } = this.analyzeMetrics(metrics);

            const systemMessage = `You are a personal development coach specializing in creating actionable daily tasks. 
Your task is to create specific, actionable daily tasks that will help the user improve in their weakest areas while maintaining their strengths.

Response Format Instructions:
1. Respond ONLY with a JSON array of task objects
2. Each task object must follow this structure:
{
  "title": string (short, clear task title),
  "description": string (1-2 sentence explanation),
  "difficulty": number (1-5, with 5 being hardest),
  "points": number (5-30, based on difficulty and impact),
  "metric": string (one of: "wisdom", "strength", "focus", "confidence", "discipline")
}
3. Format your response as a plain JSON array: [{ task1 }, { task2 }, ...]
4. Do NOT wrap the array in any outer object
5. Ensure all tasks are specific, actionable, and can be completed in a single day
6. Tasks should vary in difficulty and approach
7. Focus primarily on the weakest areas while including at least one task for a strength area`;

            const userPrompt = `
Create 5 daily tasks for a user on day ${currentDay} of their personal development journey.

Current metrics (higher is better):
${Object.entries(metrics)
                    .map(([key, value]) => `- ${key}: ${value}`)
                    .join('\n')}

Areas needing most improvement: ${weakestAreas.join(', ')}
Strongest areas: ${strongestAreas.join(', ')}

Guidelines for tasks:
- Create 3 tasks focused on the weakest areas
- Create 2 tasks for maintaining or leveraging the strongest areas
- Tasks should be specific, actionable, and completable in a single day
- Include a mix of difficulties (1-5 scale)
- Award points (5-30) based on task difficulty and potential impact
- Ensure tasks are realistic and approachable
- Make tasks engaging and motivating
- For each task, include a brief description explaining its benefit

Remember to respond ONLY with the JSON array of tasks matching the specified structure.
Format exactly like this: [{ task1 }, { task2 }, ...] with NO outer wrapper object.`.trim();

            // Try with a direct OpenAI request first
            try {
                // For maximum compatibility, we'll make a simple custom request first
                const rawResponse = await this.openai.generateCustomResponse(
                    userPrompt,
                    systemMessage
                );

                // Format and parse the response
                const formattedResponse = this.formatOpenAIResponse(rawResponse);
                console.log('Formatted response sample:', formattedResponse.substring(0, 100) + '...');

                try {
                    const parsedTasks = JSON.parse(formattedResponse);
                    if (Array.isArray(parsedTasks) && parsedTasks.length > 0) {
                        // Check if the first item has the expected structure
                        const firstTask = parsedTasks[0];
                        if (firstTask.title && firstTask.description && firstTask.metric) {
                            console.log('Successfully parsed tasks from custom response');
                            return parsedTasks;
                        }
                    }
                } catch (parseError) {
                    console.warn('Failed to parse custom response:', parseError);
                    // Continue to the schema validation approach
                }
            } catch (customError) {
                console.warn('Custom response approach failed:', customError);
                // Continue to the schema validation approach
            }

            // Fall back to schema validation approach
            console.log('Falling back to schema validation approach');
            const response = await this.openai.generateWithZodSchema<any>(
                userPrompt,
                systemMessage,
                tasksResponseSchema,
                3, // maxRetries
                true // jsonMode
            );

            // Handle the response which could be either an array directly or an object with a tasks property
            let tasks: AIGeneratedTask[];
            if (Array.isArray(response)) {
                tasks = response;
            } else if (response && response.tasks && Array.isArray(response.tasks)) {
                tasks = response.tasks;
            } else {
                console.error('Unexpected response format:', response);
                throw new Error('Invalid response format from AI service');
            }

            return tasks;
        } catch (error) {
            console.error('Error generating tasks:', error);

            // Fallback to static tasks if AI generation fails
            return this.getFallbackTasks(metrics);
        }
    }

    /**
     * Provides fallback tasks in case AI generation fails
     */
    private getFallbackTasks(metrics: Record<MetricKey, number>): AIGeneratedTask[] {
        const { weakestAreas } = this.analyzeMetrics(metrics);

        // Default tasks covering all metrics
        const defaultTasks: Record<MetricKey, AIGeneratedTask> = {
            wisdom: {
                title: 'Read for 20 minutes',
                description: 'Feed your mind with knowledge.',
                difficulty: 3,
                points: 10,
                metric: 'wisdom'
            },
            strength: {
                title: 'Do 20 push-ups',
                description: 'Build your physical strength.',
                difficulty: 4,
                points: 15,
                metric: 'strength'
            },
            focus: {
                title: 'Meditate for 10 minutes',
                description: 'Clear your mind and enhance focus.',
                difficulty: 2,
                points: 10,
                metric: 'focus'
            },
            confidence: {
                title: 'Practice public speaking',
                description: 'Prepare and deliver a short speech.',
                difficulty: 4,
                points: 20,
                metric: 'confidence'
            },
            discipline: {
                title: 'Wake up at 7AM',
                description: 'Rise before everyone, seize the day.',
                difficulty: 3,
                points: 15,
                metric: 'discipline'
            }
        };

        // Prioritize tasks for weakest areas, then add others to total 5
        const prioritizedTasks = [
            ...weakestAreas.map(area => defaultTasks[area]),
            ...Object.values(defaultTasks).filter(task => !weakestAreas.includes(task.metric))
        ].slice(0, 5);

        return prioritizedTasks;
    }
} 