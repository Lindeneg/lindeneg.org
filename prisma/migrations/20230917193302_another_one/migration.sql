/*
  Warnings:

  - You are about to drop the column `http` on the `Visitor` table. All the data in the column will be lost.
  - You are about to drop the column `tls` on the `Visitor` table. All the data in the column will be lost.
  - Added the required column `http` to the `Visit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tls` to the `Visit` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Visit" ADD COLUMN     "http" TEXT NOT NULL,
ADD COLUMN     "tls" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Visitor" DROP COLUMN "http",
DROP COLUMN "tls";
