/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import type { Server } from "http";
import { createServer } from "http";
import type { SuperTest, Test } from "supertest";
import supertest from "supertest";
import { NextApiHandler } from "next";
import { jest, describe, it, expect, beforeAll, beforeEach, afterAll } from "@jest/globals";
import { POST } from "./route";
import Stripe from "stripe";

// Mock Stripe
jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({
          url: "https://checkout.stripe.com/test-session",
        }),
      },
    },
  }));
});

// Mock Clerk auth
jest.mock("@clerk/nextjs/server", () => ({
  auth: jest.fn().mockImplementation(() => ({
    userId: "test-user-123",
  })),
}));

describe("Top-up API Route", () => {
  const mockUserId = "test-user-123";
  const validToken = "valid-test-token";
  let server: Server;
  let request: SuperTest<Test>;

  beforeAll(() => {
    const handler: NextApiHandler = (req, res) => {
      if (req.method === "POST") {
        const nextReq = new NextRequest(new Request("http://localhost:3000"), {
          headers: req.headers as HeadersInit,
        });
        return POST(nextReq);
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
  });

  it("should create a Stripe checkout session for authorized user", async () => {
    const response = await request
      .post("/")
      .set("authorization", `Bearer ${validToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("url");
    expect(response.body.url).toContain("checkout.stripe.com");
    expect(response.body).toHaveProperty("licenseKey");
  });

  it("should return 401 for unauthorized request", async () => {
    const response = await request
      .post("/")
      .set("authorization", "Bearer invalid-token");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Authentication failed" });
  });

  it("should handle missing authorization header", async () => {
    const response = await request.post("/");
    
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Authentication failed" });
  });

  it("should create fallback user when configured", async () => {
    process.env.ENABLE_USER_MANAGEMENT = "true";
    
    const response = await request.post("/");
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("url");
    expect(response.body).toHaveProperty("licenseKey");
  });
});
