import seeder from "./seed";

(async () => {
	await seeder();
})().then(() => {
	process.exit(0);
});
