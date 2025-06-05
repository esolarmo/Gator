import { db } from "..";
import { users, feeds, feed_follows } from "../schema";
import { getUserByName } from "./users";
import { type InferSelectModel, type InferInsertModel } from 'drizzle-orm'
import { eq, lt, gte, ne, and } from 'drizzle-orm';

export type Feed = typeof feeds.$inferSelect; 
export type User = typeof users.$inferSelect; 

export async function createFeed(name: string, url: string, userName: string) {
    const [FeedExists] = await db.select().from(feeds).where(eq(feeds.url, url));
    if (FeedExists) {
        console.log("Feed already exists");
        process.exit(1);
    }
    const user = await getUserByName(userName);
    const [result] = await db.insert(feeds).values({ name: name, url: url, user_id: user.id }).returning();
    //console.log("New Feed added");
    //await printFeed(result, user);
    return;
}

export async function printFeed(feed: Feed, user: User) {
    console.log(`Feed id: ${feed.id}`);
    console.log(`Feed name: ${feed.name}`);
    console.log(`Feed URL: ${feed.url}`);
    console.log(`Feed created at: ${feed.createdAt}`);
    console.log(`Username: ${user.name}`);
    console.log(`---`);
}

export async function printAllFeeds() {
    const result = await db.select().from(feeds).innerJoin(users, eq(users.id, feeds.user_id));
    if (!result) {
        console.log("No feeds found");
        process.exit(1);
    }
    for (let r of result) {
        await printFeed(r.feeds, r.users);
    }

}

export async function getFeedByURL(url: string) {
  const [result] = await db.select().from(feeds).where(eq(feeds.url, url));
  return result;
}

export async function createFeedFollow(url: string, userName: string) {
    const user = await getUserByName(userName);
    const feed = await getFeedByURL(url);
    if (!feed) {
        throw new Error("Feed not found");
    }
    const [exists] = await db.select().from(feed_follows).where(and(eq(feed_follows.feed_id, feed.id), eq(feed_follows.user_id, user.id)));
    if (exists) {
        throw new Error(`Already following ${url} for user ${user.name}`);
    }
    
    const [newRow] = await db.insert(feed_follows).values({ user_id: user.id, feed_id: feed.id }).returning();

    const [result] = await db.select().from(feed_follows)
        .innerJoin(users, eq(users.id, newRow.user_id))
        .innerJoin(feeds, eq(feeds.id, newRow.feed_id));
    
    //console.log(result);
    return result;
}

export async function getFeedFollowsForUser(userName: string) {
    const user = await getUserByName(userName);
    const result = await db.select().from(feed_follows)
        .innerJoin(users, eq(feed_follows.user_id, users.id))
        .innerJoin(feeds, eq(feed_follows.feed_id, feeds.id))
        .where(eq(users.id, user.id));

    return result;
}

export async function feedUnfollow(user: User, url: string) {
    const feed = await getFeedByURL(url);
    const [result] = await db.delete(feed_follows).where(and(eq(feed_follows.feed_id, feed.id ), eq(feed_follows.user_id, user.id))).returning();
}