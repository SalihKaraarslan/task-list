// Escapes the special regex characters in a text, so it is matched as plain text.
export function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
