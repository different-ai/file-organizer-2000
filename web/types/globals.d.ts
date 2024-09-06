export {};

declare global {
  interface CustomJwtSessionClaims {
    publicMetadata: {
      stripe?: {
        status: "incomplete" | "complete";
        payment: "unpaid" | "paid";
      };
    };
  }
}
