
export function formatToSafeName(format: string) {
	return format.replace(/[\\/:"]/g, "");
}
export function cleanPath(path: string) {
	const trimmedPath = path.trim();
	// cleanup path remove leading and trailing slashes
	const pathWithoutLeadingAndTrailingSlashes = trimmedPath.replace(
		/^\/+|\/+$/g,
		""
	);
	return pathWithoutLeadingAndTrailingSlashes;
}
export const logMessage = (...args: any[]) => {
	if (process.env.NODE_ENV === "production") {
		return;
	}
	console.log(...args);
};
