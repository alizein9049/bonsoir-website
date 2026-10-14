/**
 * Fixed website content (not editable from the Admin Dashboard — approved decision).
 *
 * PENDING CONTENT: the Welcome message wording has not been supplied yet.
 * While `welcomeMessage` is null, the paragraph is simply not rendered —
 * no invented business text is shown. Replace null with the approved wording.
 */
export interface SiteContent {
  brandName: string;
  welcomeHeading: string;
  welcomeMessage: string | null;
  enterMenuLabel: string;
}

export const siteContent: SiteContent = {
  brandName: 'Bonsoir',
  welcomeHeading: 'Welcome to Bonsoir',
  welcomeMessage: null,
  enterMenuLabel: 'Enter Menu',
};
