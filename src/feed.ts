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

