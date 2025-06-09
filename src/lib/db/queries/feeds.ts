import { db } from "..";
import { users, feeds, feed_follows } from "../schema";
import { getUserByName } from "./users";
import { Post, createPost } from "./posts";
import { type InferSelectModel, type InferInsertModel } from 'drizzle-orm'
import { eq, lt, gte, ne, and, sql, asc, desc } from 'drizzle-orm';
import { XMLParser } from "fast-xml-parser";


type RSSFeed = {
  channel: {
    title: string;
    link: string;
    description: string;
    item: RSSItem[];
  };
};

type RSSItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
};

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

export async function markFeedFetched(id: string) {
    await db.update(feeds).set({ lastFetchedAt: sql`NOW()` }).where(eq(feeds.id, id));
}

export async function getNextFeedToFetch() {
    let result: Feed[] = [<Feed>{}];

    result = await db.select().from(feeds).orderBy(sql`${feeds.lastFetchedAt} asc nulls first`);

    if (result.length > 0) {
        return result[0];
    }
   
}

export async function scrapeFeeds() {
    const nextFeed = await getNextFeedToFetch();
    if (!nextFeed) {
        console.log("No feeds added");
        return;
    }
    await markFeedFetched(nextFeed.id);
    const feed = await fetchFeed(nextFeed.url);
    //printFeedTitles(feed.channel.item);
    await createFeedPosts(feed.channel.item, nextFeed);
    
}

function printFeedTitles(items: RSSItem[]) {
    console.log("--- Feed titles ---");
    for (let item of items) {
        console.log(`* ${item.title}`);
    }
}

async function createFeedPosts(items: RSSItem[], feed: Feed) {
    console.log("--- Creating posts ---");
    for (let item of items) {
        const timestamp = Date.parse(item.pubDate);
        const date = new Date(timestamp);
        await createPost(item.title, item.link, item.description, date, feed);
        //console.log(`* ${item.title}`);
    }
}

export async function fetchFeed(feedURL: string) {
    const response = await fetch(feedURL, {
        method: "GET",
        headers: {
            "User-Agent": "gator",
        },
    });
    const responseText = await response.text();
    const parser = new XMLParser();

    const feed = parser.parse(responseText);
    //console.log(feed);
    let rssFeed = <RSSFeed>{ channel: {}};

    if (!feed.rss.channel) {
        console.log("RSS Channel missing!");
        process.exit(1);
    } 

    if (feed.rss.channel.title && feed.rss.channel.link && feed.rss.channel.description) {
        rssFeed.channel.title = feed.rss.channel.title;
        rssFeed.channel.link = feed.rss.channel.link;
        rssFeed.channel.description = feed.rss.channel.description;
    }
    rssFeed.channel.item = [];
    if (Array.isArray(feed.rss.channel.item)) {
        for (let i of feed.rss.channel.item) {
            if (i.title && i.link && i.description && i.pubDate) {
                rssFeed.channel.item.push(<RSSItem>{
                    title: i.title,
                    link: i.link,
                    description: i.description,
                    pubDate: i.pubDate,
                });
            }
        }
    } 


   return rssFeed;

}
