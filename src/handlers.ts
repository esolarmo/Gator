import { setUser, readConfig } from "./config";
import { getUserByName, deleteUsers, createUser, getAllUsers } from "./lib/db/queries/users";
import { createFeed, printAllFeeds, createFeedFollow, getFeedFollowsForUser, feedUnfollow, fetchFeed, scrapeFeeds } from "./lib/db/queries/feeds";
import { User } from "./lib/db/queries/feeds.js";
import { Post, getPostsForUser } from "./lib/db/queries/posts";

export async function handlerLogin(cmdName: string, ...args: string[]): Promise<void> {
    if (args.length === 0) {
        console.log("Username required");
        process.exit(1);
    }
    const name = args[0];
    const userExists = await getUserByName(name);
    if (!userExists) {
        console.log("Username does not exist");
        process.exit(1);
    }

    setUser(args[0]);
    console.log("User has been set")
    return;
}

export async function handlerReset(_: string): Promise<void> {
    try {
        await deleteUsers();
        console.log("All users deleted");
    } catch (error) {
        console.log("Something went wrong");
        process.exit(1);
    }
}

export async function handlerRegister(cmdName: string, ...args: string[]): Promise<void> {
    if (args.length === 0) {
        throw new Error("Username required");
    }
    const name = args[0];
    //console.log(`Name: ${name}`);
    const userExists = await getUserByName(name);
    //console.log("getUserByName returned:", userExists);
    if (userExists) {
        console.log("User already exists");
        process.exit(1);
    }
    const data = await createUser(name);
    setUser(name);
    console.log(`User ${name} created`)
    //console.log(data);
    return;

}

export async function handlerUsers(cmdName: string, ...args: string[]): Promise<void> {
    const currentUser = readConfig().currentUserName;
    const users = await getAllUsers();
    //console.log(users);
    if (users.length === 0) {
        console.log("No users found!");
        process.exit(1);
    }
    for (let user of users) {
        if (user.name === currentUser) {
            console.log(`* ${user.name} (current)`);
        } else {
            console.log(`* ${user.name}`);
        }
    }

}

export async function handlerAgg(cmdName: string, timeBetweenRegs: string, ...args: string[]): Promise<void> {
    if (!timeBetweenRegs) {
        throw new Error("Provide a time interval");
    }

    const timeBetweenRequests = parseDuration(timeBetweenRegs);
    scrapeFeeds().catch(handleError);
    
    const interval = setInterval(() => {
        scrapeFeeds().catch(handleError);
    }, timeBetweenRequests);


    await new Promise<void>((resolve) => {
        process.on("SIGINT", () => {
        console.log("Shutting down feed aggregator...");
        clearInterval(interval);
        resolve();
        });
    });

}

export async function handlerBrowse(_: string, user: User, ...args: string[]) {
    let limit = 2;
    if (args[0]) {
        limit = Number(args[0]);
    }
    const posts: Post[] = await getPostsForUser(user, limit);

    console.log(posts);

}

function handleError(error: Error) {
    console.log(`Error: ${error.message}`);
}

function parseDuration(durationStr: string): number {
    const regex = /^(\d+)(ms|s|m|h)$/;
    const match = durationStr.match(regex);
    if (match) {
        const number = Number(match[1]);
        if (match[2] === "h") {
            return number * 60 * 60 * 1000;
        } else if (match[2] === "m") {
            return number * 60 * 1000;
        } else if (match[2] === "s") {
            return number * 1000;
        } else if (match[2] === "ms") {
            return number;
        }

    }
    return 0;
}

export async function handlerAddFeed(cmdName: string, user: User, ...args: string[]): Promise<void> {
    if (args.length < 2) {
        console.log("Invalid parameters");
        process.exit(1);
    }
    const currentUser = user.name;
    const name = args[0];
    const url = args[1];
    const feed = await createFeed(name, url, currentUser);
    const follow = await createFeedFollow(url, currentUser);
    console.log(`Feed added:`);
    console.log(` * Feed name: ${follow.feeds.name}`);
    console.log(` * User name: ${follow.users.name}`);
    return;
}

export async function handlerFeeds(cmdName: string, ...args: string[]): Promise<void> {
    await printAllFeeds();
}

export async function handlerFollow(_: string, user: User, ...args: string[]): Promise<void> {

    const currentUser = user.name;
    const url = args[0];
    const result = await createFeedFollow(url, currentUser);
    console.log(`Following a feed`);
    console.log(`* Feed name: ${result.feeds.name}`);
    console.log(`* User name: ${result.users.name}`);
    
}

export async function handlerFollowing(_: string, user: User): Promise<void> {
    const currentUser = user.name;
    const result = await getFeedFollowsForUser(currentUser);
    if (result.length === 0) {
        console.log(`No feeds followed by user ${currentUser}`);
        return;
    }

    console.log(`User ${currentUser} is following:`);
    for (let r of result) {
        console.log(` * ${r.feeds.name}`);
    }
    

}

export async function handlerUnfollow(_: string, user: User, ...args: string[]): Promise<void> {
    if (!args) {
        throw new Error("No feed URL provided");
    }
    
    const url = args[0];
    const response = await feedUnfollow(user, url);

    console.log(`Feed ${url} unfollowed`);


}