import { Notice, RequestUrlResponse, requestUrl } from "obsidian";

export async function makeApiRequest<T>(
  requestFn: () => Promise<RequestUrlResponse>
): Promise<RequestUrlResponse> {
  const response: RequestUrlResponse = await requestFn();
  console.log("response", response);
  if (response.status >= 200 && response.status < 300) {
    return response;
  }
  if (response.json.error) {
    new Notice(`File Organizer error: ${response.json.error}`, 6000);
    throw new Error(response.json.error);
  }
  throw new Error("Unknown error");
}

export async function checkAPIKey(
  serverUrl: string,
  key: string
): Promise<boolean> {
  try {
    const response: RequestUrlResponse = await requestUrl({
      url: `${serverUrl}/api/check-key`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
    });
    return response.status === 200;
  } catch (error) {
    console.error("Error checking API key:", error);
    return false;
  }
}
