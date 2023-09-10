// import { pipeline, env } from '@xenova/transformers';

class MyClassificationPipeline {
	static task = "text-classification";
	static model = "Xenova/distilbert-base-uncased-finetuned-sst-2-english";
	static instance = null;

	static async getInstance(progress_callback = null) {
		if (this.instance === null) {
			// Dynamically import the Transformers.js library
			console.log('before import')
			let { pipeline, env } = await import("@xenova/transformers");
			console.log('after import')

			// NOTE: Uncomment this to change the cache directory
			// env.cacheDir = './.cache';

			this.instance = pipeline(this.task, this.model, {
				progress_callback,
			});
		}

		return this.instance;
	}
}
export default MyClassificationPipeline;

// Comment out this line if you don't want to start loading the model as soon as the server starts.
// If commented out, the model will be loaded when the first request is received (i.e,. lazily).
// MyClassificationPipeline.getInstance();
