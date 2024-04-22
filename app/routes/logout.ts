import { redirect } from '@remix-run/node';
import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';

import { createSupabaseServerClient } from '~/lib/supabase.server';
import { logger } from '~/lib/logger';

async function do_logout(request: Request) {
    const { supabaseClient, headers } = createSupabaseServerClient(request);

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        await supabaseClient.auth.signOut()
    }

    logger.debug(`logged out user ${session?.user.id}`);
    return redirect('/', { headers });
}

// respond to either POST or GET.
export async function loader ({ request }: LoaderFunctionArgs) {
    return await do_logout(request);
}

export async function action ({ request }: ActionFunctionArgs) {
        return await do_logout(request);
}