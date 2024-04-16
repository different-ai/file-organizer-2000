import { verifyKey } from "@unkey/api";

export async function POST(request: Request) {
  const header = request.headers.get("Authorization");
  if (!header) {
    return new Response("No Authorization header", { status: 401 });
  }
  const token = header.replace("Bearer ", "");
  const { result, error } = await verifyKey(token);

  if (error) {
    console.error(error.message);
    return new Response("Internal Server Error", { status: 500 });
  }

  if (!result.valid) {
    // do not grant access
    return new Response("Unauthorized", { status: 401 });
  }

  // Additionally check if the body has a code that matches any in the process env var list
  const requestBody = await request.json();
  const providedCode = requestBody.code;
  const validCodes = process.env.VALID_CODES?.split(",") || [];

  if (!validCodes.includes(providedCode)) {
    // If the provided code is not good
    return new Response("Unauthorized", { status: 401 });
  }

  // If the code is good, process request
  return new Response(JSON.stringify({ result }), { status: 200, headers: { "Content-Type": "application/json" } });
}