const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const uploadVoice = async (audioBlob: Blob, sessionId: string = 'anonymous') => {
  const formData = new FormData();
  // Use .webm extension as it's the most common for browser recordings
  formData.append('audio', audioBlob, 'voice.webm');
  if (sessionId) formData.append('session_id', sessionId);

  const response = await fetch(`${API_BASE_URL}/voice/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload voice');
  }

  return response.json();
};

export const extractIntent = async (voiceLogId: string) => {
  const response = await fetch(`${API_BASE_URL}/intent/extract?voice_log_id=${voiceLogId}`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Failed to extract intent');
  }

  return response.json();
};

export const confirmIntent = async (intentId: string, updates: any = {}) => {
  const response = await fetch(`${API_BASE_URL}/intent/confirm?intent_id=${intentId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error('Failed to confirm intent');
  }

  return response.json();
};

export const optimizePrompt = async (intentId: string) => {
  const response = await fetch(`${API_BASE_URL}/prompt/optimize?intent_id=${intentId}`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Failed to optimize prompt');
  }

  return response.json();
};

export const updateIntent = async (intentId: string, updates: any) => {
  const response = await fetch(`${API_BASE_URL}/intent/update?intent_id=${intentId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error('Failed to update intent');
  }

  return response.json();
};

export const getPromptDetails = async (promptId: string) => {
  const response = await fetch(`${API_BASE_URL}/prompt/${promptId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch prompt details');
  }
  return response.json();
};

export const listMemories = async (sessionId: string) => {
  const response = await fetch(`${API_BASE_URL}/memory/list/${sessionId}`);
  if (!response.ok) {
    throw new Error('Failed to list memories');
  }
  return response.json();
};

export const createMemory = async (data: { user_session_id: string, fact_text: string, memory_type?: string }) => {
  const response = await fetch(`${API_BASE_URL}/memory/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create memory');
  }
  return response.json();
};

export const listDecisionLogs = async (sessionId: string) => {
  const response = await fetch(`${API_BASE_URL}/logs/${sessionId}`);
  if (!response.ok) {
    throw new Error('Failed to list decision logs');
  }
  return response.json();
};

export const getSessionGraph = async (sessionId: string) => {
  const response = await fetch(`${API_BASE_URL}/graph/session/${sessionId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch session graph');
  }
  return response.json();
};

export const listSessions = async () => {
  const response = await fetch(`${API_BASE_URL}/sessions/`);
  if (!response.ok) {
    throw new Error('Failed to list sessions');
  }
  return response.json();
};
