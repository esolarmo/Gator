import { db } from "..";
import { users } from "../schema";
import { eq, lt, gte, ne } from 'drizzle-orm';

export async function createUser(name: string) {
  const [result] = await db.insert(users).values({ name: name }).returning();
  return result;
}

export async function getUserByName(name: string) {
  const [result] = await db.select().from(users).where(eq(users.name, name));
  return result;
}

export async function deleteUsers() {
  await db.delete(users).returning();
}

export async function getAllUsers() {
  const result = await db.select({ name: users.name }).from(users);
  return result;  
}