import fs from "fs";
import os from "os";
import path from "path";

type Config = {
    dbUrl: string,
    currentUserName: string,
}

export function setUser(userName: string): void {
    let config = readConfig();
    if (config) {
        console.log(`Setting username: ${userName}`);
        config!.currentUserName = userName;
        writeConfig(config!);
    }
}

export function readConfig(): Config {
    const path = getConfigFilePath();
    //console.log(`Reading from path: ${path}`);
    const fileContent = fs.readFileSync(path, "utf8");
    const config = validateConfig(fileContent);
    return config;
}

function getConfigFilePath(): string {
    return path.join(os.homedir(), ".gatorconfig.json");
}

function writeConfig(cfg: Config): void {
    const data = { "db_url": cfg.dbUrl, "current_user_name": cfg.currentUserName };
    fs.writeFileSync(getConfigFilePath(), JSON.stringify(data));
}

function validateConfig(rawConfig: any): Config {
    const raw = JSON.parse(rawConfig);
    let config = <Config>{};
    config.dbUrl = raw?.db_url;
    config.currentUserName = raw?.current_user_name;
    return config;

}