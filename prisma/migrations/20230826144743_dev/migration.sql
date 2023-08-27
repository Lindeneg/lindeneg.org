-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'CONTRIBUTOR', 'USER');

-- CreateEnum
CREATE TYPE "NavItemAlignment" AS ENUM ('RIGHT', 'LEFT');

-- CreateTable
CREATE TABLE "User" (
    "_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "photo" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',

    CONSTRAINT "User_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "NavigationItem" (
    "_id" TEXT NOT NULL,
    "navigationId" TEXT,
    "name" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "alignment" "NavItemAlignment" NOT NULL DEFAULT 'RIGHT',
    "newTab" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "NavigationItem_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "Navigation" (
    "_id" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,

    CONSTRAINT "Navigation_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "Page" (
    "_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sections" TEXT[],
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "Post" (
    "_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],
    "thumbnail" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "NavigationItem" ADD CONSTRAINT "NavigationItem_navigationId_fkey" FOREIGN KEY ("navigationId") REFERENCES "Navigation"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
