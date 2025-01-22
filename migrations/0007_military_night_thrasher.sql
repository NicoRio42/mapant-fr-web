DROP INDEX IF EXISTS "lidar_step_jobs_tile_id_index";--> statement-breakpoint
DROP INDEX IF EXISTS "lidar_step_jobs_area_to_generate_id_index";--> statement-breakpoint
DROP INDEX IF EXISTS "map_rendering_step_jobs_tile_id_index";--> statement-breakpoint
DROP INDEX IF EXISTS "map_rendering_step_jobs_area_to_generate_id_index";--> statement-breakpoint
DROP INDEX IF EXISTS "pyramid_rendering_step_jobs_area_to_generate_id_index";--> statement-breakpoint
DROP INDEX IF EXISTS "workers_name_unique";--> statement-breakpoint
ALTER TABLE `pyramid_rendering_step_jobs` ALTER COLUMN "is_base_zoom_level" TO "is_base_zoom_level" integer NOT NULL;--> statement-breakpoint
CREATE INDEX `lidar_step_jobs_tile_id_index` ON `lidar_step_jobs` (`tile_id`);--> statement-breakpoint
CREATE INDEX `lidar_step_jobs_area_to_generate_id_index` ON `lidar_step_jobs` (`area_to_generate_id`);--> statement-breakpoint
CREATE INDEX `map_rendering_step_jobs_tile_id_index` ON `map_rendering_step_jobs` (`tile_id`);--> statement-breakpoint
CREATE INDEX `map_rendering_step_jobs_area_to_generate_id_index` ON `map_rendering_step_jobs` (`area_to_generate_id`);--> statement-breakpoint
CREATE INDEX `pyramid_rendering_step_jobs_area_to_generate_id_index` ON `pyramid_rendering_step_jobs` (`area_to_generate_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `workers_name_unique` ON `workers` (`name`);