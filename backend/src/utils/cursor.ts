import mongoose, { Types } from 'mongoose';

import { badUserInput } from '../graphql/errors';

// A cursor is the id of the last task on a page, encoded as base64url.
// Clients treat it as an opaque string and send it back as "after".

export function encodeCursor(id: string): string {
  return Buffer.from(id, 'utf8').toString('base64url');
}

// Turns a cursor back into an ObjectId. Throws BAD_USER_INPUT when the cursor is not ours.
export function decodeCursor(cursor: string): Types.ObjectId {
  const id = Buffer.from(cursor, 'base64url').toString('utf8');
  if (!mongoose.isObjectIdOrHexString(id)) {
    throw badUserInput('Invalid cursor', 'after');
  }
  return new Types.ObjectId(id);
}
