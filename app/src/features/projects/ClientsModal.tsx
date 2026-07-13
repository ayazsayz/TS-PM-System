import { useEffect, useState, type FormEvent } from 'react';
import { Button, Icon, Modal } from '@/components';
import { ApiError } from '@/lib/apiClient';
import { clientsService, type Client } from '@/services/projectsService';
import { useUiStore } from '@/store/useUiStore';
import styles from './Projects.module.css';

export function ClientsModal({ onClose }: { onClose: () => void }) {
  const toast = useUiStore((s) => s.showToast);

  const [clients, setClients] = useState<Client[]>([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      setClients(await clientsService.list());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load clients.');
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    setBusy(true);
    try {
      await clientsService.create(name.trim());
      toast(`${name.trim()} added`);
      setName('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add the client.');
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async (id: string) => {
    setError(null);
    try {
      await clientsService.update(id, editName.trim());
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not rename the client.');
    }
  };

  const remove = async (c: Client) => {
    setError(null);
    try {
      await clientsService.remove(c.id);
      toast(`${c.name} deleted`);
      await load();
    } catch (err) {
      // Deleting a client with projects is blocked server-side — surface why.
      setError(err instanceof ApiError ? err.message : 'Could not delete the client.');
    }
  };

  return (
    <Modal
      title="Clients"
      onClose={onClose}
      width={480}
      footer={
        <Button variant="primary" onClick={onClose}>
          Done
        </Button>
      }
    >
      {error && (
        <div className={styles.formError} role="alert">
          {error}
        </div>
      )}

      <form onSubmit={add} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New client name…"
          className={styles.input}
          style={{ flex: 1 }}
        />
        <Button type="submit" variant="primary" disabled={busy || !name.trim()}>
          <Icon name="plus" size={13} />
          Add
        </Button>
      </form>

      {clients.length === 0 && (
        <div className={styles.hint} style={{ textAlign: 'center', padding: '18px 0' }}>
          No clients yet. Add your first one above.
        </div>
      )}

      {clients.map((c) => (
        <div key={c.id} className={styles.clientRow}>
          {editingId === c.id ? (
            <>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className={styles.input}
                style={{ flex: 1 }}
                autoFocus
              />
              <button className={styles.linkBtn} onClick={() => saveEdit(c.id)}>
                Save
              </button>
              <button className={styles.linkBtn} onClick={() => setEditingId(null)}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <div className={styles.clientName}>
                {c.name}
                <div className={styles.clientMeta}>
                  {c.projectCount} {c.projectCount === 1 ? 'project' : 'projects'}
                </div>
              </div>
              <button
                className={styles.linkBtn}
                onClick={() => {
                  setEditingId(c.id);
                  setEditName(c.name);
                }}
              >
                Rename
              </button>
              <button
                className={styles.linkBtn}
                style={{ color: 'var(--red)' }}
                onClick={() => remove(c)}
              >
                Delete
              </button>
            </>
          )}
        </div>
      ))}
    </Modal>
  );
}
