# Auth Flow Service following Clean Architecture principles

## Table of Contents
- [Table of Contents](#table-of-contents)
  - [Requirements](#requirements)
    - [Libs](#libs)
  - [Getting Started](#getting-started-2mn)
  - [Using Docker](#using-docker)
    - [Build Docker Image](#build-docker-image)
    - [Initial Setup](#initial-setup)
    - [Run via Docker Compose](#run-via-docker-compose)
  - [Continuous Deployment](#continuous-deployment)
    - [Instruction Guides](#instruction-guides)
  - [APIs Documentation](#apis-documentation)
  - [Clean Architecture](#clean-architecture)
    - [Folder Structure](#folder-structure)
    - [The Dependency Rule](#the-dependency-rule)
    - [Server, Routes and Plugins](#server-routes-and-plugins)
    - [Controllers (a.k.a Route Handlers)](#controllers-aka-route-handlers)
    - [Use Cases](#use-cases)
  - [Troubleshooting](#troubleshooting)

##### Requirements:
 * Node v14.16

###### Libs
* [Express](https://expressjs.com/)
* [Fastify](https://www.fastify.io/) <em>(optional)</em>
* [MongoDB NodeJS Driver](https://mongodb.github.io/node-mongodb-native/)
* [Tedious](https://tediousjs.github.io/tedious/) <em>(optional)</em>
* [dotenv](https://www.npmjs.com/package/dotenv)

---

## Getting Started (< 2mn)

```
git clone git@github.com:waynecheah/auth-service.git
cd auth-service
cp .env.example .env
npm install
npm start
```
You should get
```
MongoDB on mongo-db connected
Server is listening on http://0.0.0.0:4000
```
In a browser, open http://localhost:4000.

---

## Using Docker

### Build Docker Image
```
cp .env.example .env
docker-compose build
```

### Initial Setup
```
docker run -it --rm \
--name setup-auth-service \
-e NODE_ENV=development \
-v "$(pwd)":/home/api \
--network my_app_net \
-p 4000:4000 \
auth-service:1.0.1 npm install
```

### Run via Docker Compose
```
docker-compose up -d
```

---

## Continuous Deployment

You can automate the deployment of Auth Flow Service to <a href="https://cloud.google.com/run/docs">Cloud Run</a> by creating <a href="https://cloud.google.com/build/docs">Cloud Build triggers</a> at <a href="https://cloud.google.com/">Google Cloud Platform</a>. You can configure your triggers to build and deploy docker image whenever you update your source code and commit to the main branch.

#### Instruction Guides:
1. <a href="https://cloud.google.com/billing/docs/how-to/modify-project">Enable billing for Cloud project</a>
2. <a href="https://cloud.google.com/build/docs/deploying-builds/deploy-cloud-run#before_you_begin">Enable all required service APIs</a>
3. <a href="https://cloud.google.com/build/docs/automating-builds/create-github-app-triggers">Creating GitHub App triggers</a>
4. <a href="https://cloud.google.com/build/docs/configuring-builds/substitute-variable-values?_ga=2.157475192.-372591699.1609419431">Set environment variables according to</a> <a href="./.env.example"><code>.env.example</code></a>
5. <a href="https://github.com/settings/installations">Double check if Google Cloud Build is authorized</a>
6. Checkout source code to main branch and push commit to Github
---

## APIs Documentation

* <a href="https://documenter.getpostman.com/view/95999/TzJu8xAy#c9e548fa-0b11-480e-9c05-ccc243c0da6b"><code><b>Auth</b></code></a>
  * <a href="https://documenter.getpostman.com/view/95999/TzJu8xAy#7d59ab49-1f53-4385-93d8-b6d8c6df0c63"><code>New Signup</code></a>
  * <a href="https://documenter.getpostman.com/view/95999/TzJu8xAy#39dacbfc-7017-4eba-8c2f-b306ea37bfad"><code>User Login</code></a>
* <a href="https://documenter.getpostman.com/view/95999/TzJu8xAy#3392c8d5-f372-4345-b225-9b0c8c577b84"><code>Permission</code></a>
  * <a href="https://documenter.getpostman.com/view/95999/TzJu8xAy#2984cf92-bc3c-4fcf-af3f-df9b90cca96c"><code>Create Permission</code></a>
  * <a href="https://documenter.getpostman.com/view/95999/TzJu8xAy#d2b53ad0-10cd-4fb7-a599-00d6d6c52bc0"><code>Get Permissions</code></a>
* <a href="https://documenter.getpostman.com/view/95999/TzJu8xAy#1bc879b0-9fc7-4bd5-9efc-6adf54faa14e"><code>Role</code></a>
  * <a href="https://documenter.getpostman.com/view/95999/TzJu8xAy#8abf2007-03a8-4150-adb9-a77d0cf10d13"><code>Create Role</code></a>
  * <a href="https://documenter.getpostman.com/view/95999/TzJu8xAy#8264fd99-c330-4eed-ab5a-f7aea54a7aa9"><code>Get Roles</code></a>
* <a href="https://documenter.getpostman.com/view/95999/TzJu8xAy#e9cd4897-c756-43d9-8017-6b25bf6024da"><code>User</code></a>
  * <a href="https://documenter.getpostman.com/view/95999/TzJu8xAy#fbd14581-9bd8-41c6-a0e9-fccbe5ed290f"><code> Add Roles to User</code></a>
  * <a href="https://documenter.getpostman.com/view/95999/TzJu8xAy#d1c14b58-ca9c-4908-954c-361fb71236d6"><code>Check User Permission</code></a>
  * <a href="https://documenter.getpostman.com/view/95999/TzJu8xAy#261e772e-521b-4db4-9a06-7a2fd7a9e56e"><code>Get User Roles</code></a>

---

## Clean Architecture

The application follows the Uncle Bob "Clean Architecture" principles and project structure :
![Cleab Architecture](https://blog.cleancoder.com/uncle-bob/images/2012-08-13-the-clean-architecture/CleanArchitecture.jpg)

### Folder Structure
```
[auth-service]
    └ [application]           → Application services layer
        └ [usecases]          → Application business rules
            └ index.js        → Entry for all use cases
    └ [domain]                → Enterprise core business layer such as domain model objects (Aggregates, Entities, Value Objects) and repository interfaces
    └ [infrastructure]        → Frameworks, drivers and tools such as Database, the Web Framework, mailing/logging/glue code etc.
        └ [config]            → Application configuration files, modules and services
            └ bootstrap.js    → Bootstrap and initial all service dependency injection implementations by environment
        └ [database]          → Database ORMs middleware
            └ mongodb.js      → MongoDB connector
            └ mssql.js        → MS SQL connector
        └ [repositories]      → Implementation of domain repository interfaces
            └ [mongodb]       → MongoDB repositories
                └ index.js    → Entry for all MongoDB repositories
            └ [mssql]         → MS SQL repositories
                └ index.js    → Entry for all MS SQL repositories
        └ [webserver]         → Web server configuration (server, routes, plugins, etc.)
            └ express.js      → Express server definition
            └ fastify.js      → Fastify server definition
    └ [interface]             → Interface Adapters and formatters for use cases and entities to external agency such as Database or the Web
        └ [controllers]       → Server route definitions & handlers
            └ index.js        → Entry for all controllers
    └ [node_modules]          → NPM dependencies (auto generated with npm install)
    └ [test]                  → Source folder for unit or functional tests
    └ index.js                → Main application entry point
 ```

### The Dependency Rule
>The overriding rule that makes this architecture work is The Dependency Rule. This rule says that source code dependencies can only point inwards. Nothing in an inner circle can know anything at all about something in an outer circle. In particular, the name of something declared in an outer circle must not be mentioned by the code in the an inner circle. That includes, functions, classes. variables, or any other named software entity.

Extracted from https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html#the-dependency-rule

### Server, Routes and Plugins
Server, routes and plugins can be considered as "plumbery-code" that exposes the API to the external world, via an instance of server. 

The role of the server is to intercept the HTTP request and match the corresponding route.

Routes are configuration objects whose responsibilities are to check the request format and params, and then to call the good controller (with the received request). They are registered as Plugins.

Plugins are configuration object that package an assembly of features (ex: authentication & security concerns, routes, pre-handlers, etc.) and are registered at the server startup.    

### Controllers (a.k.a Route Handlers)
Controllers are the entry points to the application context.

They have 3 main responsibilities :

1. Extract the parameters (query or body) from the request
2. Call the good Use Case (application layer)
3. Return an HTTP response (with status code and serialized data)

### Use Cases
A use case is a business logic unit.

It is a class that must have an `execute` method which will be called by controllers.

It may have a constructor to define its dependencies (concrete implementations - a.k.a. _adapters_ - of the _port_ objects) or its execution context.

**Be careful! A use case must have only one precise business responsibility!**

A use case can call objects in the same layer (such as data repositories) or in the domain layer.

---

## Troubleshooting

#### I'm getting `EADDRINUSE` upon application start
You need port `4000` to be free in order to boot up the application. Check if it's already in use and shut the application down before you `npm start` again

#### Can’t run script file in Docker, no such file or directory
By running the following command in terminal `docker exec -it auth-flow-service sh` to see if something unusual is happening inside docker container
