/* tslint:disable */
/* eslint-disable */
/**
/* This file was automatically generated from pydantic models by running pydantic2ts.
/* Do not modify it by hand - just update the pydantic models and then re-run the script
*/

export interface JsonEndpoint {}
export interface Login {
  authorization_code?: string;
}
export interface LoginResponse {
  success?: boolean;
  email?: string;
  access_token?: string;
  app_key?: string;
}
export interface OauthTokenResponse {
  access_token: string;
  account_id: string;
  expires_in: number;
  refresh_token: string;
  token_type: string;
  uid: string;
}
export interface User {
  id?: number;
  account_id: string;
  email: string;
  refresh_token: string;
}
export interface Orm {}
export interface SyncCursor {
  id?: number;
  user_id: number;
  value?: string;
}
