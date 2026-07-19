import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Badge, Button, Card, Icon, Modal, PageContainer } from '@/components';
import { ApiError } from '@/lib/apiClient';
import { captureLocation, officesService, type Office } from '@/services/attendanceService';
import { useUiStore } from '@/store/useUiStore';
import styles from '../attendance/Attendance.module.css';

export default function OfficesPage() {
  const toast = useUiStore((s) => s.showToast);

  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Office | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOffices(await officesService.list());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load offices.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const remove = async (o: Office) => {
    try {
      await officesService.remove(o.id);
      toast(`${o.name} deleted`);
      void load();
    } catch (err) {
      // Blocked when attendance references it — surface the reason.
      toast(err instanceof ApiError ? err.message : 'Could not delete the office.');
    }
  };

  return (
    <PageContainer>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Offices</h1>
          <div className={styles.subtitle}>
            Check-ins within an office’s radius are labelled “In office”. Everything else is “Off-site”.
          </div>
        </div>
        <Button variant="primary" onClick={() => setShowForm(true)}>
          <Icon name="plus" size={13} />
          Add office
        </Button>
      </div>

      <Card pad={false} style={{ overflow: 'hidden' }}>
        <div
          className={styles.officeRow}
          style={{ background: 'var(--surface2)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text3)' }}
        >
          <div>NAME</div>
          <div>COORDINATES</div>
          <div>RADIUS</div>
          <div>STATUS</div>
          <div style={{ textAlign: 'right' }}>ACTIONS</div>
        </div>

        {loading && <div className={styles.empty}>Loading…</div>}
        {!loading && error && (
          <div className={styles.empty} style={{ color: 'var(--red)' }}>
            {error}
          </div>
        )}
        {!loading && !error && offices.length === 0 && (
          <div className={styles.empty}>
            No offices yet — add one so check-ins can be recognised as “In office”.
          </div>
        )}

        {offices.map((o) => (
          <div key={o.id} className={styles.officeRow}>
            <div className={styles.officeName}>{o.name}</div>
            <div className={styles.coords}>
              {o.latitude.toFixed(5)}, {o.longitude.toFixed(5)}{' '}
              <a
                href={`https://www.google.com/maps?q=${o.latitude},${o.longitude}`}
                target="_blank"
                rel="noreferrer"
                className={styles.mapLink}
              >
                map ↗
              </a>
            </div>
            <div className="tnum">{o.radiusMeters} m</div>
            <div>
              <Badge tone={o.isActive ? 'green' : 'neutral'}>{o.isActive ? 'Active' : 'Inactive'}</Badge>
            </div>
            <div className={styles.actions}>
              <button className={styles.linkBtn} onClick={() => setEditing(o)}>
                Edit
              </button>
              <button className={`${styles.linkBtn} ${styles.danger}`} onClick={() => remove(o)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </Card>

      {(showForm || editing) && (
        <OfficeFormModal
          office={editing ?? undefined}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditing(null);
            toast(editing ? 'Office updated' : 'Office added');
            void load();
          }}
        />
      )}
    </PageContainer>
  );
}

function OfficeFormModal({
  office,
  onClose,
  onSaved,
}: {
  office?: Office;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(office);
  const [name, setName] = useState(office?.name ?? '');
  const [latitude, setLatitude] = useState(office ? String(office.latitude) : '');
  const [longitude, setLongitude] = useState(office ? String(office.longitude) : '');
  const [radius, setRadius] = useState(String(office?.radiusMeters ?? 150));
  const [isActive, setIsActive] = useState(office?.isActive ?? true);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);

  const useMyLocation = async () => {
    setLocating(true);
    const loc = await captureLocation();
    setLocating(false);
    if (loc.status === 'Provided' && loc.latitude != null && loc.longitude != null) {
      setLatitude(String(loc.latitude));
      setLongitude(String(loc.longitude));
    } else {
      setErrors([
        loc.status === 'Denied'
          ? 'Location permission was denied — enter the coordinates manually.'
          : 'Could not get a position — enter the coordinates manually.',
      ]);
    }
  };

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    setErrors([]);
    setBusy(true);
    try {
      const payload = {
        name,
        latitude: Number(latitude),
        longitude: Number(longitude),
        radiusMeters: Number(radius) || 150,
        isActive,
      };
      if (isEdit && office) await officesService.update(office.id, payload);
      else await officesService.create(payload);
      onSaved();
    } catch (err) {
      setErrors(err instanceof ApiError ? err.allMessages : ['Could not save the office.']);
    } finally {
      setBusy(false);
    }
  };

  const valid = name && latitude !== '' && longitude !== '';

  return (
    <Modal
      title={isEdit ? `Edit ${office!.name}` : 'Add office'}
      onClose={onClose}
      width={520}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => submit()} disabled={busy || !valid}>
            {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Create office'}
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
          <label className={styles.label} htmlFor="oname">
            Office name
          </label>
          <input
            id="oname"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="HQ"
            className={styles.input}
          />
        </div>

        <div className={`${styles.field} ${styles.row2}`}>
          <div>
            <label className={styles.label} htmlFor="lat">
              Latitude
            </label>
            <input
              id="lat"
              required
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="24.86070"
              className={styles.input}
            />
          </div>
          <div>
            <label className={styles.label} htmlFor="lng">
              Longitude
            </label>
            <input
              id="lng"
              required
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="67.00110"
              className={styles.input}
            />
          </div>
        </div>

        <Button variant="secondary" type="button" onClick={useMyLocation} disabled={locating}>
          <Icon name="search" size={13} />
          {locating ? 'Locating…' : 'Use my current location'}
        </Button>

        <div className={styles.field} style={{ marginTop: 14 }}>
          <label className={styles.label} htmlFor="radius">
            Radius (metres)
          </label>
          <input
            id="radius"
            type="number"
            min="10"
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
            className={styles.input}
          />
          <div className={styles.hint}>
            How close a check-in must be to count as “In office”. 150 m suits a typical building;
            widen it for a campus.
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            style={{ accentColor: 'var(--accent)' }}
          />
          Active — include this office when matching check-ins
        </label>
      </form>
    </Modal>
  );
}
