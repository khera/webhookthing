import type { MetaFunction } from "@remix-run/node";
import { useOutletContext, useLoaderData } from "@remix-run/react";
import type { OutletContext } from "~/lib/types";
import { useEffect, useState } from "react";

import {Typography, LinearProgress, Box, Button, Link, Grid, List, ListItem, ListItemText, Divider, Chip, useMediaQuery} from '@mui/material';
import { DataGrid } from "@mui/x-data-grid";

import { JsonView, allExpanded, darkStyles, defaultStyles } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';

import SignIn from './login';
import type { Tables } from "~/lib/supabase.server";
import { siteURL } from "~/lib/siteURL.server";

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
      <Grid container direction={"column"}>
        <Grid>
        <Typography variant="body1">Logged in as {serverSession?.user.is_anonymous ? 'anon' : 'real'} user. Submit hooks to: <Link href={siteURL + 'h/' + serverSession?.user.id}>{siteURL + 'h/' + serverSession?.user.id}</Link></Typography>
        </Grid>
        <Grid>
          <Button variant="outlined" href="/logout">Sign Out</Button>
          <Button variant="outlined" href="/api-spec">API Specification</Button>
        </Grid>
      </Grid>
      <Divider />
      <Typography variant="h3" color="text.secondary">Submission List</Typography>
      <List>
        {
          submissionList.map((item, index) => {
            return (
              <ListItem key={index}>
                <ListItemText>
                  <RenderSubmission data={item} />
                </ListItemText>
              </ListItem>
            )
          })
        }
      </List>
     </>
    ) : (
      <SignIn />
    )}
    </div>
  );
}

/**
 * Component to display the JSON of a webhook submission
 */
type SubmissionWithId = Submission & { id?: string };

function RenderSubmission({ data }: { data: SubmissionWithId }) {
  data.id = data.public_id; // add an `id` field to the data so that the DataGrid can use it
  // mutate the headers field to an array of field name + value
  const header_data = data.headers as Record<string,string>;  // Supabase types this as Json which is unusable to iterate.
  const headers = Object.entries(header_data).map(([key, value], index) => ({ id: index, field: key, value }));
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  let content_as_json;
  switch (header_data['content-type']) {
    case('application/json'):
      content_as_json = JSON.parse(data.body_raw ?? '');
      break;
    default:
      content_as_json = data.body_raw ?? '';
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Divider>
        <Chip label={"Request " + data.id} />
      </Divider>
       <DataGrid
          rows={[data]}
          columns={[
            { field: "public_id", headerName: "ID", type: 'string', width: 120 },
            { field: "submission_time", headerName: "Time", type: 'dateTime', valueGetter: (value) => { return new Date(value); }, width: 180},
            { field: "http_method", headerName: "Method", type: "string", width: 100 },
            { field: "remote_ip", headerName: "IP Address", type: 'string', width: 200 },
            { field: "query_string", headerName: "Query String", type: 'string', width: 200 },
          ]}
          disableColumnMenu
          disableColumnSorting
          hideFooter
      />
      <Divider />
      <DataGrid
        rows={headers}
        columns={[
          { field: "field", headerName: "Header Field", type: 'string', width: 200 },
          { field: "value", headerName: "Value", type: 'string', width: 400 },
        ]}
        disableColumnMenu
        disableColumnSorting
        hideFooter
      />
      <Divider />
      { data.http_method == 'GET' ? (
        <Typography variant="body2">Empty Body for GET Request</Typography>
      ) : (
        <>
          <Typography variant="h5">Body</Typography>
          { typeof content_as_json === 'object' ? (
            <JsonView data={content_as_json} shouldExpandNode={allExpanded} style={prefersDarkMode ? darkStyles : defaultStyles} clickToExpandNode />
          ) : (
            <Typography variant="body1">{content_as_json}</Typography>
          )}
        </>
    )}
    </Box>
  );
}
