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
export interface Sync {}
export interface SyncCursor {
  id?: number;
  user_id: number;
  value?: string;
}
export interface SyncResponse {
  has_more?: boolean;
  success?: boolean;
}
export interface Term {
  id?: number;
  deleted?: number;
  updated_at?: number;
  due_next_minutes?: number;
  user_id: number;
  note_path?: string;
  note_rev?: string;
  note_id?: string;
  language?: string;
  reference?: string;
  marker?: string;
  definition?: string;
  url?: string;
  related?: string;
}
export interface Terms {
  last_updated_at?: number;
  last_id?: number;
}
export interface TermsResponse {
  last_updated_at?: number;
  last_id?: number;
  terms?: Term[];
  success?: boolean;
}
export interface User {
  id?: number;
  account_id: string;
  email: string;
  refresh_token: string;
}
export interface Orm {}
