import { db } from "..";
import { users, feeds, feed_follows, posts } from "../schema";
import { type InferSelectModel, type InferInsertModel } from 'drizzle-orm'
import { eq, lt, gte, ne, and, sql, asc, desc } from 'drizzle-orm';
import { User, Feed } from "./feeds";

export type Post = typeof posts.$inferSelect; 


export async function createPost(title: string, url: string, description: string, publishedAt: Date, feed: Feed) {
    const [PostExists] = await db.select().from(posts).where(eq(posts.url, url));
    if (PostExists) {
        //console.log("Feed already exists");
        return;
    }
    const response = await db.insert(posts).values(
        { title: title, url: url, description: description, publishedAt: publishedAt, feed_id: feed.id })
        .returning();

}

export async function getPostsForUser(user: User, number: number) {
    const sq = db.select({id: feed_follows.feed_id}).from(feed_follows).where(eq(feed_follows.user_id, user.id));
    const result = await db.select().from(posts).where(sql`${posts.feed_id} in (${sq})`).orderBy(desc(posts.publishedAt)).limit(number);

    return result;    
    // select * from posts where feed_id in (select feed_id from feed_follows where user_id = user.id)
}