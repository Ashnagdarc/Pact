import Dexie, { type EntityTable } from "dexie";

export type CheckInDraft = {
  id?: number;
  commitmentId: string;
  signal: string;
  note: string;
  updatedAt: number;
};

const db = new Dexie("pact-offline") as Dexie & {
  checkInDrafts: EntityTable<CheckInDraft, "id">;
};

db.version(1).stores({
  checkInDrafts: "++id, commitmentId, updatedAt",
});

export async function saveCheckInDraft(input: {
  commitmentId: string;
  signal: string;
  note: string;
}) {
  const existing = await db.checkInDrafts
    .where("commitmentId")
    .equals(input.commitmentId)
    .first();
  const row = {
    commitmentId: input.commitmentId,
    signal: input.signal,
    note: input.note,
    updatedAt: Date.now(),
  };
  if (existing?.id != null) {
    await db.checkInDrafts.update(existing.id, row);
    return existing.id;
  }
  return await db.checkInDrafts.add(row);
}

export async function readCheckInDraft(commitmentId: string) {
  return await db.checkInDrafts.where("commitmentId").equals(commitmentId).first();
}

export async function clearCheckInDraft(commitmentId: string) {
  await db.checkInDrafts.where("commitmentId").equals(commitmentId).delete();
}

export async function listCheckInDrafts() {
  return await db.checkInDrafts.orderBy("updatedAt").reverse().toArray();
}
