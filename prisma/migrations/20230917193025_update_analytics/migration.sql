/*
  Warnings:

  - You are about to drop the column `browser` on the `Visit` table. All the data in the column will be lost.
  - You are about to drop the column `cpu` on the `Visit` table. All the data in the column will be lost.
  - You are about to drop the column `device` on the `Visit` table. All the data in the column will be lost.
  - You are about to drop the column `http` on the `Visit` table. All the data in the column will be lost.
  - You are about to drop the column `os` on the `Visit` table. All the data in the column will be lost.
  - You are about to drop the column `tls` on the `Visit` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `Visit` table. All the data in the column will be lost.
  - Added the required column `browser` to the `Visitor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cpu` to the `Visitor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `device` to the `Visitor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `http` to the `Visitor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `os` to the `Visitor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tls` to the `Visitor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userAgent` to the `Visitor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Visit" DROP COLUMN "browser",
DROP COLUMN "cpu",
DROP COLUMN "device",
DROP COLUMN "http",
DROP COLUMN "os",
DROP COLUMN "tls",
DROP COLUMN "userAgent";

-- AlterTable
ALTER TABLE "Visitor" ADD COLUMN     "browser" TEXT NOT NULL,
ADD COLUMN     "cpu" TEXT NOT NULL,
ADD COLUMN     "device" TEXT NOT NULL,
ADD COLUMN     "http" TEXT NOT NULL,
ADD COLUMN     "os" TEXT NOT NULL,
ADD COLUMN     "tls" TEXT NOT NULL,
ADD COLUMN     "userAgent" TEXT NOT NULL;
