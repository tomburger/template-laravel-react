import type { AxiosRequestConfig } from 'axios';

const AUTH_TOKEN_KEY = 'auth_token';

// Options for the generated Orval endpoints: Bearer token from storage, cookies, no baseURL prefix
export const authRequestOptions = (): AxiosRequestConfig => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);

  return {
    baseURL: '',
    withCredentials: true,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  };
};

// Returns the first validation error if present, otherwise the server message
export const apiErrorMessage = (err: any, fallback: string): string => {
  const errors = err?.response?.data?.errors;
  if (errors) {
    const first = Object.values(errors)[0] as string[] | undefined;
    if (first?.[0]) return first[0];
  }
  return err?.response?.data?.message || fallback;
};

// Response shapes (the OpenAPI spec does not describe responses, so Orval returns unknown)
export type Location = { id: number; name: string; units_count: number };
export type Unit = { id: number; location_id: number; code: string; category: string | null };
export type Member = {
  id: number;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  category: string | null;
  email: string | null;
  user_name: string | null;
};
export type UserOption = { id: number; name: string; email: string };
export type Season = { id: number; name: string; start_date: string; end_date: string };
