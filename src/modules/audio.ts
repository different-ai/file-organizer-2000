async function useAudio(filePath: string) {
	const result = await fetch("http://localhost:3000/api/audio", {
		method: "POST",
		body: JSON.stringify({ filePath }),
		headers: {
			"Content-Type": "application/json",
		},
	});
	const data = await result.json();
	console.log("audio data", data);
	return data.text;
}

export default useAudio;
