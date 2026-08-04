import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { organizationsService, type OrgDto } from '@/services/organizationsService';
import { plansService, type PlanDto } from '@/services/plansService';
import {
  subscriptionsService,
  type BillingCycle,
  type SubscriptionDto,
} from '@/services/subscriptionsService';
import { Modal } from '@/components/Modal';
import { toast } from '@/store/useToastStore';
import { ApiError } from '@/lib/apiClient';

const STATUS_BADGE: Record<SubscriptionDto['status'], string> = {
  Active: 'badge-success',
  Trialing: 'badge-info',
  PastDue: 'badge-warning',
  Suspended: 'badge-danger',
  Cancelled: 'badge-neutral',
};

function ChangePlanModal({
  organizationId,
  currentPlanId,
  onClose,
  onAssigned,
}: {
  organizationId: string;
  currentPlanId?: string;
  onClose: () => void;
  onAssigned: (sub: SubscriptionDto) => void;
}) {
  const [plans, setPlans] = useState<PlanDto[] | null>(null);
  const [planId, setPlanId] = useState(currentPlanId ?? '');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('Monthly');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void (async () => {
      const data = await plansService.list(false);
      setPlans(data);
      if (!planId && data.length > 0) setPlanId(data[0].id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planId) return;
    setError(null);
    setSubmitting(true);
    try {
      const sub = await subscriptionsService.assign(organizationId, { planId, billingCycle });
      toast.success('Subscription updated.');
      onAssigned(sub);
    } catch (err) {
      setError(err instanceof ApiError ? err.allMessages.join(' ') : 'Failed to assign plan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Change plan" subtitle="Assign a subscription plan to this organization." onClose={onClose}>
      {error ? <div className="banner-error">{error}</div> : null}
      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="plan-select">Plan</label>
          {!plans ? (
            <p className="row-sub">Loading plans…</p>
          ) : (
            <select id="plan-select" className="input" value={planId} onChange={(e) => setPlanId(e.target.value)} required>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="field">
          <label htmlFor="billing-cycle">Billing cycle</label>
          <select
            id="billing-cycle"
            className="input"
            value={billingCycle}
            onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
          >
            <option value="Monthly">Monthly</option>
            <option value="Yearly">Yearly</option>
          </select>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting || !planId}>
            {submitting ? 'Saving…' : 'Assign plan'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function SubscriptionCard({ organizationId }: { organizationId: string }) {
  const [subscription, setSubscription] = useState<SubscriptionDto | null | undefined>(undefined);
  const [showChangePlan, setShowChangePlan] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const load = async () => {
    try {
      const sub = await subscriptionsService.getForOrganization(organizationId);
      setSubscription(sub);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setSubscription(null);
      } else {
        toast.error('Failed to load subscription.');
        setSubscription(null);
      }
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await subscriptionsService.cancel(organizationId);
      toast.success('Subscription cancelled.');
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.allMessages.join(' ') : 'Failed to cancel subscription.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Subscription &amp; billing</h3>
        <div className="row-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowChangePlan(true)}>
            Change plan
          </button>
          {subscription && subscription.status !== 'Cancelled' ? (
            <button type="button" className="btn btn-danger btn-sm" disabled={cancelling} onClick={() => void handleCancel()}>
              {cancelling ? '…' : 'Cancel subscription'}
            </button>
          ) : null}
        </div>
      </div>

      {subscription === undefined ? (
        <p className="row-sub" style={{ margin: 0 }}>
          Loading subscription…
        </p>
      ) : subscription === null ? (
        <p className="row-sub" style={{ margin: 0 }}>
          No plan assigned to this tenant yet.
        </p>
      ) : (
        <dl className="detail-grid">
          <div>
            <dt>Plan</dt>
            <dd>
              {subscription.planName} <span className="row-sub">({subscription.planCode})</span>
            </dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>
              <span className={`badge ${STATUS_BADGE[subscription.status]}`}>{subscription.status}</span>
            </dd>
          </div>
          <div>
            <dt>Billing cycle</dt>
            <dd>{subscription.billingCycle}</dd>
          </div>
          <div>
            <dt>Current period ends</dt>
            <dd>{subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : '—'}</dd>
          </div>
          {subscription.trialEndsAt ? (
            <div>
              <dt>Trial ends</dt>
              <dd>{new Date(subscription.trialEndsAt).toLocaleDateString()}</dd>
            </div>
          ) : null}
        </dl>
      )}

      {showChangePlan ? (
        <ChangePlanModal
          organizationId={organizationId}
          currentPlanId={subscription?.planId}
          onClose={() => setShowChangePlan(false)}
          onAssigned={(sub) => {
            setSubscription(sub);
            setShowChangePlan(false);
          }}
        />
      ) : null}
    </div>
  );
}

function EditOrgModal({
  org,
  onClose,
  onSaved,
}: {
  org: OrgDto;
  onClose: () => void;
  onSaved: (org: OrgDto) => void;
}) {
  const [name, setName] = useState(org.name);
  const [slug, setSlug] = useState(org.slug);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const updated = await organizationsService.update(org.id, { name: name.trim(), slug: slug.trim() });
      toast.success('Organization updated.');
      onSaved(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.allMessages.join(' ') : 'Failed to update organization.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Edit organization" onClose={onClose}>
      {error ? <div className="banner-error">{error}</div> : null}
      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="edit-name">Organization name</label>
          <input id="edit-name" className="input" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        </div>
        <div className="field">
          <label htmlFor="edit-slug">Slug</label>
          <input id="edit-slug" className="input" value={slug} onChange={(e) => setSlug(e.target.value)} required />
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function OrganizationDetailPage() {
  const { organizationId } = useParams();
  const [org, setOrg] = useState<OrgDto | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!organizationId) return;
    void (async () => {
      try {
        const data = await organizationsService.get(organizationId);
        setOrg(data);
      } catch {
        setNotFound(true);
      }
    })();
  }, [organizationId]);

  const toggleActive = async () => {
    if (!org) return;
    setBusy(true);
    try {
      if (org.isActive) {
        await organizationsService.suspend(org.id);
        toast.success(`${org.name} has been suspended.`);
      } else {
        await organizationsService.activate(org.id);
        toast.success(`${org.name} has been reactivated.`);
      }
      setOrg({ ...org, isActive: !org.isActive });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.allMessages.join(' ') : 'Action failed.');
    } finally {
      setBusy(false);
    }
  };

  if (notFound) {
    return (
      <div className="state-block">
        <h3>Organization not found</h3>
        <p>It may have been removed, or you may not have access.</p>
        <Link to="/organizations" className="btn btn-secondary" style={{ marginTop: 12 }}>
          Back to organizations
        </Link>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="state-block">
        <div className="spinner" />
        <p>Loading organization…</p>
      </div>
    );
  }

  return (
    <div>
      <Link to="/organizations" className="row-sub" style={{ display: 'inline-block', marginBottom: 12, textDecoration: 'none' }}>
        ← Back to organizations
      </Link>

      <div className="page-header">
        <div>
          <h1>{org.name}</h1>
          <p>/{org.slug}</p>
        </div>
        <div className="row-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setShowEdit(true)}>
            Edit details
          </button>
          <button
            type="button"
            className={`btn ${org.isActive ? 'btn-danger' : 'btn-secondary'}`}
            disabled={busy}
            onClick={() => void toggleActive()}
          >
            {busy ? '…' : org.isActive ? 'Suspend organization' : 'Reactivate organization'}
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700 }}>Overview</h3>
        <dl className="detail-grid">
          <div>
            <dt>Status</dt>
            <dd>
              <span className={`badge ${org.isActive ? 'badge-success' : 'badge-danger'}`}>
                {org.isActive ? 'Active' : 'Suspended'}
              </span>
            </dd>
          </div>
          <div>
            <dt>Slug</dt>
            <dd>{org.slug}</dd>
          </div>
          <div>
            <dt>Organization ID</dt>
            <dd className="row-sub">{org.id}</dd>
          </div>
          <div>
            <dt>Created</dt>
            <dd>{new Date(org.createdAt).toLocaleString()}</dd>
          </div>
        </dl>
      </div>

      <SubscriptionCard organizationId={org.id} />

      {showEdit ? (
        <EditOrgModal
          org={org}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => {
            setOrg(updated);
            setShowEdit(false);
          }}
        />
      ) : null}
    </div>
  );
}
