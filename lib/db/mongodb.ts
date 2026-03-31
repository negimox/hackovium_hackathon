/**
 * MongoDB client for the financial advisor.
 * Handles users, plans, and chat history.
 */

import { MongoClient, Db, Collection, ObjectId } from "mongodb";
import type { FinancialPlan, UserProfile } from "../schemas/financial-plan";

// ══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ══════════════════════════════════════════════════════════════════════════════

const MONGODB_URL = process.env.MONGODB_URL || "mongodb://localhost:27017";
const MONGODB_DATABASE = process.env.MONGODB_DATABASE || "everything_money";

// Singleton client
let client: MongoClient | null = null;
let db: Db | null = null;

// ══════════════════════════════════════════════════════════════════════════════
// CONNECTION
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Get or create the MongoDB client.
 */
export async function getMongoClient(): Promise<MongoClient> {
  if (!client) {
    client = new MongoClient(MONGODB_URL);
    await client.connect();
  }
  return client;
}

/**
 * Get the database instance.
 */
export async function getDb(): Promise<Db> {
  if (!db) {
    const mongoClient = await getMongoClient();
    db = mongoClient.db(MONGODB_DATABASE);
  }
  return db;
}

/**
 * Close the MongoDB connection (for cleanup).
 */
export async function closeConnection(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

export interface UserDocument {
  _id?: ObjectId;
  clerk_user_id: string;
  email?: string;
  created_at: Date;
  updated_at: Date;
  onboarding_completed: boolean;
  profile: Partial<UserProfile>;
  cas_data?: {
    total_mf_value: number;
    funds: Array<{ name: string; value: number; units: number }>;
    uploaded_at: Date;
  };
}

export interface PlanDocument {
  _id?: ObjectId;
  user_id: ObjectId;
  clerk_user_id: string;
  created_at: Date;
  version: number;
  trigger: "onboarding" | "chat_replan" | "manual";
  plan: FinancialPlan;
  token_usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ChatDocument {
  _id?: ObjectId;
  user_id: ObjectId;
  clerk_user_id: string;
  created_at: Date;
  updated_at: Date;
  messages: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    triggered_replan?: boolean;
    profile_updates?: Record<string, unknown>;
  }>;
}

// ══════════════════════════════════════════════════════════════════════════════
// COLLECTIONS
// ══════════════════════════════════════════════════════════════════════════════

async function getUsersCollection(): Promise<Collection<UserDocument>> {
  const db = await getDb();
  return db.collection<UserDocument>("users");
}

async function getPlansCollection(): Promise<Collection<PlanDocument>> {
  const db = await getDb();
  return db.collection<PlanDocument>("plans");
}

async function getChatsCollection(): Promise<Collection<ChatDocument>> {
  const db = await getDb();
  return db.collection<ChatDocument>("chat");
}

// ══════════════════════════════════════════════════════════════════════════════
// USER OPERATIONS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Find user by Clerk ID.
 */
export async function findUserByClerkId(
  clerkUserId: string,
): Promise<UserDocument | null> {
  const collection = await getUsersCollection();
  return collection.findOne({ clerk_user_id: clerkUserId });
}

/**
 * Find user by MongoDB ObjectId.
 */
export async function findUserByMongoId(
  mongoUserId: string,
): Promise<UserDocument | null> {
  const collection = await getUsersCollection();
  return collection.findOne({ _id: new ObjectId(mongoUserId) });
}

/**
 * Find user by either clerk_user_id or MongoDB ObjectId.
 * Auto-detects which type based on format (24 hex chars = ObjectId).
 */
export async function findUser(
  userId: string,
): Promise<UserDocument | null> {
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(userId);
  return isMongoId 
    ? findUserByMongoId(userId) 
    : findUserByClerkId(userId);
}

/**
 * Create a new user.
 */
export async function createUser(
  clerkUserId: string,
  email?: string,
): Promise<UserDocument> {
  const collection = await getUsersCollection();
  const now = new Date();

  const user: UserDocument = {
    clerk_user_id: clerkUserId,
    email,
    created_at: now,
    updated_at: now,
    onboarding_completed: false,
    profile: {},
  };

  const result = await collection.insertOne(user);
  user._id = result.insertedId;

  return user;
}

/**
 * Get or create user by Clerk ID.
 */
export async function getOrCreateUser(
  clerkUserId: string,
  email?: string,
): Promise<UserDocument> {
  const existing = await findUserByClerkId(clerkUserId);
  if (existing) {
    return existing;
  }
  return createUser(clerkUserId, email);
}

/**
 * Update user profile.
 */
export async function updateUserProfile(
  clerkUserId: string,
  profile: Partial<UserProfile>,
): Promise<UserDocument | null> {
  const collection = await getUsersCollection();

  const result = await collection.findOneAndUpdate(
    { clerk_user_id: clerkUserId },
    {
      $set: {
        profile,
        updated_at: new Date(),
        onboarding_completed: true,
      },
    },
    { returnDocument: "after" },
  );

  return result;
}

/**
 * Update specific profile fields (partial update).
 */
export async function patchUserProfile(
  clerkUserId: string,
  updates: Record<string, unknown>,
): Promise<UserDocument | null> {
  const collection = await getUsersCollection();

  // Build update object with dot notation for nested fields
  const updateObj: Record<string, unknown> = {
    updated_at: new Date(),
  };

  for (const [key, value] of Object.entries(updates)) {
    updateObj[`profile.${key}`] = value;
  }

  const result = await collection.findOneAndUpdate(
    { clerk_user_id: clerkUserId },
    { $set: updateObj },
    { returnDocument: "after" },
  );

  return result;
}

/**
 * Save CAS data for a user.
 */
export async function saveUserCASData(
  clerkUserId: string,
  casData: {
    total_mf_value: number;
    funds: Array<{ name: string; value: number; units: number }>;
  },
): Promise<void> {
  const collection = await getUsersCollection();

  await collection.updateOne(
    { clerk_user_id: clerkUserId },
    {
      $set: {
        cas_data: {
          ...casData,
          uploaded_at: new Date(),
        },
        updated_at: new Date(),
      },
    },
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PLAN OPERATIONS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Get latest plan for a user by clerk_user_id.
 */
export async function getLatestPlan(
  clerkUserId: string,
): Promise<PlanDocument | null> {
  const collection = await getPlansCollection();

  return collection.findOne(
    { clerk_user_id: clerkUserId },
    { sort: { created_at: -1 } },
  );
}

/**
 * Get latest plan for a user by MongoDB user_id (ObjectId).
 * For backward compatibility with Python backend.
 */
export async function getLatestPlanByMongoId(
  mongoUserId: string,
): Promise<PlanDocument | null> {
  const collection = await getPlansCollection();

  return collection.findOne(
    { user_id: new ObjectId(mongoUserId) },
    { sort: { version: -1 } },
  );
}

/**
 * Save a new plan.
 */
export async function savePlan(
  clerkUserId: string,
  plan: FinancialPlan,
  trigger: "onboarding" | "chat_replan" | "manual" = "onboarding",
  tokenUsage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  },
): Promise<PlanDocument> {
  const collection = await getPlansCollection();
  const user = await findUserByClerkId(clerkUserId);

  // Get current version
  const latestPlan = await getLatestPlan(clerkUserId);
  const version = (latestPlan?.version || 0) + 1;

  const planDoc: PlanDocument = {
    user_id: user?._id || new ObjectId(),
    clerk_user_id: clerkUserId,
    created_at: new Date(),
    version,
    trigger,
    plan,
    token_usage: tokenUsage,
  };

  const result = await collection.insertOne(planDoc);
  planDoc._id = result.insertedId;

  return planDoc;
}

// ══════════════════════════════════════════════════════════════════════════════
// CHAT OPERATIONS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Get chat history for a user.
 */
export async function getChatHistory(
  clerkUserId: string,
  limit: number = 50,
): Promise<ChatDocument | null> {
  const collection = await getChatsCollection();

  return collection.findOne(
    { clerk_user_id: clerkUserId },
    { sort: { updated_at: -1 } },
  );
}

/**
 * Add a message to chat history.
 */
export async function addChatMessage(
  clerkUserId: string,
  message: {
    role: "user" | "assistant";
    content: string;
    triggered_replan?: boolean;
    profile_updates?: Record<string, unknown>;
  },
): Promise<void> {
  const collection = await getChatsCollection();
  const user = await findUserByClerkId(clerkUserId);

  const chatMessage = {
    ...message,
    timestamp: new Date(),
  };

  // Upsert: create chat doc if doesn't exist, otherwise push message
  await collection.updateOne(
    { clerk_user_id: clerkUserId },
    {
      $setOnInsert: {
        user_id: user?._id || new ObjectId(),
        clerk_user_id: clerkUserId,
        created_at: new Date(),
      },
      $set: {
        updated_at: new Date(),
      },
      $push: {
        messages: {
          $each: [chatMessage],
          $slice: -100, // Keep only last 100 messages
        },
      },
    },
    { upsert: true },
  );
}

/**
 * Get recent chat messages for context.
 */
export async function getRecentMessages(
  clerkUserId: string,
  limit: number = 10,
): Promise<
  Array<{ role: "user" | "assistant"; content: string; timestamp: Date }>
> {
  const chat = await getChatHistory(clerkUserId);

  if (!chat || !chat.messages) {
    return [];
  }

  return chat.messages.slice(-limit).map((m) => ({
    role: m.role,
    content: m.content,
    timestamp: m.timestamp,
  }));
}
