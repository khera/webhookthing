import { redirect } from '@remix-run/node';
import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';

import { createSupabaseServerClient } from '~/lib/supabase.server';
import { logger } from '~/lib/logger';

async function do_logout(request: Request) {
    const { supabaseServerClient, headers } = createSupabaseServerClient(request);

    const { data: { session } } = await supabaseServerClient.auth.getSession();
    if (session) {
        await supabaseServerClient.auth.signOut()
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