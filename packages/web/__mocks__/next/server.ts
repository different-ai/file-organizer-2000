interface NextRequestInit extends RequestInit {
  nextConfig?: { i18n?: any };
}

export class NextRequest extends Request {
  private _url: string;

  constructor(input: RequestInfo | URL, init?: NextRequestInit) {
    super(input, init);
    Object.setPrototypeOf(this, NextRequest.prototype);
    this._url = input instanceof URL ? input.href : input.toString();
  }

  json<T = any>(): Promise<T> {
    return super.json();
  }

  // Add other required Next.js Request methods
  get cookies() {
    return new Map();
  }

  get url() {
    return this._url;
  }

  get nextUrl() {
    return new URL(this._url);
  }
}

export class NextResponse extends Response {
  static json(data: any) {
    return new Response(JSON.stringify(data), {
      headers: { 'content-type': 'application/json' },
    });
  }
}
