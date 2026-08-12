import Dexie, { type EntityTable } from "dexie";

export type CheckInDraft = {
  id?: number;
  commitmentId: string;
  signal: string;
  note: string;
  updatedAt: number;
};

export type CreateDraft = {
  id?: number;
  scope: string; // "new" | "new-task" | pactId
  title: string;
  description: string;
  duePreset: string;
  evidenceRequired: boolean;
  asPersonalTask: boolean;
  tone: string;
  pactId: string;
  assigneeId: string;
  isRecurring: boolean;
  recurrenceRule: string;
  updatedAt: number;
};

export type PendingCheckIn = {
  id?: number;
  commitmentId: string;
  signal: string;
  note: string;
  blockerType?: string;
  createdAt: number;
  lastError?: string;
};

const db = new Dexie("pact-offline") as Dexie & {
  checkInDrafts: EntityTable<CheckInDraft, "id">;
  createDrafts: EntityTable<CreateDraft, "id">;
  pendingCheckIns: EntityTable<PendingCheckIn, "id">;
};

db.version(1).stores({
  checkInDrafts: "++id, commitmentId, updatedAt",
});

db.version(2).stores({
  checkInDrafts: "++id, commitmentId, updatedAt",
  createDrafts: "++id, scope, updatedAt",
  pendingCheckIns: "++id, commitmentId, createdAt",
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

export async function saveCreateDraft(
  scope: string,
  values: Omit<CreateDraft, "id" | "scope" | "updatedAt">
) {
  const existing = await db.createDrafts.where("scope").equals(scope).first();
  const row = { ...values, scope, updatedAt: Date.now() };
  if (existing?.id != null) {
    await db.createDrafts.update(existing.id, row);
    return existing.id;
  }
  return await db.createDrafts.add(row);
}

export async function readCreateDraft(scope: string) {
  return await db.createDrafts.where("scope").equals(scope).first();
}

export async function clearCreateDraft(scope: string) {
  await db.createDrafts.where("scope").equals(scope).delete();
}

export async function enqueuePendingCheckIn(input: {
  commitmentId: string;
  signal: string;
  note: string;
  blockerType?: string;
  lastError?: string;
}) {
  return await db.pendingCheckIns.add({
    ...input,
    createdAt: Date.now(),
  });
}

export async function listPendingCheckIns() {
  return await db.pendingCheckIns.orderBy("createdAt").toArray();
}

export async function clearPendingCheckIn(id: number) {
  await db.pendingCheckIns.delete(id);
}

export async function updatePendingCheckInError(id: number, lastError: string) {
  await db.pendingCheckIns.update(id, { lastError });
}
