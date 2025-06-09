import { readConfig, setUser } from "./config.js";
import { argv } from 'node:process';
import { getUserByName, createUser, deleteUsers, getAllUsers } from "./lib/db/queries/users.js";
import { read } from "node:fs";
import { handlerAgg, handlerLogin, handlerRegister, handlerReset, handlerUsers, handlerAddFeed, handlerFeeds, handlerFollow, handlerUnfollow, handlerFollowing } from "./handlers";
import { User } from "./lib/db/queries/feeds.js";


type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;
type CommandsRegistry = Record<string, CommandHandler>;
type UserCommandHandler = (
  cmdName: string,
  user: User,
  ...args: string[]
) => Promise<void>;
type middlewareLoggedIn = (handler: UserCommandHandler) => CommandHandler;


export function middlewareLoggedIn(handler: 
    UserCommandHandler,
): CommandHandler {
  return async (cmdName: string, ...args: string[]): Promise<void> => {
    const config = readConfig();
    const userName = config.currentUserName;
    if (!userName) {
      throw new Error("User not logged in");
    }

    const user = await getUserByName(userName);
    if (!user) {
      throw new Error(`User ${userName} not found`);
    }

    await handler(cmdName, user, ...args);
  };
}


async function registerCommand(registry: CommandsRegistry, cmdName: string, handler: CommandHandler) {
    registry[cmdName] = handler;
}

async function runCommand(registry: CommandsRegistry, cmdName: string, ...args: string[]) {
    if (registry[cmdName]) {
        await registry[cmdName](cmdName, ...args);
        return;
    } else {
        console.log("Unknown command");
    }
}

async function main() {
    try {
        const registry = <CommandsRegistry>{};
        registerCommand(registry, "login", handlerLogin);
        registerCommand(registry, "register", handlerRegister);
        registerCommand(registry, "reset", handlerReset);
        registerCommand(registry, "users", handlerUsers);
        registerCommand(registry, "agg", handlerAgg);
        registerCommand(registry, "feeds", handlerFeeds);
        registerCommand(registry, "addfeed", middlewareLoggedIn(handlerAddFeed));
        registerCommand(registry, "follow", middlewareLoggedIn(handlerFollow));
        registerCommand(registry, "unfollow", middlewareLoggedIn(handlerUnfollow));
        registerCommand(registry, "following", middlewareLoggedIn(handlerFollowing));

        const args = process.argv;
        const command = args[2];
        const additionalArgs = args.slice(3);
        
        if (args.length < 3) {
            console.log("Not enough arguments");
            process.exit(1);
        }

        await runCommand(registry, command, ...additionalArgs);
        
    } catch (error) {
        console.error("Error in main:", error); // Add this
        process.exit(1);
    }

    process.exit(0);
}

main();