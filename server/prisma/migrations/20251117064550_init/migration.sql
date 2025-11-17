-- CreateEnum
CREATE TYPE "TypeFile" AS ENUM ('idle', 'walking', 'attack');

-- CreateEnum
CREATE TYPE "TypeAnimation" AS ENUM ('weapon', 'effect');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('info', 'warning', 'success', 'error');

-- CreateEnum
CREATE TYPE "RewardType" AS ENUM ('weapon', 'block', 'badge', 'experience', 'coin');

-- CreateEnum
CREATE TYPE "WeaponType" AS ENUM ('melee', 'ranged', 'magic', 'special');

-- CreateEnum
CREATE TYPE "BlockCategory" AS ENUM ('movement', 'logic', 'conditions', 'loops', 'functions', 'variables', 'operators');

-- CreateTable
CREATE TABLE "users" (
    "user_id" SERIAL NOT NULL,
    "clerk_user_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "profile_image" TEXT,
    "clerk_metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "role" "UserRole" NOT NULL DEFAULT 'user',

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "level_categories" (
    "category_id" SERIAL NOT NULL,
    "category_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "item_enable" BOOLEAN NOT NULL,
    "item" JSONB,
    "difficulty_order" INTEGER NOT NULL,
    "color_code" TEXT NOT NULL,

    CONSTRAINT "level_categories_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "victory_conditions" (
    "victory_condition_id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "check" TEXT NOT NULL,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "victory_conditions_pkey" PRIMARY KEY ("victory_condition_id")
);

-- CreateTable
CREATE TABLE "level_victory_conditions" (
    "level_victory_condition_id" SERIAL NOT NULL,
    "level_id" INTEGER NOT NULL,
    "victory_condition_id" INTEGER NOT NULL,

    CONSTRAINT "level_victory_conditions_pkey" PRIMARY KEY ("level_victory_condition_id")
);

-- CreateTable
CREATE TABLE "levels" (
    "level_id" SERIAL NOT NULL,
    "category_id" INTEGER NOT NULL,
    "level_name" TEXT NOT NULL,
    "description" TEXT,
    "difficulty_level" INTEGER NOT NULL,
    "difficulty" TEXT NOT NULL,
    "is_unlocked" BOOLEAN NOT NULL DEFAULT false,
    "required_level_id" INTEGER,
    "textcode" BOOLEAN NOT NULL,
    "background_image" TEXT NOT NULL,
    "start_node_id" INTEGER,
    "goal_node_id" INTEGER,
    "goal_type" TEXT,
    "nodes" JSONB,
    "edges" JSONB,
    "monsters" JSONB,
    "obstacles" JSONB,
    "coin_positions" JSONB,
    "people" JSONB,
    "treasures" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" INTEGER NOT NULL,

    CONSTRAINT "levels_pkey" PRIMARY KEY ("level_id")
);

-- CreateTable
CREATE TABLE "pattern_types" (
    "pattern_type_id" SERIAL NOT NULL,
    "type_name" TEXT NOT NULL,
    "description" TEXT,
    "quality_level" TEXT NOT NULL,

    CONSTRAINT "pattern_types_pkey" PRIMARY KEY ("pattern_type_id")
);

-- CreateTable
CREATE TABLE "patterns" (
    "pattern_id" SERIAL NOT NULL,
    "pattern_type_id" INTEGER NOT NULL,
    "level_id" INTEGER NOT NULL,
    "weapon_id" INTEGER,
    "pattern_name" TEXT NOT NULL,
    "description" TEXT,
    "xmlpattern" TEXT,
    "hints" JSONB,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patterns_pkey" PRIMARY KEY ("pattern_id")
);

-- CreateTable
CREATE TABLE "user_progress" (
    "progress_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "level_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "attempts_count" INTEGER NOT NULL DEFAULT 0,
    "blockly_code" TEXT,
    "text_code" TEXT,
    "execution_time" INTEGER,
    "best_score" INTEGER NOT NULL DEFAULT 0,
    "pattern_bonus_score" INTEGER NOT NULL DEFAULT 0,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "stars_earned" INTEGER NOT NULL DEFAULT 0,
    "first_attempt" TIMESTAMP(3),
    "last_attempt" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "hp_remaining" INTEGER,

    CONSTRAINT "user_progress_pkey" PRIMARY KEY ("progress_id")
);

-- CreateTable
CREATE TABLE "rewards" (
    "reward_id" SERIAL NOT NULL,
    "level_id" INTEGER NOT NULL,
    "reward_type" "RewardType" NOT NULL,
    "reward_name" TEXT NOT NULL,
    "description" TEXT,
    "reward_data" JSONB,
    "required_score" INTEGER NOT NULL,
    "is_automatic" BOOLEAN NOT NULL DEFAULT false,
    "frame1" TEXT,
    "frame2" TEXT,
    "frame3" TEXT,
    "frame4" TEXT,
    "frame5" TEXT,

    CONSTRAINT "rewards_pkey" PRIMARY KEY ("reward_id")
);

-- CreateTable
CREATE TABLE "user_rewards" (
    "user_reward_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "reward_id" INTEGER NOT NULL,
    "level_id" INTEGER NOT NULL,
    "earned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_rewards_pkey" PRIMARY KEY ("user_reward_id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "notification_id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("notification_id")
);

-- CreateTable
CREATE TABLE "user_notifications" (
    "user_notification_id" SERIAL NOT NULL,
    "notification_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_notifications_pkey" PRIMARY KEY ("user_notification_id")
);

-- CreateTable
CREATE TABLE "weapons" (
    "weapon_id" SERIAL NOT NULL,
    "weapon_key" TEXT NOT NULL,
    "weapon_name" TEXT NOT NULL,
    "description" TEXT,
    "combat_power" INTEGER NOT NULL DEFAULT 0,
    "emoji" TEXT,
    "weapon_type" "WeaponType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weapons_pkey" PRIMARY KEY ("weapon_id")
);

-- CreateTable
CREATE TABLE "blocks" (
    "block_id" SERIAL NOT NULL,
    "block_key" TEXT NOT NULL,
    "block_name" TEXT NOT NULL,
    "description" TEXT,
    "category" "BlockCategory" NOT NULL,
    "blockly_type" TEXT,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "syntax_example" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blocks_pkey" PRIMARY KEY ("block_id")
);

-- CreateTable
CREATE TABLE "level_blocks" (
    "level_block_id" SERIAL NOT NULL,
    "level_id" INTEGER NOT NULL,
    "block_id" INTEGER NOT NULL,
    "order_sequence" INTEGER,

    CONSTRAINT "level_blocks_pkey" PRIMARY KEY ("level_block_id")
);

-- CreateTable
CREATE TABLE "guides" (
    "guide_id" SERIAL NOT NULL,
    "level_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guides_pkey" PRIMARY KEY ("guide_id")
);

-- CreateTable
CREATE TABLE "guide_image" (
    "guide_file_id" SERIAL NOT NULL,
    "guide_id" INTEGER NOT NULL,
    "path_file" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guide_image_pkey" PRIMARY KEY ("guide_file_id")
);

-- CreateTable
CREATE TABLE "weapon_image" (
    "file_id" SERIAL NOT NULL,
    "weapon_id" INTEGER NOT NULL,
    "path_file" TEXT NOT NULL,
    "type_file" "TypeFile" NOT NULL,
    "type_animation" "TypeAnimation" NOT NULL,
    "frame" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weapon_image_pkey" PRIMARY KEY ("file_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_clerk_user_id_key" ON "users"("clerk_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "victory_conditions_type_key" ON "victory_conditions"("type");

-- CreateIndex
CREATE UNIQUE INDEX "level_victory_conditions_level_id_victory_condition_id_key" ON "level_victory_conditions"("level_id", "victory_condition_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_progress_user_id_level_id_key" ON "user_progress"("user_id", "level_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_notifications_notification_id_user_id_key" ON "user_notifications"("notification_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "weapons_weapon_key_key" ON "weapons"("weapon_key");

-- CreateIndex
CREATE UNIQUE INDEX "blocks_block_key_key" ON "blocks"("block_key");

-- CreateIndex
CREATE UNIQUE INDEX "level_blocks_level_id_block_id_key" ON "level_blocks"("level_id", "block_id");

-- AddForeignKey
ALTER TABLE "level_victory_conditions" ADD CONSTRAINT "level_victory_conditions_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "levels"("level_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "level_victory_conditions" ADD CONSTRAINT "level_victory_conditions_victory_condition_id_fkey" FOREIGN KEY ("victory_condition_id") REFERENCES "victory_conditions"("victory_condition_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "levels" ADD CONSTRAINT "levels_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "level_categories"("category_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "levels" ADD CONSTRAINT "levels_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "levels" ADD CONSTRAINT "levels_required_level_id_fkey" FOREIGN KEY ("required_level_id") REFERENCES "levels"("level_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patterns" ADD CONSTRAINT "patterns_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "levels"("level_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patterns" ADD CONSTRAINT "patterns_pattern_type_id_fkey" FOREIGN KEY ("pattern_type_id") REFERENCES "pattern_types"("pattern_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patterns" ADD CONSTRAINT "patterns_weapon_id_fkey" FOREIGN KEY ("weapon_id") REFERENCES "weapons"("weapon_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "levels"("level_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "levels"("level_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_rewards" ADD CONSTRAINT "user_rewards_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "levels"("level_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_rewards" ADD CONSTRAINT "user_rewards_reward_id_fkey" FOREIGN KEY ("reward_id") REFERENCES "rewards"("reward_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_rewards" ADD CONSTRAINT "user_rewards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_notifications" ADD CONSTRAINT "user_notifications_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("notification_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_notifications" ADD CONSTRAINT "user_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "level_blocks" ADD CONSTRAINT "level_blocks_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "blocks"("block_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "level_blocks" ADD CONSTRAINT "level_blocks_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "levels"("level_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guides" ADD CONSTRAINT "guides_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "levels"("level_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guide_image" ADD CONSTRAINT "guide_image_guide_id_fkey" FOREIGN KEY ("guide_id") REFERENCES "guides"("guide_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weapon_image" ADD CONSTRAINT "weapon_image_weapon_id_fkey" FOREIGN KEY ("weapon_id") REFERENCES "weapons"("weapon_id") ON DELETE RESTRICT ON UPDATE CASCADE;
