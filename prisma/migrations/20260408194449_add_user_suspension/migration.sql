-- AlterTable
ALTER TABLE "api_keys" ADD COLUMN     "was_active_before_suspension" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_suspended" BOOLEAN NOT NULL DEFAULT false;
