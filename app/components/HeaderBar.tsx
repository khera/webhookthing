import { AppBar, Button, Link, Stack, Toolbar, Typography } from "@mui/material";

export function HeaderBar({ user_id, siteURL }: { user_id?: string, siteURL: string }) {
    return (
        <>
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <Toolbar>
                    <Typography variant="h3" sx={{flexGrow: 1}}>Web Hook Thing</Typography>

                    {user_id && <>
                    <Typography sx={{flexGrow: 1}}>
                        Submit hooks to: <Link href={siteURL + 'h/' + user_id}>{siteURL + 'h/' + user_id}</Link>
                    </Typography>

                    <Stack direction="row" spacing={2}>
                        <Button variant="outlined" href="/api-spec">API Specification</Button>
                        <Button variant="outlined" href="/logout">Sign Out</Button>
                    </Stack>
                    </>}
                </Toolbar>
            </AppBar>
            <Toolbar />
        </>
    )    
}
