onmessage = async (ev) => {
	await import("@xenova/transformers").then(({ pipeline }) => {
		console.log(pipeline);
	});

	console.log("worker received message", ev.data);
};
