// The longest title we accept. The backend uses the same number.
export const TITLE_MAX_LENGTH = 120;

// How many tasks one page holds.
export const PAGE_SIZE = 20;

// How long we wait after the user stops typing before we search.
export const SEARCH_DEBOUNCE_MS = 300;

// Shown when a title is already pending. The backend sends the same message.
export const DUPLICATE_PENDING_TITLE_MESSAGE = 'A pending task with this title already exists';
