/**
 * Product (platform) branding for Cadence.
 *
 * This is the SaaS product itself — shown on the login/register hero and as the
 * wordmark in the app chrome. Individual tenant organizations keep their own
 * names, which are shown alongside this once a user is signed in.
 *
 * Everything here is centralized so the product can be re-skinned in one place.
 */
export interface BrandConfig {
  /** Product name, e.g. "Cadence". */
  name: string;
  /** Optional secondary word/tagline rendered next to the name (may be empty). */
  suffix: string;
  /** Single-character mark shown in the logo tile. */
  logoMark: string;
  /** Login hero headline. */
  heroTitle: string;
  /** Login hero supporting copy. */
  heroSubtitle: string;
  /** Sign-in card subtitle. */
  signInSubtitle: string;
  /** Social-proof line on the login hero. */
  clients: string[];
  /** Default brand accent (hex). Also selectable in the tweaks panel. */
  defaultAccent: string;
}

export const brand: BrandConfig = {
  name: 'Cadence',
  suffix: '',
  logoMark: 'C',
  heroTitle: 'Time, accounted for.',
  heroSubtitle:
    'Log hours, track project health, and approve timesheets — one fast, focused workspace for every team in your organization.',
  signInSubtitle: 'Sign in to your workspace',
  clients: ['Nexbank', 'Vertex Retail', 'MedCore Health', 'GreenGrid Energy'],
  defaultAccent: '#4757E6',
};
