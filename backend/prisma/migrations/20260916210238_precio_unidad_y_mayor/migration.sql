/*
  Warnings:

  - You are about to drop the column `precio` on the `sabor` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "sabor" DROP COLUMN "precio",
ADD COLUMN     "precio_mayor" DECIMAL(10,2),
ADD COLUMN     "precio_unidad" DECIMAL(10,2);
