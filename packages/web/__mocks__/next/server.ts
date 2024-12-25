interface NextRequestInit extends RequestInit {
  nextConfig?: { i18n?: any };
}

export class NextRequest extends Request {
  constructor(input: RequestInfo | URL, init?: NextRequestInit) {
    super(input, init);
    Object.setPrototypeOf(this, NextRequest.prototype);
  }

  json<T = any>(): Promise<T> {
    return super.json();
  }

  // Add other required Next.js Request methods
  get cookies() {
    return new Map();
  }

  get nextUrl() {
    return new URL(this.url);
  }
}

export class NextResponse extends Response {
  static json(data: any) {
    return new Response(JSON.stringify(data), {
      headers: { 'content-type': 'application/json' },
    });
  }
}
