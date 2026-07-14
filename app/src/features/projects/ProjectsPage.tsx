import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Card, Icon, PageContainer, type Tone } from '@/components';
import { ApiError } from '@/lib/apiClient';
import {
  clientsService,
  projectsService,
  type Client,
  type Project,
  type ProjectHealth,
} from '@/services/projectsService';
import { useAuthStore } from '@/store/useAuthStore';
import { useUiStore } from '@/store/useUiStore';
import { ProjectFormModal } from './ProjectFormModal';
import { ClientsModal } from './ClientsModal';
import styles from './Projects.module.css';

const FILTERS = ['All', 'Running', 'At risk', 'Completed'];

const healthTone: Record<ProjectHealth, Tone> = {
  'On track': 'green',
  'At risk': 'amber',
  'Over budget': 'red',
  Delayed: 'red',
  Completed: 'neutral',
};

const money = (n: number) =>
  n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const hrs = (n: number) => `${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}h`;

export default function ProjectsPage() {
  const toast = useUiStore((s) => s.showToast);
  const hasRole = useAuthStore((s) => s.hasRole);
  const canManage = hasRole('Manager') || hasRole('Admin');

  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [showClients, setShowClients] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, c] = await Promise.all([projectsService.list(filter), clientsService.list()]);
      setProjects(p);
      setClients(c);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load projects.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const saved = (verb: string) => {
    setShowForm(false);
    setEditing(null);
    toast(`Project ${verb}`);
    void load();
  };

  const archive = async (p: Project) => {
    try {
      await projectsService.setArchived(p.id, true);
      toast(`${p.name} archived`);
      void load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Could not archive project.');
    }
  };

  const clientCount = new Set(projects.map((p) => p.clientId)).size;

  return (
    <PageContainer>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Projects</h1>
          <div className={styles.subtitle}>
            {projects.length} {projects.length === 1 ? 'project' : 'projects'} · {clientCount}{' '}
            {clientCount === 1 ? 'client' : 'clients'}
          </div>
        </div>
        {canManage && (
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" onClick={() => setShowClients(true)}>
              Manage clients
            </Button>
            <Button variant="primary" onClick={() => setShowForm(true)}>
              <Icon name="plus" size={13} />
              New project
            </Button>
          </div>
        )}
      </div>

      <div className={styles.chips}>
        {FILTERS.map((f) => (
          <span
            key={f}
            onClick={() => setFilter(f)}
            className={`${styles.chip} ${filter === f ? styles.chipActive : ''}`}
          >
            {f}
          </span>
        ))}
      </div>

      {loading && <Card><div className={styles.empty}>Loading projects…</div></Card>}

      {!loading && error && (
        <Card>
          <div className={styles.empty} style={{ color: 'var(--red)' }}>
            {error}
          </div>
        </Card>
      )}

      {/* Empty states differ: no projects at all vs. none matching the filter. */}
      {!loading && !error && projects.length === 0 && (
        <Card>
          <div className={styles.empty}>
            {filter !== 'All' ? (
              <>No projects match “{filter}”.</>
            ) : clients.length === 0 ? (
              <>
                <div className={styles.emptyTitle}>No clients yet</div>
                <div style={{ marginBottom: 16 }}>
                  Add a client first, then create your first project against it.
                </div>
                {canManage && (
                  <Button variant="primary" onClick={() => setShowClients(true)}>
                    Add a client
                  </Button>
                )}
              </>
            ) : (
              <>
                <div className={styles.emptyTitle}>No projects yet</div>
                <div style={{ marginBottom: 16 }}>
                  Create a project so your team can start logging time against it.
                </div>
                {canManage && (
                  <Button variant="primary" onClick={() => setShowForm(true)}>
                    <Icon name="plus" size={13} />
                    New project
                  </Button>
                )}
              </>
            )}
          </div>
        </Card>
      )}

      {!loading && !error && projects.length > 0 && (
        <div className={styles.grid}>
          {projects.map((p) => (
            <Card key={p.id} hoverable style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
                <span className={styles.swatch} style={{ background: p.colorHex }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className={styles.projName}>{p.name}</div>
                  <div className={styles.projMeta}>
                    {p.client}
                    {p.due ? ` · due ${p.due}` : ''}
                  </div>
                </div>
                <Badge tone={healthTone[p.health]}>{p.health}</Badge>
              </div>

              <div>
                <div className={styles.barLabel}>
                  <span>Completion</span>
                  <span className="tnum" style={{ fontWeight: 700, color: 'var(--text)' }}>
                    {p.completionPct}%
                  </span>
                </div>
                <div className={styles.track}>
                  <div style={{ width: `${p.completionPct}%`, height: '100%', borderRadius: 99, background: p.colorHex }} />
                </div>
              </div>

              <div className={styles.stats}>
                <Stat label="ESTIMATED" value={hrs(p.estimatedHours)} />
                <Stat label="ACTUAL" value={hrs(p.actualHours)} />
                <Stat
                  label="REMAINING"
                  value={p.remainingHours >= 0 ? `${hrs(p.remainingHours)} left` : `${hrs(Math.abs(p.remainingHours))} over`}
                  color={p.remainingHours >= 0 ? 'var(--text2)' : 'var(--red)'}
                />
              </div>

              <div>
                <div className={styles.barLabel}>
                  <span>
                    Budget · {money(p.spent)} of {money(p.budget)}
                    {p.hourlyRate > 0 && ` · $${p.hourlyRate}/h`}
                  </span>
                  <span
                    className="tnum"
                    style={{
                      fontWeight: 700,
                      color:
                        p.budgetPercent > 100
                          ? 'var(--red)'
                          : p.budgetPercent > 90
                            ? 'var(--amber)'
                            : 'var(--accent)',
                    }}
                  >
                    {p.budgetPercent}%
                  </span>
                </div>
                <div className={styles.track}>
                  <div
                    style={{
                      width: `${Math.min(100, p.budgetPercent)}%`,
                      height: '100%',
                      borderRadius: 99,
                      background:
                        p.budgetPercent > 100
                          ? 'var(--red)'
                          : p.budgetPercent > 90
                            ? 'var(--amber)'
                            : 'var(--accent)',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                <div style={{ display: 'flex' }}>
                  {p.team.length === 0 && <span className={styles.noTeam}>No team assigned</span>}
                  {p.team.map((m, i) => (
                    <div
                      key={m.userId}
                      title={m.fullName}
                      className={styles.teamAvatar}
                      style={{ background: m.avatarColor, marginLeft: i === 0 ? 0 : -6 }}
                    >
                      {m.initials}
                    </div>
                  ))}
                </div>
                {canManage && (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className={styles.linkBtn} onClick={() => setEditing(p)}>
                      Edit
                    </button>
                    <button className={styles.linkBtn} onClick={() => archive(p)}>
                      Archive
                    </button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {(showForm || editing) && (
        <ProjectFormModal
          project={editing ?? undefined}
          clients={clients}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={() => saved(editing ? 'updated' : 'created')}
          onManageClients={() => {
            setShowForm(false);
            setEditing(null);
            setShowClients(true);
          }}
        />
      )}

      {showClients && (
        <ClientsModal
          onClose={() => {
            setShowClients(false);
            void load();
          }}
        />
      )}
    </PageContainer>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className={styles.stat}>
      <div className={styles.statLabel}>{label}</div>
      <div className="tnum" style={{ fontSize: 14, fontWeight: 700, color }}>
        {value}
      </div>
    </div>
  );
}
