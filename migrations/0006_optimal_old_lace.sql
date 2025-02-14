ALTER TABLE `contribution` ADD `email` text;--> statement-breakpoint
ALTER TABLE `contribution` ADD `created_at` integer;--> statement-breakpoint
ALTER TABLE `contribution` ADD `paied_at` integer;--> statement-breakpoint
ALTER TABLE `contribution` DROP COLUMN `processed`;--> statement-breakpoint
ALTER TABLE `contribution_without_compensation` ADD `email` text;--> statement-breakpoint
ALTER TABLE `contribution_without_compensation` ADD `created_at` integer;--> statement-breakpoint
ALTER TABLE `contribution_without_compensation` ADD `paied_at` integer;