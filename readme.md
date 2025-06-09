# Gator

### The ultimate RSS aggregator! 

## Requirements

- PostgreSQL server
- NVM
- Drizzle ORM

## Setup

- Clone the repository
- `npm install -D typescript @types/node tsx`
- `sudo apt update`
- `sudo apt install postgresql postgresql-contrib`
- `npm i drizzle-orm postgres`
- `npm i -D drizzle-kit`
- Create a database called 'gator'

Create ~/gatorconfig.json with following content (change username and password to match an existing user)
```
{
  "db_url": "postgres://user:password@localhost:5432/gator"
}
``` 

- Run "npm run generate" followed by "npm run migrate"

## Usage

You can use CLI commands to use the program. Use "npm run start" first and add the commands.

Supported commands:
- register [username]
- login [username]
- reset
- users
- agg [interval]
- feeds
- addfeed [name] [url]
- follow [url]
- unfollow [url]
- following
- browse [number_of_posts]