-- CreateTable
CREATE TABLE "CLSoftwareContact" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CLSoftwareContact_pkey" PRIMARY KEY ("id")
);
