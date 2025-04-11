declare module 'passport-azure-ad-oauth2' {
  import { Strategy as PassportStrategy } from 'passport';
  
  export interface StrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    resource: string;
    tenant?: string;
    scope?: string | string[];
  }
  
  export type VerifyFunction = (
    accessToken: string,
    refreshToken: string,
    params: { [key: string]: any },
    profile: any,
    done: (error: any, user?: any, info?: any) => void
  ) => void;
  
  export class Strategy extends PassportStrategy {
    constructor(options: StrategyOptions, verify: VerifyFunction);
    name: string;
    authenticate(req: any, options?: any): any;
  }
}

declare module 'jsonwebtoken' {
  export function decode(token: string, options?: any): any;
  export function verify(token: string, secretOrPublicKey: string, options?: any, callback?: (err: any, decoded: any) => void): any;
  export function sign(payload: string | Object | Buffer, secretOrPrivateKey: string, options?: any): string;
}