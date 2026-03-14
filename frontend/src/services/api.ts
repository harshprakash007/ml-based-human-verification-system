// services/api.ts
// Handles all communication with the ML backend verification API

export interface BehaviorPayload {
  mouse_moves: { x: number; y: number; time: number }[];
  clicks: number[];
  keystrokes: number[];
  scrolls: { position: number; time: number }[];
  session_time: number;
}

export interface VerificationResult {
  human_score: number;
  decision: 'human' | 'uncertain' | 'bot';
  confidence?: number;
  message?: string;
}

const API_BASE = 'http://localhost:8000';

export async function verifyHumanBehavior(
  data: BehaviorPayload
): Promise<VerificationResult> {
  const response = await fetch(`${API_BASE}/verify-human`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Client-Version': '1.0.0',
    },
    body: JSON.stringify(data),
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const result: VerificationResult = await response.json();
  return result;
}

export type ApiStatus = 'idle' | 'collecting' | 'analyzing' | 'success' | 'warning' | 'error' | 'offline';
