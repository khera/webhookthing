import { data, redirect } from '@remix-run/node';
import type { ActionFunctionArgs } from '@remix-run/node';

import { Form, useActionData, useOutletContext } from '@remix-run/react';
import { createSupabaseServerClient } from '~/lib/supabase.server';
import { logger } from '~/lib/logger';
import type { OutletContext } from "~/lib/types";

import { Typography, TextField, Box, Button, Container } from '@mui/material';

export async function action ({ request }: ActionFunctionArgs) {
    const { supabaseServerClient, headers } = createSupabaseServerClient(request);
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    logger.debug(`logging in user ${email} password ${password}`);
    const { error } = await supabaseServerClient.auth.signInWithPassword({
        email,
        password
    });
    
    if (error) {
        logger.debug(`login error ${error.message}, status=${error.status}`);
        return data({ error: error.message }, { headers })
    }
    
    throw redirect('/', { headers });    // send back to home page with cookies set
}

function AnonLoginForm() {
    return (
        <Form method="post" action="/loginanon">
            <Button fullWidth type="submit">Sign In Anonymously</Button>
        </Form>
        
    );
}

export default function SignIn() {
    const { allowAnonymous } = useOutletContext<OutletContext>();

    const actionResponse = useActionData<typeof action>();

    return (
        <Container maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Typography color="text.secondary" variant="h3">Sign In</Typography>

                {actionResponse?.error && <Typography color="error.main">{actionResponse.error}, please try again.</Typography>}

                <Form method="post" action="/login">
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Email Address"
                        name="email"
                        autoComplete="email" />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="current-password" />
                    <Button fullWidth variant="contained" type="submit">Sign In</Button>
                </Form>
                {allowAnonymous && <AnonLoginForm />}
            </Box>
        </Container>
    );
}
