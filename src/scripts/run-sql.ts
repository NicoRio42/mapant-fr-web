import { pyramidRenderingStepJobTable, tilesTable } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';
import { env } from 'node:process';

const FRANCE_SURFACE = 543_940;

const db = drizzle({ connection: { url: env.TURSO_DB_URL ?? '', authToken: env.TURSO_DB_TOKEN } });

const tiles = await db
	.select()
	.from(tilesTable)
	.where(eq(tilesTable.lidarStepStatus, 'finished'))
	.all();

const pyramidJobs = await db
	.select()
	.from(pyramidRenderingStepJobTable)
	.where(eq(pyramidRenderingStepJobTable.status, 'finished'))
	.all();

const numberOfFinishedLidarSteps = tiles.length;
let numberOfFinishedRenderSteps = 0;
let lidarStepTotalComputeTime = 0;
let renderStepTotalComputeTime = 0;

for (const tile of tiles) {
	if (tile.mapRenderingStepStatus === 'finished') numberOfFinishedRenderSteps++;

	if (tile.lidarStepStartTime !== null && tile.lidarStepFinishTime !== null) {
		lidarStepTotalComputeTime +=
			(tile.lidarStepFinishTime.getTime() - tile.lidarStepStartTime.getTime()) / 1000;
	} else if (tile.lidarStepStatus === 'finished') {
		console.warn(`Inconsistent tile: ${tile.id}`);
	}

	if (tile.mapRenderingStepStartTime !== null && tile.mapRenderingStepFinishTime !== null) {
		renderStepTotalComputeTime +=
			(tile.mapRenderingStepFinishTime.getTime() - tile.mapRenderingStepStartTime.getTime()) / 1000;
	} else if (tile.mapRenderingStepStatus === 'finished') {
		console.warn(`Inconsistent tile: ${tile.id}`);
	}
}

const numberOfFinishedPyramidJobs = pyramidJobs.length;
let pyramidStepTotalComputeTime = 0;

for (const job of pyramidJobs) {
	if (job.startTime !== null && job.finishTime !== null) {
		pyramidStepTotalComputeTime += (job.finishTime.getTime() - job.startTime.getTime()) / 1000;
	} else if (job.status === 'finished') {
		console.warn(`Inconsistent pyramid job: x=${job.x} y=${job.y} z=${job.zoom}`);
	}
}

function formatSeconds(seconds: number): string {
	const days = Math.floor(seconds / 86400);
	const hours = Math.floor((seconds % 86400) / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const remainingSeconds = Math.round(seconds % 60);

	const parts = [];

	if (days > 0) {
		parts.push(`${days}d`);
	}
	if (hours > 0) {
		parts.push(`${hours}h`);
	}
	if (minutes > 0) {
		parts.push(`${minutes}mn`);
	}
	if (remainingSeconds > 0 || parts.length === 0) {
		parts.push(`${remainingSeconds}s`);
	}

	return parts.join(' ');
}

const percentageOfCountryDone =
	(numberOfFinishedLidarSteps + numberOfFinishedRenderSteps) / (FRANCE_SURFACE * 2);
const totalComputeTime =
	lidarStepTotalComputeTime + renderStepTotalComputeTime + pyramidStepTotalComputeTime;
const estimatedTotalComputeTime = totalComputeTime / percentageOfCountryDone;

console.table([
	['number of finished lidar steps', numberOfFinishedLidarSteps],
	['number of finished render steps', numberOfFinishedRenderSteps],
	['number of finished pyramid jobs', numberOfFinishedPyramidJobs],
	['lidar step total compute time', formatSeconds(lidarStepTotalComputeTime)],
	['lidar step total compute time / 12', formatSeconds(lidarStepTotalComputeTime / 12)],
	['render step total compute time', formatSeconds(renderStepTotalComputeTime)],
	['render step total compute time / 12', formatSeconds(renderStepTotalComputeTime / 12)],
	['pyramid step total compute time', formatSeconds(pyramidStepTotalComputeTime)],
	['pyramid step total compute time / 12', formatSeconds(pyramidStepTotalComputeTime / 12)],
	['total compute time', formatSeconds(totalComputeTime)],
	['total compute time / 12', formatSeconds(totalComputeTime / 12)],
	['percentage of country done', 100 * percentageOfCountryDone],
	['estimated total compute time', formatSeconds(estimatedTotalComputeTime)],
	['estimated total compute time / 12', formatSeconds(estimatedTotalComputeTime / 12)]
]);
