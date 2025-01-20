import type { MetaFunction } from "@remix-run/node";
import { useOutletContext, useLoaderData } from "@remix-run/react";
import type { OutletContext } from "~/lib/types";
import { useEffect, useState } from "react";

import {Typography, LinearProgress, Box, List, ListItem, ListItemText, useMediaQuery, Container, Drawer, Toolbar, ListItemButton} from '@mui/material';
import { DataGrid } from "@mui/x-data-grid";

import { JsonView, allExpanded, darkStyles, defaultStyles } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';

import SignIn from './login';
import type { Tables } from "~/lib/supabase.server";
import { siteURL } from "~/lib/siteURL.server";
import { HeaderBar } from "~/components/HeaderBar";

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
  const [selectedItem, setSelectedItem] = useState<number>(0);

  const drawerWidth = 230;

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
        setSubmissionList((current: Submission[]) => ([payload.new as Submission, ...current]));
        setSelectedItem(0);
      })
      .subscribe()

    //console.debug(`waiting for data! ${serverSession.user.id}`);
    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, serverSession, setSubmissionList, submissionList, setSelectedItem, selectedItem]);

  if (serverSession && !isLoaded) {
    return (<>
      <HeaderBar user_id={serverSession.user.id} siteURL={siteURL} />
      <Box sx={{ width: '100%' }}><LinearProgress /></Box>
    </>);
  }

  return (
    <Container component="main" maxWidth={false}>
      {serverSession?.user.id ? 
    (
    <>
      <HeaderBar user_id={serverSession.user.id} siteURL={siteURL} />
      <Box sx={{ display: 'flex' }}>
        <Drawer variant="permanent" anchor="left" sx={{ width: drawerWidth, flexShrink: 0, [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' } }}>
          <Toolbar />
          <Box sx={{ overflow: 'auto' }}>
            <Typography align="center" variant="h4" color="text.secondary">Submissions</Typography>
            <List dense={true}>
            {
              submissionList.map((item, index) => {
                const d = new Date(item.submission_time);
                return (
                  <ListItem key={index}>
                    <ListItemButton onClick={() => setSelectedItem(index)} sx={{ borderLeft: 4, borderLeftColor: index === selectedItem ? 'primary.main' : 'transparent'}}>
                      <ListItemText primary={item.public_id} secondary={d.toLocaleDateString() + ', ' + d.toLocaleTimeString()} />
                    </ListItemButton>
                  </ListItem>
                )
              })
            }
            </List>
          </Box>
        </Drawer>
        <Box sx={{ flexGrow: 1 }}>
          {submissionList.length > 0 && <RenderSubmission key={submissionList[selectedItem].public_id} data={submissionList[selectedItem]} />}
        </Box>
      </Box>
    </>
    ) : (
    <>
      <HeaderBar siteURL={siteURL} />
      <SignIn />
    </>
    )}
    </Container>
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
    <Box sx={{ width: '100%', mt: 2 }}>
      <Typography variant="h5" align="center" gutterBottom>Request ID: {data.public_id}</Typography>
      <DataGrid sx={{ mb: 2 }}
          rows={[data]}
          columns={[
            { field: "public_id", headerName: "ID", type: 'string', minWidth: 110 },
            { field: "submission_time", headerName: "Time", type: 'dateTime', valueGetter: (value) => { return new Date(value); }},
            { field: "http_method", headerName: "Method", type: "string" },
            { field: "remote_ip", headerName: "IP Address", type: 'string' },
            { field: "query_string", headerName: "Query String", type: 'string', flex: 1 },
          ]}
          autosizeOnMount
          disableColumnMenu
          disableColumnSorting
          hideFooter
          density="compact"
      />
      <Typography variant="h5" align="center" gutterBottom>Headers</Typography>
      <DataGrid sx={{ mb: 2 }}
        rows={headers}
        columns={[
          { field: "field", headerName: "Header Field", type: 'string', minWidth: 200 },
          { field: "value", headerName: "Value", type: 'string', flex: 1 },
        ]}
        disableColumnMenu
        disableColumnSorting
        hideFooter
        density="compact"
      />

      { data.http_method == 'GET' ? (
        <Typography>Empty Body for GET Request</Typography>
      ) : (
        <>
          <Typography variant="h5" align="center" gutterBottom>Body</Typography>
          { typeof content_as_json === 'object' ? (
            <JsonView data={content_as_json} shouldExpandNode={allExpanded} style={prefersDarkMode ? darkStyles : defaultStyles} clickToExpandNode />
          ) : (
            <Typography>{content_as_json}</Typography>
          )}
        </>
    )}
    </Box>
  );
}
