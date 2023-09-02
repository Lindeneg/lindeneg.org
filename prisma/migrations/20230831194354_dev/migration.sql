/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Blog` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Blog` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Blog` table. All the data in the column will be lost.
  - You are about to drop the column `blogEnabled` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `blogPath` on the `User` table. All the data in the column will be lost.
  - Added the required column `path` to the `Blog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `blogId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Blog" DROP CONSTRAINT "Blog_userId_fkey";

-- AlterTable
ALTER TABLE "Blog" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "path" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "blogEnabled",
DROP COLUMN "blogPath",
ADD COLUMN     "blogId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "Blog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
