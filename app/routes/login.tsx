import { json, redirect } from '@remix-run/node';
import type { ActionFunctionArgs } from '@remix-run/node';

import { Form, useActionData } from '@remix-run/react';
import { createSupabaseServerClient } from '~/lib/supabase.server';
import { logger } from '~/lib/logger';

export async function action ({ request }: ActionFunctionArgs) {
    const { supabaseClient, headers } = createSupabaseServerClient(request);
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    logger.debug(`logging in user ${email} password ${password}`);
    const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        logger.debug(`login error ${error.message}, status=${error.status}`);
        return json({ error: error.message }, { headers })
    }

    return redirect('/', { headers });    // send back to home page with cookies set
}

const SignIn = () => {
    const actionResponse = useActionData<typeof action>();

    return (
        <>
            <h1>Sign In</h1>
            {actionResponse?.error ? (<p>{actionResponse.error}, please try again.</p>) : (<></>)}
            <Form method="post" action="/login">
                <input type="email" name="email" placeholder="Your Email" required />
                <input type="password" name="password" placeholder="Your Password" required />
                <br />
                <button type="submit">Sign In</button>
            </Form>
        </>
    );
}
export default SignIn;