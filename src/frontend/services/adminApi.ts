import axios from 'axios';

const AUTH_TOKEN_KEY = 'auth_token';

const adminApi = axios.create({ baseURL: '/api', withCredentials: true });

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Returns the first validation error if present, otherwise the server message
export const apiErrorMessage = (err: any, fallback: string): string => {
  const errors = err?.response?.data?.errors;
  if (errors) {
    const first = Object.values(errors)[0] as string[] | undefined;
    if (first?.[0]) return first[0];
  }
  return err?.response?.data?.message || fallback;
};

export type Location = { id: number; name: string; units_count: number };
export type Unit = { id: number; location_id: number; code: string; category: string | null };

export const locationsApi = {
  list: () => adminApi.get<{ locations: Location[] }>('/locations').then((r) => r.data.locations),
  create: (data: { name: string }) => adminApi.post<{ location: Location }>('/locations', data).then((r) => r.data.location),
  update: (id: number, data: { name: string }) =>
    adminApi.put<{ location: Location }>(`/locations/${id}`, data).then((r) => r.data.location),
  remove: (id: number) => adminApi.delete(`/locations/${id}`),
};

export type Member = {
  id: number;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  category: string | null;
  email: string | null;
  user_name: string | null;
};
export type MemberInput = {
  first_name: string;
  last_name: string;
  phone_number: string | null;
  category: string | null;
};
export type UserOption = { id: number; name: string; email: string };

export const membersApi = {
  list: () => adminApi.get<{ members: Member[] }>('/members').then((r) => r.data.members),
  candidates: () => adminApi.get<{ users: UserOption[] }>('/members/candidates').then((r) => r.data.users),
  create: (data: MemberInput & { user_id: number }) =>
    adminApi.post<{ member: Member }>('/members', data).then((r) => r.data.member),
  update: (id: number, data: MemberInput) =>
    adminApi.put<{ member: Member }>(`/members/${id}`, data).then((r) => r.data.member),
  remove: (id: number) => adminApi.delete(`/members/${id}`),
};

export type Season = { id: number; name: string; start_date: string; end_date: string };
export type SeasonInput = { name: string; start_date: string; end_date: string };

export const seasonsApi = {
  list: () => adminApi.get<{ seasons: Season[] }>('/seasons').then((r) => r.data.seasons),
  create: (data: SeasonInput) => adminApi.post<{ season: Season }>('/seasons', data).then((r) => r.data.season),
  update: (id: number, data: SeasonInput) =>
    adminApi.put<{ season: Season }>(`/seasons/${id}`, data).then((r) => r.data.season),
  remove: (id: number) => adminApi.delete(`/seasons/${id}`),
};

export type UnitInput = { code: string; category: string | null };

export const unitsApi = {
  list: (locationId: number) =>
    adminApi.get<{ units: Unit[] }>(`/locations/${locationId}/units`).then((r) => r.data.units),
  create: (locationId: number, data: UnitInput) =>
    adminApi.post<{ unit: Unit }>(`/locations/${locationId}/units`, data).then((r) => r.data.unit),
  update: (locationId: number, id: number, data: UnitInput) =>
    adminApi.put<{ unit: Unit }>(`/locations/${locationId}/units/${id}`, data).then((r) => r.data.unit),
  remove: (locationId: number, id: number) => adminApi.delete(`/locations/${locationId}/units/${id}`),
};
