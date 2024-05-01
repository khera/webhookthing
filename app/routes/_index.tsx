import type { MetaFunction } from "@remix-run/node";
import { useOutletContext, useLoaderData } from "@remix-run/react";
import type { OutletContext } from "~/lib/types";
import { useEffect, useState } from "react";

import {Typography, LinearProgress, Box, Button, Link, Grid} from '@mui/material';

import SignIn from './login';
import type { Tables } from "~/lib/supabase.server";
import { siteURL } from "~/lib/siteURL";

type Submission = Tables<'submissions'>;

export const meta: MetaFunction = () => {
  return [
    { title: "Web Hook Thing" },
    { name: "description", content: "Web Hook Testing App" },
  ];
};

export async function loader() {
  return { siteURL: siteURL() };
}

export default function Index() {
  const { supabase, serverSession } = useOutletContext<OutletContext>();
  const { siteURL } = useLoaderData<typeof loader>();
  const [submissionList, setSubmissionList] = useState<Submission[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
      //console.debug(`pre fetch`);
      async function fetchList() {
        if (serverSession) {
          //console.debug(`fetching list`)
          const { data, error } = await supabase.from('submissions').select().eq('user_id',serverSession.user.id).order('submission_time', {ascending: false});
          if (error) {
            console.error(error);
          } else {
            setSubmissionList(data);
          }
          setIsLoaded(true);
        }
      }

      fetchList();
  }, [supabase, isLoaded, serverSession, setSubmissionList, setIsLoaded]);

  useEffect(() => {
    //console.debug(`realtime setup`);
    if (!serverSession) return;

    const channel = supabase
      .channel('*')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'submissions' }, (payload) => {
        setSubmissionList((current: Submission[]) => ([payload.new as Submission, ...current]))
      })
      .subscribe()

    //console.debug(`waiting for data! ${serverSession.user.id}`);
    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, serverSession, setSubmissionList, submissionList])

  if (serverSession && !isLoaded) {
    return (<Box sx={{ width: '100%' }}><LinearProgress /></Box>);
  }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <Typography variant="h2">Web Hook Thing</Typography>
      {serverSession?.user.id ? 
    (<>
      <Typography variant="body1">
        <Grid container direction={"column"}>
          <Grid>
            Logged in as {serverSession?.user.is_anonymous ? 'anon' : 'real'} user. Submit hooks to: <Link href={siteURL + 'h/' + serverSession?.user.id}>{siteURL + 'h/' + serverSession?.user.id}</Link>
          </Grid>
          <Grid>
            <Button variant="outlined" href="/logout">Sign Out</Button>
            <Button variant="outlined" href="/api-spec">API Specification</Button>
          </Grid>
        </Grid>
      </Typography><hr />
      <Typography variant="h3" color="text.secondary">Submission List</Typography>
      {
        submissionList.map((item) => {
          return (<><Box key={item.public_id}>{JSON.stringify(item,null,2)}</Box><hr /></>)
        })
      }
     </>
    ) : (
      <SignIn />
    )}
    </div>
  );
}
