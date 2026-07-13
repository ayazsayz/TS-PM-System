import { useState } from 'react';
import { Button, Icon, Modal } from '@/components';
import styles from './Users.module.css';

interface Props {
  userName: string;
  password: string;
  onClose: () => void;
}

/**
 * Reveals the generated one-time password exactly once. The server never returns
 * it again, so the admin must copy it now.
 */
export function OneTimePasswordModal({ userName, password, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the admin can still select the text manually */
    }
  };

  return (
    <Modal
      title="One-time password"
      onClose={onClose}
      width={460}
      footer={
        <Button variant="primary" onClick={onClose}>
          Done — I've saved it
        </Button>
      }
    >
      <p style={{ margin: '0 0 4px', fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.6 }}>
        Share this password with <strong style={{ color: 'var(--text)' }}>{userName}</strong>. They
        will be required to change it the first time they sign in.
      </p>

      <div className={styles.otpBox}>
        <code className={styles.otpValue}>{password}</code>
        <Button variant="secondary" size="sm" onClick={copy}>
          <Icon name={copied ? 'check' : 'copy'} size={13} />
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>

      <div className={styles.warn}>
        <Icon name="alert" size={14} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          This password is shown <strong>only once</strong> and cannot be retrieved later. If you
          lose it, use <strong>Reset</strong> to generate a new one.
        </span>
      </div>
    </Modal>
  );
}
