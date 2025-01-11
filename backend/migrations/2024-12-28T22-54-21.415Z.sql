-- drop table "session";
-- drop table "verification";
-- drop table "account";
-- drop table "user";


create table "user" (
  "id" serial primary key,
  "name" text not null,
  "email" text not null unique,
  "emailVerified" boolean not null,
  "airbyteWsId" text unique not null,
  "image" text,
  "createdAt" timestamp not null default now(),
  "updatedAt" timestamp not null
);
create table "session" (
  "id" serial primary key,
  "expiresAt" timestamp not null,
  "token" text not null unique,
  "createdAt" timestamp not null,
  "updatedAt" timestamp not null,
  "ipAddress" text,
  "userAgent" text,
  "userId" integer not null references "user" ("id")
);
create table "account" (
  "id" serial primary key,
  "accountId" text not null,
  "providerId" text not null,
  "userId" integer not null references "user" ("id"),
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamp,
  "refreshTokenExpiresAt" timestamp,
  "scope" text,
  "password" text,
  "createdAt" timestamp not null default now(),
  "updatedAt" timestamp not null,
  CONSTRAINT "unique_connections" UNIQUE ("userId", "providerId", "accountId")
);
create table "verification" (
  "id" serial primary key,
  "identifier" text not null,
  "value" text not null,
  "expiresAt" timestamp not null,
  "createdAt" timestamp not null default now(),
  "updatedAt" timestamp
);