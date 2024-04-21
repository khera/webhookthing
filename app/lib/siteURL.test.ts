/**
 * Tests for src/config/siteURL
 */

import { test, expect, describe } from '@jest/globals';

import { siteURL } from "./siteURL";

describe('URL from environment', () => {
    test('local URL', () => {
        expect(process.env.PUBLIC_SITE_URL).not.toBeDefined();
        expect(siteURL()).toBe('http://localhost:5173/');
    });
        
    test('production URL', () => {
        process.env.PUBLIC_SITE_URL = 'https://app.spammerdomain.com/';
        expect(process.env.PUBLIC_SITE_URL).toBeDefined();
        expect(siteURL()).toBe('https://app.spammerdomain.com/');
    });
});
