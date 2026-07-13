import { useEffect, useState, type FormEvent } from 'react';
import { Button, Modal } from '@/components';
import { ApiError } from '@/lib/apiClient';
import {
  PROJECT_COLORS,
  PROJECT_HEALTHS,
  directoryService,
  projectsService,
  type Client,
  type Project,
  type ProjectHealth,
  type UserPickerItem,
} from '@/services/projectsService';
import styles from './Projects.module.css';

interface Props {
  /** Present = edit mode. */
  project?: Project;
  clients: Client[];
  onClose: () => void;
  onSaved: () => void;
  onManageClients: () => void;
}

export function ProjectFormModal({ project, clients, onClose, onSaved, onManageClients }: Props) {
  const isEdit = Boolean(project);

  const [name, setName] = useState(project?.name ?? '');
  const [clientId, setClientId] = useState(project?.clientId ?? clients[0]?.id ?? '');
  const [colorHex, setColorHex] = useState(project?.colorHex ?? PROJECT_COLORS[0]);
  const [estimatedHours, setEstimatedHours] = useState(String(project?.estimatedHours ?? ''));
  const [budget, setBudget] = useState(String(project?.budget ?? ''));
  const [hourlyRate, setHourlyRate] = useState(String(project?.hourlyRate ?? ''));
  const [dueDate, setDueDate] = useState('');
  const [health, setHealth] = useState<ProjectHealth>(project?.health ?? 'On track');
  const [completionPct, setCompletionPct] = useState(String(project?.completionPct ?? 0));
  const [team, setTeam] = useState<string[]>(project?.team.map((m) => m.userId) ?? []);

  const [users, setUsers] = useState<UserPickerItem[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    directoryService.users().then(setUsers).catch(() => setUsers([]));
  }, []);

  const toggleMember = (id: string) =>
    setTeam((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    setErrors([]);

    if (!clientId) {
      setErrors(['Select a client first — add one via “Manage clients”.']);
      return;
    }

    setBusy(true);
    try {
      const payload = {
        name,
        clientId,
        colorHex,
        estimatedHours: Number(estimatedHours) || 0,
        budget: Number(budget) || 0,
        hourlyRate: Number(hourlyRate) || 0,
        dueDate: dueDate || null,
        health,
        completionPct: Number(completionPct) || 0,
        warn: null,
        isInternal: false,
        teamUserIds: team,
      };
      if (isEdit && project) await projectsService.update(project.id, payload);
      else await projectsService.create(payload);
      onSaved();
    } catch (err) {
      setErrors(err instanceof ApiError ? err.allMessages : ['Could not save the project.']);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={isEdit ? `Edit ${project!.name}` : 'New project'}
      onClose={onClose}
      width={560}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => submit()} disabled={busy || !name}>
            {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Create project'}
          </Button>
        </>
      }
    >
      <form onSubmit={submit}>
        {errors.length > 0 && (
          <div className={styles.formError} role="alert">
            {errors.map((e, i) => (
              <div key={i}>{e}</div>
            ))}
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.label} htmlFor="pname">
            Project name
          </label>
          <input
            id="pname"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Website Rebuild"
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="pclient">
            Client
          </label>
          {clients.length === 0 ? (
            <div className={styles.hint}>
              No clients yet.{' '}
              <button type="button" className={styles.linkBtn} onClick={onManageClients}>
                Add a client
              </button>{' '}
              to continue.
            </div>
          ) : (
            <select
              id="pclient"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className={styles.select}
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className={`${styles.field} ${styles.row3}`}>
          <div>
            <label className={styles.label} htmlFor="pest">
              Estimated hours
            </label>
            <input
              id="pest"
              type="number"
              min="0"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
              placeholder="200"
              className={styles.input}
            />
          </div>
          <div>
            <label className={styles.label} htmlFor="pbudget">
              Budget ($)
            </label>
            <input
              id="pbudget"
              type="number"
              min="0"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="50000"
              className={styles.input}
            />
          </div>
          <div>
            <label className={styles.label} htmlFor="prate">
              Rate ($/h)
            </label>
            <input
              id="prate"
              type="number"
              min="0"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              placeholder="150"
              className={styles.input}
            />
          </div>
        </div>
        <div className={styles.hint} style={{ marginTop: -8, marginBottom: 14 }}>
          Spend is calculated automatically as <strong>logged hours × rate</strong>.
        </div>

        <div className={`${styles.field} ${styles.row3}`}>
          <div>
            <label className={styles.label} htmlFor="pdue">
              Due date
            </label>
            <input
              id="pdue"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={styles.input}
            />
          </div>
          <div>
            <label className={styles.label} htmlFor="phealth">
              Health
            </label>
            <select
              id="phealth"
              value={health}
              onChange={(e) => setHealth(e.target.value as ProjectHealth)}
              className={styles.select}
            >
              {PROJECT_HEALTHS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={styles.label} htmlFor="pcomp">
              Completion (%)
            </label>
            <input
              id="pcomp"
              type="number"
              min="0"
              max="100"
              value={completionPct}
              onChange={(e) => setCompletionPct(e.target.value)}
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Color</label>
          <div className={styles.colors}>
            {PROJECT_COLORS.map((c) => (
              <div
                key={c}
                onClick={() => setColorHex(c)}
                className={styles.colorDot}
                style={{
                  background: c,
                  boxShadow:
                    c.toLowerCase() === colorHex.toLowerCase()
                      ? `0 0 0 2px var(--surface), 0 0 0 4px ${c}`
                      : 'none',
                }}
              />
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>
            Team {team.length > 0 && <span style={{ color: 'var(--text3)' }}>({team.length})</span>}
          </label>
          {users.length === 0 ? (
            <div className={styles.hint}>No users available.</div>
          ) : (
            users.map((u) => {
              const active = team.includes(u.id);
              return (
                <label
                  key={u.id}
                  className={`${styles.memberRow} ${active ? styles.memberRowActive : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggleMember(u.id)}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <div className={styles.memberAvatar} style={{ background: u.avatarColor }}>
                    {u.initials}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{u.fullName}</div>
                    {u.department && <div className={styles.clientMeta}>{u.department}</div>}
                  </div>
                </label>
              );
            })
          )}
        </div>
      </form>
    </Modal>
  );
}
