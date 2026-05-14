const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const uploadVoice = async (audioBlob: Blob, sessionId: string = 'anonymous') => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'voice.wav');
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
