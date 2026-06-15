import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SQLite from "expo-sqlite";
import {
  createInitialLocalAppState,
  type AiActionLog,
  type Contact,
  type Expense,
  type ExpenseSplit,
  type Group,
  type LocalAppState,
  type Settlement,
  validateLocalAppState,
} from "@splitmaa/core";

export const splitmaaStorageKey = "splitmaa.localAppState.v1";
const databaseName = "splitmaa.db";
const databaseVersion = 2;
const migratedMetadataKey = "async_storage_migrated";

export type PersistenceLoadResult = {
  state: LocalAppState;
  source: "storage" | "seed" | "recovered";
};

type Database = SQLite.SQLiteDatabase;

type MetadataRow = {
  key: string;
  value: string;
};

type ContactRow = Omit<Contact, "aliases">;
type GroupRow = Omit<Group, "memberIds">;
type GroupMemberRow = {
  groupId: string;
  contactId: string;
  position: number;
};
type ExpenseRow = Omit<Expense, "splitWithContactIds" | "splits">;
type ExpenseSplitContactRow = {
  expenseId: string;
  contactId: string;
  position: number;
};
type ExpenseSplitRow = ExpenseSplit & {
  expenseId: string;
  position: number;
};

let dbPromise: Promise<Database> | undefined;

export async function loadLocalAppState(): Promise<PersistenceLoadResult> {
  const db = await openSplitmaaDb();
  const migrationSource = await migrateAsyncStorageOnce(db);
  const loaded = await readState(db);

  if (loaded) {
    return {
      state: loaded,
      source: migrationSource ?? "storage",
    };
  }

  const seed = createInitialLocalAppState();
  await writeState(db, seed);
  return {
    state: seed,
    source: migrationSource === "recovered" ? "recovered" : "seed",
  };
}

export async function saveLocalAppState(state: LocalAppState): Promise<void> {
  const validated = validateLocalAppState(state);
  const db = await openSplitmaaDb();
  await writeState(db, validated);
}

export async function clearLocalAppState(): Promise<void> {
  const db = await openSplitmaaDb();
  await db.withExclusiveTransactionAsync(async (tx) => {
    await clearWorkflowTables(tx);
  });
  await writeState(db, createInitialLocalAppState());
}

async function openSplitmaaDb(): Promise<Database> {
  dbPromise ??= SQLite.openDatabaseAsync(databaseName).then(async (db) => {
    await migrateSchema(db);
    return db;
  });
  return dbPromise;
}

