/**
 * @jest-environment node
 */

import { NextRequest, NextResponse } from "next/server";
import { handleAuthorizationV2 } from "@/lib/handleAuthorization";
import type { Server } from "http";
import { createServer } from "http";
import type { SuperTest, Test } from "supertest";
import supertest from "supertest";
import { NextApiHandler } from "next";
import { jest, describe, it, expect, beforeAll, beforeEach, afterAll } from "@jest/globals";

// Mock Clerk auth
jest.mock("@clerk/nextjs/server", () => ({
  auth: jest.fn().mockImplementation(() => ({
    userId: "test-user-123",
  })),
}));

// Mock route handler that uses handleAuthorizationV2
async function GET(req: NextRequest) {
  try {
    const result = await handleAuthorizationV2(req);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

describe("Authorization Flow", () => {
  const mockUserId = "test-user-123";
  const validToken = "valid-test-token";
  let server: Server;
  let request: SuperTest<Test>;

  beforeAll(() => {
    const handler: NextApiHandler = (req, res) => {
      if (req.method === "GET") {
        const nextReq = new NextRequest(new Request("http://localhost:3000"), {
          headers: req.headers as HeadersInit,
        });
        return GET(nextReq);
      }
    };
    server = createServer(handler as any);
    request = supertest(server);
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    process.env.ENABLE_USER_MANAGEMENT = "false";
  });

  it("should authorize a valid request token", async () => {
    const response = await request
      .get("/")
      .set("authorization", `Bearer ${validToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("userId", mockUserId);
  });

  it("should reject invalid request token", async () => {
    const response = await request
      .get("/")
      .set("authorization", "Bearer invalid-token");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Unauthorized" });
  });

  it("should handle missing authorization header", async () => {
    const response = await request.get("/");
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Unauthorized" });
  });

  it("should handle malformed authorization header", async () => {
    const response = await request
      .get("/")
      .set("authorization", "malformed-header");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Unauthorized" });
  });

  describe("with user management enabled", () => {
    beforeEach(() => {
      process.env.ENABLE_USER_MANAGEMENT = "true";
    });

    it("should create fallback user when configured", async () => {
      const response = await request.get("/");
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("userId");
      expect(response.body.isAnonymous).toBe(true);
    });
  });
});
