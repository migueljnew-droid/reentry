import OpenAI from 'openai';
import { openaiCircuit, CircuitOpenError } from '@/lib/circuit-breaker';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface EnhancedPlanRequest {
  state: string;
  stateName: string;
  convictionType: string;
  immediateNeeds: string[];
  hasChildren: boolean;
  numberOfChildren: number;
  hasSupportNetwork: boolean;
  workHistory: string;
  education: string;
  supervisionType: string;
  stateData: Record<string, unknown>;
}

export async function enhancePlanWithAI(
  request: EnhancedPlanRequest
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return ''; // Fall back to static plan generation
  }

  try {
    const completion = await openaiCircuit.execute(() =>
      openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 2000,
        messages: [
          {
            role: 'system',
            content: `You are REENTRY's AI advisor for returning citizens. Generate SPECIFIC, ACTIONABLE advice for someone being released from prison/jail in ${request.stateName}.

Every piece of advice must include:
- Specific agency names, phone numbers, and addresses when available
- Step-by-step instructions (not vague platitudes)
- Realistic timelines
- What documents to bring
- What to say or ask for

Be warm but direct. Use simple language (8th grade reading level). Never be condescending. These are adults navigating a complex system — treat them with dignity and give them real information.`,
          },
          {
            role: 'user',
            content: `Generate 3-5 personalized tips for this returning citizen:

State: ${request.stateName} (${request.state})
Conviction: ${request.convictionType}
Immediate needs: ${request.immediateNeeds.join(', ') || 'none specified'}
Has children: ${request.hasChildren ? `Yes, ${request.numberOfChildren}` : 'No'}
Support network: ${request.hasSupportNetwork ? 'Yes' : 'No — on their own'}
Work history: ${request.workHistory || 'Not provided'}
Education: ${request.education || 'Not provided'}
Supervision: ${request.supervisionType || 'None'}

Based on this profile, provide 3-5 HIGHLY SPECIFIC tips that address their unique situation. Focus on things they might not know, common mistakes to avoid, and hidden opportunities.

Format as JSON array: [{"title": "...", "tip": "...", "priority": 1-5}]`,
          },
        ],
      })
    );

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    if (error instanceof CircuitOpenError) {
      console.warn('[AI] Circuit breaker open — falling back to static plan');
      return '';
    }
    console.error('AI enhancement failed:', error);
    return '';
  }
}
