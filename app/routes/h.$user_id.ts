/**
* Accept GET/POST/PUT webhooks
* 
* The URL is `/h/USER_ID` where the USER_ID is for the logged in user.
*/

import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node"; // or cloudflare/deno
import { getClientIPAddress } from "remix-utils/get-client-ip-address";

import { logger } from "~/lib/logger";
import { createSupabaseAdminClient } from "~/lib/supabase.server";

/**
 * Gather the data from the HTTP submission and save it to the datbase
 * 
 * @param request The HTTP request object
 * @param params The params object parsed from the Remix URL
 * @returns 
 */
async function parse_and_save (request: LoaderFunctionArgs["request"], params: LoaderFunctionArgs["params"]) {
    const user_id : string = params.user_id!;

    const { supabaseAdminClient } = createSupabaseAdminClient();

    const url = new URL(request.url);

    const http_method : string = request.method;
    const query_string : string = url.searchParams.toString();
    // map the request headers to a JSON object
    const header_items : string[] = [];
    request.headers.forEach((value,key) => {
        header_items.push( `${JSON.stringify(key)}: ${JSON.stringify(value)}`);
    });
    const headers = JSON.parse('{' + header_items.join(',') + '}');
    const body_raw : string = await request.text();
    // picks from a proxy header. Returns null on local connections without proxy
    const remote_ip : string | undefined = getClientIPAddress(request.headers) || undefined;

    logger.debug(`Submitting ${http_method} request for ${user_id}`);

    const { data, error } = await supabaseAdminClient.from("submissions").insert({
        user_id,
        http_method,
        query_string,
        headers,
        body_raw,
        remote_ip
    })
    .select('submission_id')
    .maybeSingle();

    if (error) {
        logger.debug(`submission error =`, error);
        // figure out what error to return
        let status_code: number = 400;
        let message: string = '';
        if (error.message.match('violates foreign key constraint')) {
            // unknown user
            status_code = 401;
            message = 'Unknown user';
        } else if (error.message.match('violates check constraint "user_metadata_usage_count_limits"')) {
            // too many records for this user
            status_code = 403;
            message = 'Too many records for this user';
            logger.warn(`User ${user_id} is over quota.`);
        }
        return json({ error: message }, status_code); 
    } else {
        logger.debug(`submission_id`, data?.submission_id);
        return json({ success: true }, 200);
    }
}

// handle "GET" request
export const loader = async ({request, params}: LoaderFunctionArgs) => {
    return await parse_and_save(request, params);
};

// POST, PUT, PATCH, DELETE
export const action = async ({request, params}: ActionFunctionArgs) => {
    return await parse_and_save(request, params);
};

