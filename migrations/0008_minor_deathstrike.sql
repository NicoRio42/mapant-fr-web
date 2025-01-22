ALTER TABLE `pyramid_rendering_step_jobs` ADD `base_zoom_level_tile_id` text REFERENCES tiles(id);--> statement-breakpoint
ALTER TABLE `pyramid_rendering_step_jobs` DROP COLUMN `is_base_zoom_level`;