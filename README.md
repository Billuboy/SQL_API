# API with MySQL and Prisma
_Express API with MySQL as database and Prisma as ORM with input validation and JWT Authentication._

## A word about Prisma
_Prisma is an ORM, which makes it easier to work with databases by making object type queries. You can also view every change occur in database with Prisma Migrate. Prisma also provides Prisma Studio, which gives user the power to see all the data and relations with a GUI._

## TechStack Used
<img src="https://www.vectorlogo.zone/logos/nodejs/nodejs-icon.svg" alt="node" width="40" height="40"/><img src="https://www.vectorlogo.zone/logos/mysql/mysql-official.svg" alt="node" width="40" height="40"/> <img src="https://www.vectorlogo.zone/logos/typescriptlang/typescriptlang-icon.svg" alt="node" width="40" height="40"/>

## Platform Requriements

1. Latest version of Nodejs LTS
2. Postman(Desktop App) or ThunderClient(VS Code Extension) - For testing API

## Quick start

1. Clone this repository
2. `npm install` or `yarn install` in the project root folder on local.
3. Put your SQL database URI, Session Secret, DB name and DB password inside of `.env`.
4. `npm run server` or `yarn server` to start the API on localhost at port 3001.
5. Test endpoints with Postman or ThunderClient.

## NPM Packages Used
1. **TypeScript** - For compiling typescript files back to javascript
2. **TS-Node** -  Creating environment for typescript execution
3. **Prisma** - ORM for MySQL queries 
4. **Express** - Creates an HTTP request listener on localhost
5. **Nodemon** - For restarting server everytime a file changes
6. **Express Session** - For creating express sessions
7. **Express Mysql Session** - For storing sessions in MySQL database
8. **PassportJS** - Nodejs Framework for implementing various authentication strategies
9. **Passport Local** - Passport strategy for creating local strategy 
10. **Yup** - For data validation

## Useful Links
**Prisma** - `http://prisma.io`
**TypeScript** - `http://typescriptlang.org`
 
