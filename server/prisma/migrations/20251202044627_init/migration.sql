/*
  Warnings:

  - You are about to drop the column `item` on the `level_categories` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('coin_positions', 'people', 'treasures');

-- AlterTable
ALTER TABLE "level_categories" DROP COLUMN "item";

-- CreateTable
CREATE TABLE "level_category_items" (
    "id" SERIAL NOT NULL,
    "category_id" INTEGER NOT NULL,
    "item_type" "ItemType" NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "level_category_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "level_category_items_category_id_item_type_key" ON "level_category_items"("category_id", "item_type");

-- AddForeignKey
ALTER TABLE "level_category_items" ADD CONSTRAINT "level_category_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "level_categories"("category_id") ON DELETE CASCADE ON UPDATE CASCADE;
