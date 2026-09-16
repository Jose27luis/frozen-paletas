-- CreateEnum
CREATE TYPE "ListaPrecios" AS ENUM ('UNIDAD', 'MAYOR');

-- AlterTable
ALTER TABLE "salida" ADD COLUMN     "lista_precios" "ListaPrecios" NOT NULL DEFAULT 'UNIDAD';
