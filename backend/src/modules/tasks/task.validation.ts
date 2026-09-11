import { badUserInput } from '../../graphql/errors';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  SEARCH_MAX_LENGTH,
  TITLE_MAX_LENGTH,
} from './task.constants';

// Removes spaces at the start and the end, and turns runs of spaces inside into one space.
// "  Go   gym " becomes "Go gym".
export function collapseWhitespace(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

// Cleans a title and checks the rules. Returns the clean title or throws a GraphQL error.
export function validateTitle(rawTitle: string): string {
  const title = collapseWhitespace(rawTitle);
  if (title.length === 0) {
    throw badUserInput('Title is required', 'title');
  }
  if (title.length > TITLE_MAX_LENGTH) {
    throw badUserInput(`Title must be at most ${TITLE_MAX_LENGTH} characters`, 'title');
  }
  return title;
}

// Makes the version of a title that we store for search and duplicate checks:
// clean spaces and lower case, so "Go   gym" and "go gym" become the same value.
export function normalizeTitle(title: string): string {
  return collapseWhitespace(title).toLowerCase();
}

// Cleans a search text. Returns undefined when there is nothing to search for.
export function validateSearch(rawSearch: string | null | undefined): string | undefined {
  if (rawSearch == null) {
    return undefined;
  }
  if (rawSearch.length > SEARCH_MAX_LENGTH) {
    throw badUserInput(`Search must be at most ${SEARCH_MAX_LENGTH} characters`, 'search');
  }
  const search = normalizeTitle(rawSearch);
  return search.length > 0 ? search : undefined;
}

// Checks the page size. Returns the default when the client did not send one.
export function validateFirst(first: number | null | undefined): number {
  if (first == null) {
    return DEFAULT_PAGE_SIZE;
  }
  if (!Number.isInteger(first) || first < 1 || first > MAX_PAGE_SIZE) {
    throw badUserInput(`"first" must be between 1 and ${MAX_PAGE_SIZE}`, 'first');
  }
  return first;
}
