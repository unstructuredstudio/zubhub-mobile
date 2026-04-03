/**
 * Claude AI configuration.
 *
 * NOTE: For production, move the API key to a server-side proxy to avoid
 * exposing it in the client bundle. The `baseUrl` can be swapped to your
 * own backend endpoint that forwards requests to Anthropic.
 */
export const aiConfig = {
  apiKey: process.env.EXPO_PUBLIC_CLAUDE_API_KEY ?? '',
  model: 'claude-sonnet-4-20250514',
  maxTokens: 4096,
  baseUrl: 'https://api.anthropic.com/v1/messages',
  anthropicVersion: '2023-06-01',
};
