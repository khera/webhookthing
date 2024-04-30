import { json, redirect } from '@remix-run/node';
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
        return json({ error: error.message }, { headers })
    }
    
    return redirect('/', { headers });    // send back to home page with cookies set
}

function AnonLoginForm() {
    return (
        <Form method="post" action="/loginanon">
            <Button type="submit">Sign In Anonymously</Button>
        </Form>
        
    );
}

const SignIn = () => {
    const { allowAnonymous } = useOutletContext<OutletContext>();
    
    const actionResponse = useActionData<typeof action>();
    
    return (
        <Container component="main" maxWidth="xs">
            <Typography variant="h2">Sign In</Typography>

            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >

                {actionResponse?.error ? (<Typography color="error.main">{actionResponse.error}, please try again.</Typography>) : (<></>)}
                
                <Form method="post" action="/login">
                    <TextField
                        margin="normal"
                        required
                        id="email"
                        label="Email Address"
                        name="email"
                        autoComplete="email"
                    />
                    <TextField
                        margin="normal"
                        required
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                    />
                    <Button variant="contained" type="submit">Sign In</Button>
                </Form>
                {allowAnonymous ? <AnonLoginForm /> : null}
            </Box>
        </Container>
    );
}
export default SignIn;