/**
 * White-label configuration.
 *
 * This SaaS base ships branding-agnostic. Everything tenant-specific lives
 * here — swap these values (or load them per-tenant) and the whole app
 * (login hero, sidebar, titles) re-skins with no other code changes.
 *
 * The defaults below reproduce the "eTech" demo brand from the mockup.
 */
export interface BrandConfig {
  /** Short product/workspace name, e.g. "eTech" */
  name: string;
  /** Secondary product word rendered next to the name, e.g. "Timesheet" */
  suffix: string;
  /** Single-character mark shown in the logo tile */
  logoMark: string;
  /** Login hero headline */
  heroTitle: string;
  /** Login hero supporting copy */
  heroSubtitle: string;
  /** Sign-in card subtitle */
  signInSubtitle: string;
  /** Social-proof line on the login hero */
  clients: string[];
  /** Default brand accent (hex). Also selectable in the tweaks panel. */
  defaultAccent: string;
}

export const brand: BrandConfig = {
  name: 'eTech',
  suffix: 'Timesheet',
  logoMark: 'e',
  heroTitle: 'Time, accounted for.',
  heroSubtitle:
    'Log hours, track project health, and approve timesheets — in one fast, focused workspace for the whole organization.',
  signInSubtitle: 'Sign in to your eTech workspace',
  clients: ['Nexbank', 'Vertex Retail', 'MedCore Health', 'GreenGrid Energy'],
  defaultAccent: '#4757E6',
};

/** The signed-in demo user (would come from the auth session in a real app). */
export interface CurrentUser {
  name: string;
  role: string;
  initials: string;
  email: string;
}

export const currentUser: CurrentUser = {
  name: 'Alex Morgan',
  role: 'Senior Consultant',
  initials: 'AM',
  email: 'alex.morgan@etech.io',
};
