interface NextRequestInit extends RequestInit {
  nextConfig?: { i18n?: any };
}

export class NextRequest extends Request {
  private _url: string;
  private _body: any;

  constructor(input: RequestInfo | URL, init?: NextRequestInit) {
    super(input, init);
    Object.setPrototypeOf(this, NextRequest.prototype);
    this._url = input instanceof URL ? input.href : input.toString();
    try {
      this._body = init?.body ? JSON.parse(init.body.toString()) : {};
    } catch (e) {
      this._body = {};
    }
  }

  json(): Promise<any> {
    return Promise.resolve(this._body);
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
