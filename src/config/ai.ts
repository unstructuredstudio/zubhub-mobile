/**
 * Claude AI configuration.
 *
 * NOTE: For production, move the API key to a server-side proxy to avoid
 * exposing it in the client bundle. The `baseUrl` can be swapped to your
 * own backend endpoint that forwards requests to Anthropic.
 */
export const aiConfig = {
  apiKey: process.env.EXPO_PUBLIC_CLAUDE_API_KEY ?? '',
  // Haiku: generation is short, plain writing to a fixed schema, and educators
  // wait on it. Swap back to 'claude-sonnet-4-6' if quality falls short.
  model: 'claude-haiku-5-5',
  maxTokens: 2500,
  baseUrl: 'https://api.anthropic.com/v1/messages',
  anthropicVersion: '2023-06-01',
};
