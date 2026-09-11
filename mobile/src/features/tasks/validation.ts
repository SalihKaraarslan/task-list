import { TITLE_MAX_LENGTH } from './constants';

export type TitleValidation = { ok: true; title: string } | { ok: false; error: string };

// Removes spaces at the start and the end, and turns runs of spaces inside into one space.
export function collapseWhitespace(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

// The value the backend compares titles by: clean spaces and lower case.
// "Go   gym" and "go gym" become the same value.
export function normalizeTitle(title: string): string {
  return collapseWhitespace(title).toLowerCase();
}

// Same rules as the backend. We also check here, so the user gets feedback right away.
export function validateTitle(rawTitle: string): TitleValidation {
  const title = collapseWhitespace(rawTitle);
  if (title.length === 0) {
    return { ok: false, error: 'Title is required' };
  }
  if (title.length > TITLE_MAX_LENGTH) {
    return { ok: false, error: `Title must be at most ${TITLE_MAX_LENGTH} characters` };
  }
  return { ok: true, title };
}
