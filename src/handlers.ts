import { setUser, readConfig } from "./config";
import { getUserByName, deleteUsers, createUser, getAllUsers } from "./lib/db/queries/users";
import { fetchFeed } from "./feed";
import { createFeed, printAllFeeds, createFeedFollow, getFeedFollowsForUser } from "./lib/db/queries/feeds";

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

export async function handlerReset(cmdName: string, ...args: string[]): Promise<void> {
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

export async function handlerAgg(cmdName: string, ...args: string[]): Promise<void> {
    const feed = await fetchFeed("https://www.wagslane.dev/index.xml");

    console.log(JSON.stringify(feed, null, 2));

}

export async function handlerAddFeed(cmdName: string, ...args: string[]): Promise<void> {
    if (args.length < 2) {
        console.log("Invalid parameters");
        process.exit(1);
    }
    const currentUser = readConfig().currentUserName;
    const name = args[0];
    const url = args[1];
    const feed = await createFeed(name, url, currentUser);
    
}

export async function handlerFeeds(cmdName: string, ...args: string[]): Promise<void> {
    await printAllFeeds();
}

export async function handlerFollow(cmdName: string, ...args: string[]): Promise<void> {
    if (args.length < 1) {
        console.log("Invalid parameters");
        process.exit(1);
    }
    const currentUser = readConfig().currentUserName;
    const url = args[0];
    const result = await createFeedFollow(url, currentUser);
    console.log(`Following a feed`);
    console.log(`* Feed name: ${result.feeds.name}`);
    console.log(`* User name: ${result.users.name}`);
    
}

export async function handlerFollowing(cmdName: string, ...args: string[]): Promise<void> {
    const currentUser = readConfig().currentUserName;
    await getFeedFollowsForUser(currentUser);

}