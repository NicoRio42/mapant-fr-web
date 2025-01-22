ALTER TABLE `areas_to_generate` ADD `is_mergeable` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `pyramid_rendering_step_jobs` ADD `max_upper_zoom_to_generate` integer;--> statement-breakpoint
ALTER TABLE `tiles` ADD `is_mergeable` integer DEFAULT false;