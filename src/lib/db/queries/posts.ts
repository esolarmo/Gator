import { db } from "..";
import { users, feeds, feed_follows, posts } from "../schema";
import { type InferSelectModel, type InferInsertModel } from 'drizzle-orm'
import { eq, lt, gte, ne, and, sql, asc, desc } from 'drizzle-orm';

export type Post = typeof posts.$inferSelect; 


export async function createPost(post: Post) {
    const [PostExists] = await db.select().from(posts).where(eq(posts.url, post.url));
    if (PostExists) {
        console.log("Feed already exists");
        return;
    }
    const response = await db.insert(posts).values(
        { title: post.title, url: post.url, description: post.description, feed_id: post.feed_id })
        .returning();

}
