
export async function POST(request: Request) {
  // Additionally check if the body has a code that matches any in the process env var list
  const requestBody = await request.json();
  const providedCode = requestBody.code;
  const validCodes = process.env.VALID_CODES?.split(",") || [];

  if (!validCodes.includes(providedCode)) {
    // If the provided code is not good
    return new Response("Unauthorized", { status: 401 });
  }

  // If the code is good, process request
  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
