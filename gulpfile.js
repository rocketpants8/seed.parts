/* jshint node: true */
"use strict";

const { src, dest, series, parallel } = require('gulp');
const fs = require("fs");
const replace = require('gulp-replace');
const cp = require('child_process');

const stages = ['local', 'prod'];
const srcDir = "./src";
const configFilename = "config.ts";

/**
 * The AWS cloudfront distribution. If this has not been configured, leave it blank (`undefined`).
 *
 * @type {{[key: StageString]: string}}
 */
const distributions = {
	"prod": "E3TDA0973F1T4U"
};

/**
 * The AWS cloudfront distribution. If this has not been configured, leave it blank (`undefined`).
 *
 * @type {{[key: StageString]: string}}
 */
const awsProfiles = {
	"prod": "default"
};

const bucketDomains = {
	"prod": "seed.parts"
};

const backupBucketDomains = {
	"prod": {
		"from": "prod.seed.parts",
		"to": "backup.seed.parts"
	}
};


/**
* Synchronises the contents of /dist with the S3 bucket for the selected stage
*/
function syncCmd(stage) {
	const domain = bucketDomains[stage];
	const bucketName = `s3://${stage}.${domain}`;
	const profile = awsProfiles[stage] ? ` --profile ${awsProfiles[stage]}` : "";
	const excludeMaps = isProd(stage) ? " --exclude=*.map" : "";
	const cmd = `aws s3 sync dist/secrets/browser/ ${bucketName} --delete --exclude aws-settings.*.ts --exclude=.DS_Store${excludeMaps}`;
	console.log(cmd);
	return cp.exec(cmd);
}

function newVersion(currentVersion, changeType) {
	const versionComponents = currentVersion.split(".");

	let [major, minor, patch] = versionComponents.map(Number);

	switch (changeType) {
		case "patch":
			patch += 1;
			break;
		case "minor":
			minor += 1;
			patch = 0;
			break;
		case "major":
			major += 1;
			minor = 0;
			patch = 0;
			break;
	}

	const result = `${major}.${minor}.${patch}`;
	// fs.writeFileSync(versionFilename, result, "utf8");
	console.log(`New version is ${result}`);
	return result;
}

function getVersion() {
	const config = fs.readFileSync(`${srcDir}/${configFilename}`, "utf8");
	const matches = config.match(/"version": "(\d+\.\d+\.\d+)"/);
	if (!!matches && matches.length > 1) {
		return matches[1];
	}
	return "0.0.0";
}

function backupCmd(stage) {
	if (backupBucketDomains[stage] === undefined) {
		return cp.exec("echo 'No backup destination defined'");
	}

	const profile = awsProfiles[stage] ? ` --profile ${awsProfiles[stage]}` : "";
	const folderName = new Date().toISOString();
	const cmd = `aws s3 sync s3://${backupBucketDomains[stage].from}/ "s3://${backupBucketDomains[stage].to}/${folderName}/"${profile}`;
	console.log(cmd);
	return cp.exec(cmd);
}

function invalidateDistributionCmd(stage) {
	if ([undefined, ''].includes(distributions[stage])) {
		console.log('No CloudFront distribution defined for this deployment stage, cannot invalidate');
		return Promise.resolve();
	}

	const profile = awsProfiles[stage] ? ` --profile ${awsProfiles[stage]}` : "";
	const cmd = `aws cloudfront create-invalidation --distribution ${distributions[stage]} --paths "/*"${profile}`;
	console.log(cmd);
	return cp.exec(cmd);
}

function patchCmd() {
	const nextVersion = newVersion(getVersion(), "patch");
	return configCmd(nextVersion);
}

function minorCmd() {
	const nextVersion = newVersion(getVersion(), "minor");
	return configCmd(nextVersion);
}

function majorCmd() {
	const nextVersion = newVersion(getVersion(), "major");
	return configCmd(nextVersion);
}

function configCmd(version) {
	console.log(`Setting version to ${version}`);
	// const version = getVersion();
	return src(`${srcDir}/${configFilename}`)
		.pipe(replace(/"version".*$/im, `"version": "${version}"`))
		.pipe(dest(srcDir));
}

function isProd(stage) {
	let prodStages = ['prod'];
	return prodStages.includes(stage);
}

/**
* Runs the Angular build script
*/
function buildCmd(stage) {
	let cmd = "yarn run build";
	if (isProd(stage)) {
		console.log("Build using production mode");
		cmd += " -c production";
	}
	console.log(`Build command = ${cmd}`);
	return cp.exec(cmd);
}

function checkInvalidationStatusCmd(stage) {
	if ([undefined, ''].includes(distributions[stage])) {
		console.log('No CloudFront distribution defined for this deployment stage, cannot invalidate');
		return Promise.resolve();
	}

	const profile = awsProfiles[stage] ? ` --profile ${awsProfiles[stage]}` : "";
	const cmd = `aws cloudfront get-distribution --id ${distributions[stage]}${profile} | jq '.Distribution.InProgressInvalidationBatches'`;
	console.log(cmd);
	return cp.exec(cmd, (err, stdOut) => {
		const isInvalidating = Number(stdOut.trim()) > 0;
		console.log(isInvalidating ? "Invalidating..." : "Ready");
		if (isInvalidating) {
			setTimeout(() => { checkInvalidationStatusCmd(stage); }, 10000);
		}
	});
}

/**
* Constructs the various named tasks and exports those which are public: stage.build and stage.sync
*/
function createTasks(stage) {

	const tasks = {
		"patch": "patch",
		"minor": "minor",
		"major": "major",
		"build": `${stage}.build`,
		"make": `${stage}.make`,
		"backup": `${stage}.backup`,
		"invalidate": `${stage}.invalidate`,
		"status": `${stage}.status`
	};

	let funcs = {};
	funcs[tasks.patch] = patchCmd.bind(null);
	funcs[tasks.minor] = minorCmd.bind(null);
	funcs[tasks.major] = majorCmd.bind(null);

	funcs[tasks.build] = buildCmd.bind(null, stage);
	funcs[tasks.backup] = backupCmd.bind(null, stage);
	funcs[tasks.invalidate] = invalidateDistributionCmd.bind(null, stage);
	funcs[tasks.status] = checkInvalidationStatusCmd.bind(null, stage);

	if (stage !== 'local') {

		tasks.sync = `${stage}.sync`;

		funcs[tasks.sync] = series(
			funcs[tasks.backup],
			funcs[tasks.build],
			syncCmd.bind(null, stage),
			funcs[tasks.invalidate],
			funcs[tasks.status]);

		exports[tasks.sync] = funcs[tasks.sync];
	}

	exports[tasks.patch] = funcs[tasks.patch];
	exports[tasks.minor] = funcs[tasks.minor];
	exports[tasks.major] = funcs[tasks.major];
	exports[tasks.make] = funcs[tasks.make];
	exports[tasks.build] = funcs[tasks.build];
	exports[tasks.backup] = funcs[tasks.backup];
	exports[tasks.status] = funcs[tasks.status];
	exports[tasks.invalidate] = funcs[tasks.invalidate];

}


stages.forEach(stage => createTasks(stage));
