import { api } from '@/lib/apiClient';

export type SubscriptionStatus = 'Trialing' | 'Active' | 'PastDue' | 'Cancelled' | 'Suspended';
export type BillingCycle = 'Monthly' | 'Yearly';

export interface SubscriptionDto {
  id: string;
  organizationId: string;
  organizationName: string;
  planId: string;
  planName: string;
  planCode: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  startedAt: string;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  cancelledAt: string | null;
}

export interface AssignSubscriptionInput {
  planId: string;
  billingCycle: BillingCycle;
  trialEndsAt?: string | null;
}

export const subscriptionsService = {
  list: () => api.get<SubscriptionDto[]>('/api/superadmin/subscriptions'),
  getForOrganization: (organizationId: string) =>
    api.get<SubscriptionDto>(`/api/superadmin/organizations/${organizationId}/subscription`),
  assign: (organizationId: string, data: AssignSubscriptionInput) =>
    api.post<SubscriptionDto>(`/api/superadmin/organizations/${organizationId}/subscription`, data),
  cancel: (organizationId: string) =>
    api.del<void>(`/api/superadmin/organizations/${organizationId}/subscription`),
};
