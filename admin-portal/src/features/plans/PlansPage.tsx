import { useEffect, useMemo, useState } from 'react';
import { plansService, type CreatePlanInput, type PlanDto, type UpdatePlanInput } from '@/services/plansService';
import { Modal } from '@/components/Modal';
import { toast } from '@/store/useToastStore';
import { ApiError } from '@/lib/apiClient';

function formatMoney(value: number, currency: string) {
  if (value === 0) return 'Free';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
}

interface PlanFormValues {
  code: string;
  name: string;
  description: string;
  monthlyPrice: string;
  yearlyPrice: string;
  currency: string;
  maxUsers: string;
  maxProjects: string;
  features: string;
  sortOrder: string;
}

function emptyForm(): PlanFormValues {
  return {
    code: '',
    name: '',
    description: '',
    monthlyPrice: '0',
    yearlyPrice: '0',
    currency: 'USD',
    maxUsers: '',
    maxProjects: '',
    features: '',
    sortOrder: '0',
  };
}

function formFromPlan(plan: PlanDto): PlanFormValues {
  return {
    code: plan.code,
    name: plan.name,
    description: plan.description ?? '',
    monthlyPrice: String(plan.monthlyPrice),
    yearlyPrice: String(plan.yearlyPrice),
    currency: plan.currency,
    maxUsers: plan.maxUsers?.toString() ?? '',
    maxProjects: plan.maxProjects?.toString() ?? '',
    features: plan.features.join(', '),
    sortOrder: String(plan.sortOrder),
  };
}

