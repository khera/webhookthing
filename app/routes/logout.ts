import { redirect } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';

import { createSupabaseServerClient } from '~/lib/supabase.server';
import { logger } from '~/lib/logger';

export async function loader ({ request }: LoaderFunctionArgs) {
    const { supabaseClient, headers } = createSupabaseServerClient(request);

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        await supabaseClient.auth.signOut()
    }

    logger.debug(`loged out user ${session?.user.id}`);
    return redirect('/', { headers });
}
