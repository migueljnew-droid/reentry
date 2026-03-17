const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  token?: string;
}

export async function api<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, token } = options;

  const fetchHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (token) {
    fetchHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: fetchHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error ${response.status}: ${error}`);
  }

  return response.json();
}

export const apiClient = {
  // Intake
  startIntake: () =>
    api<{ sessionId: string }>('/intake/start', { method: 'POST' }),

  sendMessage: (sessionId: string, message: string) =>
    api<{ reply: string; stage: string }>('/intake/message', {
      method: 'POST',
      body: { sessionId, message },
    }),

  sendVoice: async (sessionId: string, audioBlob: Blob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('sessionId', sessionId);

    const response = await fetch(`${API_BASE}/intake/voice`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Voice upload failed');
    return response.json() as Promise<{ transcript: string; reply: string; stage: string }>;
  },

  // Plans
  generatePlan: (sessionId: string) =>
    api<{ planId: string }>('/plans/generate', {
      method: 'POST',
      body: { sessionId },
    }),

  getPlan: (planId: string) =>
    api<{ plan: Record<string, unknown> }>(`/plans/${planId}`),

  updateStep: (planId: string, stepId: string, status: string) =>
    api(`/plans/${planId}/steps/${stepId}`, {
      method: 'PATCH',
      body: { status },
    }),

  // Benefits
  screenBenefits: (userId: string) =>
    api<{ results: Record<string, unknown>[] }>(
      '/benefits/screen',
      { method: 'POST', body: { userId } }
    ),

  // Employment
  matchEmployment: (userId: string) =>
    api<{ matches: Record<string, unknown>[] }>(
      '/employment/match',
      { method: 'POST', body: { userId } }
    ),

  // Deadlines
  getDeadlines: (token: string) =>
    api<{ deadlines: Record<string, unknown>[] }>('/deadlines', { token }),

  // Health
  healthCheck: () => api<{ status: string }>('/health'),
};