async function migrateSchema(db: Database): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  const currentVersion = row?.user_version ?? 0;
  if (currentVersion >= databaseVersion) return;

  await db.execAsync("PRAGMA journal_mode = WAL");
  await db.withExclusiveTransactionAsync(async (tx) => {
    if (currentVersion === 0) {
      await tx.execAsync(`
        CREATE TABLE IF NOT EXISTS metadata (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS contacts (
          id TEXT PRIMARY KEY NOT NULL,
          displayName TEXT NOT NULL,
          normalizedDisplayName TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          notes TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS contact_aliases (
          contactId TEXT NOT NULL,
          alias TEXT NOT NULL,
          position INTEGER NOT NULL,
          PRIMARY KEY (contactId, alias),
          FOREIGN KEY (contactId) REFERENCES contacts(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS groups (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          defaultCurrency TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS group_members (
          groupId TEXT NOT NULL,
          contactId TEXT NOT NULL,
          position INTEGER NOT NULL,
          PRIMARY KEY (groupId, contactId),
          FOREIGN KEY (groupId) REFERENCES groups(id) ON DELETE CASCADE,
          FOREIGN KEY (contactId) REFERENCES contacts(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS expenses (
          id TEXT PRIMARY KEY NOT NULL,
          groupId TEXT,
          description TEXT NOT NULL,
          amountCents INTEGER NOT NULL,
          currency TEXT NOT NULL,
          category TEXT NOT NULL,
          paymentType TEXT NOT NULL,
          paidByContactId TEXT NOT NULL,
          source TEXT NOT NULL,
          expenseDate TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          FOREIGN KEY (groupId) REFERENCES groups(id) ON DELETE SET NULL,
          FOREIGN KEY (paidByContactId) REFERENCES contacts(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS expense_split_contacts (
          expenseId TEXT NOT NULL,
          contactId TEXT NOT NULL,
          position INTEGER NOT NULL,
          PRIMARY KEY (expenseId, contactId),
          FOREIGN KEY (expenseId) REFERENCES expenses(id) ON DELETE CASCADE,
          FOREIGN KEY (contactId) REFERENCES contacts(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS expense_splits (
          expenseId TEXT NOT NULL,
          contactId TEXT NOT NULL,
          amountCents INTEGER NOT NULL,
          position INTEGER NOT NULL,
          PRIMARY KEY (expenseId, contactId),
          FOREIGN KEY (expenseId) REFERENCES expenses(id) ON DELETE CASCADE,
          FOREIGN KEY (contactId) REFERENCES contacts(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS settlements (
          id TEXT PRIMARY KEY NOT NULL,
          fromContactId TEXT NOT NULL,
          toContactId TEXT NOT NULL,
          amountCents INTEGER NOT NULL,
          currency TEXT NOT NULL,
          paymentType TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          FOREIGN KEY (fromContactId) REFERENCES contacts(id) ON DELETE CASCADE,
          FOREIGN KEY (toContactId) REFERENCES contacts(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS ai_action_logs (
          id TEXT PRIMARY KEY NOT NULL,
          transcript TEXT NOT NULL,
          parserName TEXT NOT NULL,
          parsedActionType TEXT NOT NULL,
          validationStatus TEXT NOT NULL,
          executionStatus TEXT NOT NULL,
          contextSizeChars INTEGER NOT NULL,
          latencyMs REAL NOT NULL,
          fallbackUsed INTEGER NOT NULL,
          createdAt TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS activity_events (
          id TEXT PRIMARY KEY NOT NULL,
          entityType TEXT NOT NULL,
          entityId TEXT,
          eventType TEXT NOT NULL,
          summary TEXT NOT NULL,
          createdAt TEXT NOT NULL
        );
      `);
    }

    if (currentVersion < 2) {
      await tx.execAsync(`
        CREATE TABLE IF NOT EXISTS workflow_state (
          id TEXT PRIMARY KEY NOT NULL,
          userId TEXT NOT NULL,
          accountId TEXT,
          sessionId TEXT,
          sourceMessageId TEXT,
          workflowType TEXT NOT NULL,
          status TEXT NOT NULL,
          statusReason TEXT,
          originalUserMessage TEXT NOT NULL,
          parsedIntentJson TEXT NOT NULL,
          resolvedEntitiesJson TEXT,
          pendingUiEventJson TEXT,
          resultSnapshotJson TEXT,
          idempotencyKey TEXT NOT NULL UNIQUE,
          schemaVersion TEXT NOT NULL,
          workflowVersion TEXT NOT NULL,
          modelVersion TEXT,
          clientVersion TEXT,
          confirmationTokenHash TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          expiresAt TEXT,
          lockedAt TEXT,
          committedAt TEXT,
          failedAt TEXT,
          cancelledAt TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_workflow_state_user_status
          ON workflow_state(userId, status, updatedAt);

        CREATE TABLE IF NOT EXISTS workflow_audit_logs (
          auditId TEXT PRIMARY KEY NOT NULL,
          workflowId TEXT NOT NULL,
          userId TEXT NOT NULL,
          sourceMessageId TEXT,
          modelVersion TEXT,
          schemaVersion TEXT NOT NULL,
          clientVersion TEXT,
          originalUserMessage TEXT NOT NULL,
          rawModelOutput TEXT,
          validatedIntentJson TEXT NOT NULL,
          resolvedEntitiesJson TEXT,
          uiEventsJson TEXT,
          confirmationSummaryJson TEXT,
          userConfirmationAction TEXT,
          beforeSnapshotJson TEXT,
          afterSnapshotJson TEXT,
          idempotencyKey TEXT NOT NULL,
          commitResult TEXT NOT NULL,
          failureReason TEXT,
          createdAt TEXT NOT NULL,
          FOREIGN KEY (workflowId) REFERENCES workflow_state(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_workflow_audit_workflow
          ON workflow_audit_logs(workflowId, createdAt);
      `);
    }

    await tx.execAsync(`PRAGMA user_version = ${databaseVersion}`);
  });
}

