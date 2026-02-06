const API_BASE = '/api';

function getHeaders(): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('session_token');
  if (token) headers['X-Session-Token'] = token;
  return headers;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...options?.headers },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// Auth
export const api = {
  login: (email: string, name?: string) =>
    request<{ user: any; session_token: string; is_new_user: boolean; disclaimer_required: boolean }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, name }) }
    ),
  getSession: () => request<any>('/auth/session'),

  // Users
  getUser: (id: string) => request<any>(`/users/${id}`),
  updateUser: (id: string, data: any) =>
    request<any>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  acknowledgeDisclaimer: (id: string) =>
    request<any>(`/users/${id}/disclaimer`, { method: 'POST' }),

  // Financial Profile
  getFinancialProfile: (userId: string) => request<any>(`/financial-profile/${userId}`),
  createFinancialProfile: (data: any) =>
    request<any>('/financial-profile', { method: 'POST', body: JSON.stringify(data) }),
  updateFinancialProfile: (userId: string, data: any) =>
    request<any>(`/financial-profile/${userId}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Goals
  getGoals: (userId: string) => request<any>(`/goals/${userId}`),
  createGoal: (data: any) =>
    request<any>('/goals', { method: 'POST', body: JSON.stringify(data) }),
  updateGoal: (userId: string, goalId: string, data: any) =>
    request<any>(`/goals/${userId}/${goalId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteGoal: (userId: string, goalId: string) =>
    request<void>(`/goals/${userId}/${goalId}`, { method: 'DELETE' }),

  // Models
  runMonteCarlo: (data: any) =>
    request<any>('/models/monte-carlo', { method: 'POST', body: JSON.stringify(data) }),
  runFixedReturn: (data: any) =>
    request<any>('/models/fixed-return', { method: 'POST', body: JSON.stringify(data) }),
  runThreeScenario: (data: any) =>
    request<any>('/models/three-scenario', { method: 'POST', body: JSON.stringify(data) }),
  compareModels: (data: any) =>
    request<any>('/models/compare', { method: 'POST', body: JSON.stringify(data) }),

  // Scenarios
  getScenarios: (userId: string) => request<any>(`/scenarios/${userId}`),
  saveScenario: (data: any) =>
    request<any>('/scenarios', { method: 'POST', body: JSON.stringify(data) }),

  // AI Chat
  chat: (data: { user_id: string; message: string; conversation_id?: string }) =>
    request<{
      response: string;
      conversation_id: string;
      extracted_parameters: any;
      onboarding_complete: boolean;
      recommended_model?: string;
    }>('/ai/chat', { method: 'POST', body: JSON.stringify(data) }),
};
