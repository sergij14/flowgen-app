import type { DiagramRequest } from '../../netlify/lib/diagram-request';

// The Anthropic call and its API key live server-side in netlify/functions/data.ts.
export async function generateMermaid(
  request: DiagramRequest,
  signal?: AbortSignal,
): Promise<string> {
  const response = await fetch("/api/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    signal,
  });

  // Netlify answers rate-limited requests itself, so there's no JSON body to read.
  if (response.status === 429) {
    throw new Error("Too many requests — wait a minute and try again.");
  }

  const data = (await response.json().catch(() => null)) as {
    code?: string;
    error?: string;
  } | null;

  if (!response.ok || !data?.code) {
    throw new Error(data?.error ?? "Something went wrong. Try again.");
  }
  return data.code;
}