function PlanFormModal({
  title,
  initial,
  isEdit,
  onClose,
  onSubmit,
}: {
  title: string;
  initial: PlanFormValues;
  isEdit: boolean;
  onClose: () => void;
  onSubmit: (values: PlanFormValues) => Promise<void>;
}) {
  const [values, setValues] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof PlanFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err instanceof ApiError ? err.allMessages.join(' ') : 'Failed to save plan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title={title} onClose={onClose}>
      {error ? <div className="banner-error">{error}</div> : null}
      <form onSubmit={submit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="field">
            <label>Code</label>
            <input className="input" value={values.code} onChange={set('code')} required disabled={isEdit} />
          </div>
          <div className="field">
            <label>Name</label>
            <input className="input" value={values.name} onChange={set('name')} required />
          </div>
        </div>
        <div className="field">
          <label>Description</label>
          <input className="input" value={values.description} onChange={set('description')} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <div className="field">
            <label>Monthly price</label>
            <input className="input" type="number" min="0" step="0.01" value={values.monthlyPrice} onChange={set('monthlyPrice')} required />
          </div>
          <div className="field">
            <label>Yearly price</label>
            <input className="input" type="number" min="0" step="0.01" value={values.yearlyPrice} onChange={set('yearlyPrice')} required />
          </div>
          <div className="field">
            <label>Currency</label>
            <input className="input" value={values.currency} onChange={set('currency')} maxLength={3} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <div className="field">
            <label>Max users</label>
            <input className="input" type="number" min="0" placeholder="Unlimited" value={values.maxUsers} onChange={set('maxUsers')} />
          </div>
          <div className="field">
            <label>Max projects</label>
            <input className="input" type="number" min="0" placeholder="Unlimited" value={values.maxProjects} onChange={set('maxProjects')} />
          </div>
          <div className="field">
            <label>Sort order</label>
            <input className="input" type="number" value={values.sortOrder} onChange={set('sortOrder')} />
          </div>
        </div>
        <div className="field">
          <label>Features</label>
          <input className="input" placeholder="api, sso, audit" value={values.features} onChange={set('features')} />
          <span className="field-hint">Comma-separated feature codes.</span>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create plan'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function PlansPage() {
  const [plans, setPlans] = useState<PlanDto[] | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<PlanDto | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => setPlans(await plansService.list(true));

  useEffect(() => {
    void load();
  }, []);

  const sorted = useMemo(
    () => [...(plans ?? [])].sort((a, b) => a.sortOrder - b.sortOrder || a.monthlyPrice - b.monthlyPrice),
    [plans],
  );

  const toggleActive = async (plan: PlanDto) => {
    setBusyId(plan.id);
    try {
      if (plan.isActive) {
        await plansService.deactivate(plan.id);
        toast.success(`${plan.name} deactivated.`);
      } else {
        await plansService.activate(plan.id);
        toast.success(`${plan.name} activated.`);
      }
      setPlans((prev) => prev?.map((p) => (p.id === plan.id ? { ...p, isActive: !p.isActive } : p)) ?? null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.allMessages.join(' ') : 'Action failed.');
    } finally {
      setBusyId(null);
    }
  };

  const parseInput = (values: PlanFormValues) => ({
    name: values.name.trim(),
    description: values.description.trim() || null,
    monthlyPrice: Number(values.monthlyPrice) || 0,
    yearlyPrice: Number(values.yearlyPrice) || 0,
    currency: values.currency.trim().toUpperCase() || 'USD',
    maxUsers: values.maxUsers.trim() === '' ? null : Number(values.maxUsers),
    maxProjects: values.maxProjects.trim() === '' ? null : Number(values.maxProjects),
    features: values.features
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean),
    sortOrder: Number(values.sortOrder) || 0,
  });

  const handleCreate = async (values: PlanFormValues) => {
    const parsed = parseInput(values);
    const payload: CreatePlanInput = { ...parsed, code: values.code.trim().toLowerCase() };
    const plan = await plansService.create(payload);
    toast.success(`${plan.name} plan created.`);
    setPlans((prev) => (prev ? [...prev, plan] : [plan]));
    setShowCreate(false);
  };

  const handleEdit = async (values: PlanFormValues) => {
    if (!editing) return;
    const payload: UpdatePlanInput = parseInput(values);
    const updated = await plansService.update(editing.id, payload);
    toast.success(`${updated.name} updated.`);
    setPlans((prev) => prev?.map((p) => (p.id === updated.id ? updated : p)) ?? null);
    setEditing(null);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Plans</h1>
          <p>Define pricing tiers and feature limits offered to tenants.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + Create plan
        </button>
      </div>

      {!plans ? (
        <div className="state-block">
          <div className="spinner" />
          <p>Loading plans…</p>
        </div>
      ) : sorted.length === 0 ? (
        <div className="state-block">
          <h3>No plans yet</h3>
          <p>Create your first pricing plan to start assigning subscriptions.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {sorted.map((plan) => (
            <div key={plan.id} className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{plan.name}</div>
                  <div className="row-sub">{plan.code}</div>
                </div>
                <span className={`badge ${plan.isActive ? 'badge-success' : 'badge-neutral'}`}>
                  {plan.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{formatMoney(plan.monthlyPrice, plan.currency)}</div>
                {plan.monthlyPrice > 0 ? <div className="row-sub">per month · {formatMoney(plan.yearlyPrice, plan.currency)}/yr</div> : null}
              </div>

              {plan.description ? <p className="row-sub" style={{ margin: 0 }}>{plan.description}</p> : null}

              <div className="row-sub">
                {plan.maxUsers ? `${plan.maxUsers} users` : 'Unlimited users'} ·{' '}
                {plan.maxProjects ? `${plan.maxProjects} projects` : 'Unlimited projects'}
              </div>

              {plan.features.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {plan.features.map((f) => (
                    <span key={f} className="badge badge-neutral">
                      {f}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="row-actions" style={{ justifyContent: 'flex-start', marginTop: 'auto' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(plan)}>
                  Edit
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${plan.isActive ? 'btn-danger' : 'btn-secondary'}`}
                  disabled={busyId === plan.id}
                  onClick={() => toggleActive(plan)}
                >
                  {busyId === plan.id ? '…' : plan.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate ? (
        <PlanFormModal
          title="Create plan"
          initial={emptyForm()}
          isEdit={false}
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
        />
      ) : null}

      {editing ? (
        <PlanFormModal
          title="Edit plan"
          initial={formFromPlan(editing)}
          isEdit
          onClose={() => setEditing(null)}
          onSubmit={handleEdit}
        />
      ) : null}
    </div>
  );
}
