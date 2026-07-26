declare module 'express-session' {
  interface SessionData {
    isAdmin?: boolean;
  }
}

export {};
