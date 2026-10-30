import { Allocation, AllocationStatus } from '../../services/apiHelpers';

export type AllocationFilter = 'all' | 'allocated' | 'not-allocated';

export const ALLOCATION_FILTERS: AllocationFilter[] = ['all', 'allocated', 'not-allocated'];

// Mirrors the allowed status changes enforced by the API
export const STATUS_TRANSITIONS: Record<AllocationStatus, AllocationStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['pending', 'paid', 'cancelled'],
  paid: ['confirmed', 'cancelled'],
  cancelled: [],
};

export const STATUS_BADGES: Record<AllocationStatus, string> = {
  pending: 'bg-secondary',
  confirmed: 'bg-primary',
  paid: 'bg-success',
  cancelled: 'bg-danger',
};

// Runs a mutation, then reloads the page data; shows the server message on failure
export type RunAction = (action: () => Promise<unknown>, fallback: string) => Promise<void>;

// Active (non-cancelled) allocations grouped by member / unit enrollment id
export type AllocationsByEnrollment = Map<number, Allocation[]>;

export const matchesFilter = (filter: AllocationFilter, hasAllocation: boolean) =>
  filter === 'all' || (filter === 'allocated') === hasAllocation;