async function migrateAsyncStorageOnce(db: Database): Promise<PersistenceLoadResult["source"] | undefined> {
  const migrated = await getMetadata(db, migratedMetadataKey);
  if (migrated === "true") return undefined;

  const raw = await AsyncStorage.getItem(splitmaaStorageKey);
  if (!raw) {
    await setMetadata(db, migratedMetadataKey, "true");
    return undefined;
  }

  try {
    const state = validateLocalAppState(JSON.parse(raw));
    await writeState(db, state, { markMigrated: true });
    return "storage";
  } catch {
    await writeState(db, createInitialLocalAppState(), { markMigrated: true });
    return "recovered";
  }
}

async function getMetadata(db: Database, key: string): Promise<string | undefined> {
  const row = await db.getFirstAsync<MetadataRow>("SELECT key, value FROM metadata WHERE key = ?", key);
  return row?.value;
}

async function setMetadata(db: Database, key: string, value: string): Promise<void> {
  await db.runAsync(
    "INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)",
    key,
    value,
  );
}

async function readState(db: Database): Promise<LocalAppState | undefined> {
  const metadata = await db.getAllAsync<MetadataRow>("SELECT key, value FROM metadata");
  const metadataMap = new Map(metadata.map((row) => [row.key, row.value]));
  const currentUserContactId = metadataMap.get("currentUserContactId");
  const updatedAt = metadataMap.get("updatedAt");
  if (!currentUserContactId || !updatedAt) return undefined;

  const contacts = await db.getAllAsync<ContactRow>("SELECT * FROM contacts ORDER BY createdAt ASC, displayName ASC");
  const contactAliases = await db.getAllAsync<{ contactId: string; alias: string; position: number }>(
    "SELECT contactId, alias, position FROM contact_aliases ORDER BY position ASC",
  );
  const groups = await db.getAllAsync<GroupRow>("SELECT * FROM groups ORDER BY createdAt ASC, name ASC");
  const groupMembers = await db.getAllAsync<GroupMemberRow>(
    "SELECT groupId, contactId, position FROM group_members ORDER BY position ASC",
  );
  const expenses = await db.getAllAsync<ExpenseRow>("SELECT * FROM expenses ORDER BY createdAt DESC");
  const splitContacts = await db.getAllAsync<ExpenseSplitContactRow>(
    "SELECT expenseId, contactId, position FROM expense_split_contacts ORDER BY position ASC",
  );
  const splits = await db.getAllAsync<ExpenseSplitRow>(
    "SELECT expenseId, contactId, amountCents, position FROM expense_splits ORDER BY position ASC",
  );
  const settlements = await db.getAllAsync<Settlement>("SELECT * FROM settlements ORDER BY createdAt DESC");
  const logs = await db.getAllAsync<Omit<AiActionLog, "fallbackUsed"> & { fallbackUsed: number }>(
    "SELECT * FROM ai_action_logs ORDER BY createdAt DESC",
  );

  return validateLocalAppState({
    schemaVersion: 1,
    currentUserContactId,
    contacts: contacts.map((contact) => ({
      ...contact,
      email: contact.email ?? undefined,
      phone: contact.phone ?? undefined,
      notes: contact.notes ?? undefined,
      aliases: contactAliases
        .filter((alias) => alias.contactId === contact.id)
        .sort((a, b) => a.position - b.position)
        .map((alias) => alias.alias),
    })),
    groups: groups.map((group) => ({
      ...group,
      memberIds: groupMembers
        .filter((member) => member.groupId === group.id)
        .sort((a, b) => a.position - b.position)
        .map((member) => member.contactId),
    })),
    expenses: expenses.map((expense) => ({
      ...expense,
      groupId: expense.groupId ?? undefined,
      splitWithContactIds: splitContacts
        .filter((splitContact) => splitContact.expenseId === expense.id)
        .sort((a, b) => a.position - b.position)
        .map((splitContact) => splitContact.contactId),
      splits: splits
        .filter((split) => split.expenseId === expense.id)
        .sort((a, b) => a.position - b.position)
        .map(({ contactId, amountCents }) => ({ contactId, amountCents })),
    })),
    settlements,
    aiActionLogs: logs.map((log) => ({
      ...log,
      fallbackUsed: Boolean(log.fallbackUsed),
    })),
    updatedAt,
  });
}

