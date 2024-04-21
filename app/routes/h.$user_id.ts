/**
* Accept GET/POST/PUT webhooks
* 
* The URL is `/h/USER_ID` where the USER_ID is for the logged in user.
*/

import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node"; // or cloudflare/deno

import { logger } from "~/lib/logger";

/**
 * Gather the data from the HTTP submission and save it to the datbase
 * 
 * @param request The HTTP request object
 * @param params The params object parsed from the Remix URL
 * @returns 
 */
async function parse_and_save (request: Request, params: LoaderFunctionArgs["params"]) {
    const server_time = (new Date).toISOString();
    const user_id = params.user_id;

    const method = request.method;
    const raw_body = await request.text();
    const mime_type = request.headers.get('Content-Type');

    const url = new URL(request.url);

    logger.debug(`Submitting ${method} request for ${user_id} at ${server_time}`);
    logger.debug(`raw query string`, url.searchParams.toString());
    logger.debug(`header:`, request.headers);
    logger.debug(`mime type:`, mime_type);
    logger.debug(`raw body: "${raw_body}"`);

    // iterate over searchParams keys and make a list of key/values
    let query : string = '';
    url.searchParams.forEach((value, key) => {
        query += ` ${key}=${value}`;
    });
    logger.debug(`query:`, query);

    return json({ success: true }, 200);
}

// handle "GET" request
export const loader = async ({request, params}: LoaderFunctionArgs) => {
    return await parse_and_save(request, params);
};

// POST, PUT, PATCH, DELETE
export const action = async ({request, params}: ActionFunctionArgs) => {
    return await parse_and_save(request, params);
};

