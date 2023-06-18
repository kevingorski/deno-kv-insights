import { db } from '../common/db.ts';
import { CursorBasedDBEntry, DBEntry, EntryValue, KeyPart } from './models.ts';
import { VersionConflictError } from '../common/errors.ts';
import { Pagination } from '../common/models.ts';

export async function findAllEntries(pagination?: Pagination): Promise<CursorBasedDBEntry[]> {
  const entries: CursorBasedDBEntry[] = [];

  const entriesIterator = await db.list({ prefix: [] }, { limit: pagination?.first, cursor: pagination?.after });
  for await (const entry of entriesIterator) {
    entries.push({
      ...entry,
      cursor: entriesIterator.cursor,
    });
  }

  return entries;
}

export async function findEntryByCursor(cursor: string): Promise<CursorBasedDBEntry | null> {
  try {
    let entriesIterator = await db.list({ prefix: [] }, { limit: 1, cursor });
    await entriesIterator.next();

    entriesIterator = await db.list({ prefix: [] }, { limit: 1, cursor: entriesIterator.cursor, reverse: true });
    for await (const entry of entriesIterator) {
      return {
        ...entry,
        cursor: cursor,
      };
    }
  } catch (e) {
    if (e.message !== 'invalid cursor') {
      throw e;
    }
  }

  return null;
}

export async function saveEntry(
  key: KeyPart[],
  value: EntryValue,
  versionstamp: string | null = null,
): Promise<DBEntry> {
  const commitResult: { ok: boolean; versionstamp: string } = await db.atomic()
    .check({ key, versionstamp })
    .set(
      key,
      value,
    ).commit();
  if (!commitResult.ok) {
    throw new VersionConflictError(
      `Version conflict while setting entry with key '${key}' and version stamp '${versionstamp}'. DB version stamp ${commitResult.versionstamp}.`,
    );
  }

  return {
    versionstamp: commitResult.versionstamp,
    key,
    value,
  };
}

export async function entryExists(key: KeyPart[]): Promise<boolean> {
  const { versionstamp } = await db.get(key);
  return !!versionstamp;
}

export async function deleteEntry(key: KeyPart[]): Promise<void> {
  await db.delete(key);
}
