/**
 * Environment variables required:
 * - PUBLIC_SITE_URL -- set in environment for each deployment environment
 * 
 * NOTE: the URL must have the protocol and include the trailing slash. Since we control setting it,
 * we do not spend the cycles to verify it here.
 * 
 * @function siteURL
 * @returns {string} the site's URL
 */

export function siteURL(): string {
    return process.env.PUBLIC_SITE_URL ?? 'http://localhost:5173/';
}