async function writeState(
  db: Database,
  state: LocalAppState,
  options: { markMigrated?: boolean } = {},
): Promise<void> {
  const validated = validateLocalAppState(state);

  await db.withExclusiveTransactionAsync(async (tx) => {
    await clearTables(tx);

    await tx.runAsync("INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)", "schemaVersion", "1");
    await tx.runAsync(
      "INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)",
      "currentUserContactId",
      validated.currentUserContactId,
    );
    await tx.runAsync("INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)", "updatedAt", validated.updatedAt);
    if (options.markMigrated) {
      await tx.runAsync("INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)", migratedMetadataKey, "true");
    } else {
      await tx.runAsync(
        "INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)",
        migratedMetadataKey,
        (await getMetadata(tx, migratedMetadataKey)) ?? "true",
      );
    }

    for (const contact of validated.contacts) {
      await tx.runAsync(
        `INSERT INTO contacts
          (id, displayName, normalizedDisplayName, email, phone, notes, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        contact.id,
        contact.displayName,
        contact.normalizedDisplayName,
        contact.email ?? null,
        contact.phone ?? null,
        contact.notes ?? null,
        contact.createdAt,
        contact.updatedAt,
      );
      for (const [position, alias] of contact.aliases.entries()) {
        await tx.runAsync(
          "INSERT INTO contact_aliases (contactId, alias, position) VALUES (?, ?, ?)",
          contact.id,
          alias,
          position,
        );
      }
    }

    for (const group of validated.groups) {
      await tx.runAsync(
        "INSERT INTO groups (id, name, defaultCurrency, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)",
        group.id,
        group.name,
        group.defaultCurrency,
        group.createdAt,
        group.updatedAt,
      );
      for (const [position, contactId] of group.memberIds.entries()) {
        await tx.runAsync(
          "INSERT INTO group_members (groupId, contactId, position) VALUES (?, ?, ?)",
          group.id,
          contactId,
          position,
        );
      }
    }

    for (const expense of validated.expenses) {
      await tx.runAsync(
        `INSERT INTO expenses
          (id, groupId, description, amountCents, currency, category, paymentType, paidByContactId, source, expenseDate, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        expense.id,
        expense.groupId ?? null,
        expense.description,
        expense.amountCents,
        expense.currency,
        expense.category,
        expense.paymentType,
        expense.paidByContactId,
        expense.source,
        expense.expenseDate,
        expense.createdAt,
        expense.updatedAt,
      );
      for (const [position, contactId] of expense.splitWithContactIds.entries()) {
        await tx.runAsync(
          "INSERT INTO expense_split_contacts (expenseId, contactId, position) VALUES (?, ?, ?)",
          expense.id,
          contactId,
          position,
        );
      }
      for (const [position, split] of expense.splits.entries()) {
        await tx.runAsync(
          "INSERT INTO expense_splits (expenseId, contactId, amountCents, position) VALUES (?, ?, ?, ?)",
          expense.id,
          split.contactId,
          split.amountCents,
          position,
        );
      }
    }

    for (const settlement of validated.settlements) {
      await tx.runAsync(
        `INSERT INTO settlements
          (id, fromContactId, toContactId, amountCents, currency, paymentType, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
        settlement.id,
        settlement.fromContactId,
        settlement.toContactId,
        settlement.amountCents,
        settlement.currency,
        settlement.paymentType,
        settlement.createdAt,
      );
    }

    for (const log of validated.aiActionLogs) {
      await tx.runAsync(
        `INSERT INTO ai_action_logs
          (id, transcript, parserName, parsedActionType, validationStatus, executionStatus, contextSizeChars, latencyMs, fallbackUsed, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        log.id,
        log.transcript,
        log.parserName,
        log.parsedActionType,
        log.validationStatus,
        log.executionStatus,
        log.contextSizeChars,
        log.latencyMs,
        log.fallbackUsed ? 1 : 0,
        log.createdAt,
      );
    }
  });
}

async function clearTables(tx: Database): Promise<void> {
  await tx.execAsync(`
    DELETE FROM activity_events;
    DELETE FROM ai_action_logs;
    DELETE FROM settlements;
    DELETE FROM expense_splits;
    DELETE FROM expense_split_contacts;
    DELETE FROM expenses;
    DELETE FROM group_members;
    DELETE FROM groups;
    DELETE FROM contact_aliases;
    DELETE FROM contacts;
    DELETE FROM metadata;
  `);
}

async function clearWorkflowTables(tx: Database): Promise<void> {
  await tx.execAsync(`
    DELETE FROM workflow_audit_logs;
    DELETE FROM workflow_state;
  `);
}
