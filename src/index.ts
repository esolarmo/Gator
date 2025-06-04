import { readConfig, setUser } from "./config.js";
import { argv } from 'node:process';
import { getUserByName, createUser, deleteUsers, getAllUsers } from "./lib/db/queries/users.js";
import { read } from "node:fs";



type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;
type CommandsRegistry = Record<string, CommandHandler>;



async function handlerLogin(cmdName: string, ...args: string[]): Promise<void> {
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

async function handlerReset(cmdName: string, ...args: string[]): Promise<void> {
    try {
        await deleteUsers();
        console.log("All users deleted");
    } catch (error) {
        console.log("Something went wrong");
        process.exit(1);
    }
}

async function handlerRegister(cmdName: string, ...args: string[]): Promise<void> {
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

async function handlerUsers(cmdName: string, ...args: string[]): Promise<void> {
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