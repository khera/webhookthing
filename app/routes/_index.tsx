import type { MetaFunction } from "@remix-run/node";
import { useOutletContext } from "@remix-run/react";
import type { OutletContext } from "~/lib/types";
import { useEffect, useState } from "react";

import SignIn from './login';
import type { Tables } from "~/lib/supabase.server";
import type { Session } from "@supabase/supabase-js";

type Submission = Tables<'submissions'>;

export const meta: MetaFunction = () => {
  return [
    { title: "Web Hook Thing" },
    { name: "description", content: "Web Hook Testing App" },
  ];
};

export default function Index() {
  const { supabase, serverSession } = useOutletContext<OutletContext>();
  const [submissionList, setSubmissionList] = useState<Submission[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [browserSession, setBrowserSession] = useState<Session | undefined>();

  useEffect(() => {
      async function fetchList() {
        console.log(`pre fetch`);
        if (!browserSession) {
          console.log(`fetching browser session`);
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setBrowserSession(session);
          }
        } else {
          console.log(`fetching list`)
          const { data, error } = await supabase.from('submissions').select().eq('user_id',browserSession.user.id).order('submission_time', {ascending: false});
          if (error) {
            console.error(error);
          } else {
            setSubmissionList(data);
          }
          setIsLoaded(true);
        }
      }

      fetchList();
  }, [supabase, isLoaded, serverSession, setSubmissionList, setIsLoaded, browserSession, setBrowserSession]);

  // TBD: on initial login, the realtime is not picking up changes
  useEffect(() => {
    console.log(`realtime setup`);
    if (!browserSession) return;

    const channel = supabase
      .channel('submissions')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'submissions' }, (payload) => {
        setSubmissionList((current: Submission[]) => ([payload.new as Submission, ...current]))
      })
      .subscribe()

    console.log(`waiting for data! ${browserSession?.user.id}`);
    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, browserSession, setSubmissionList, submissionList])

  if (serverSession && !isLoaded) {
    return (<p>Loading...</p>);
  }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <h1>Web Hook Thing</h1>
      {serverSession?.user.id ? 
    (<>
      <p>Logged in {serverSession?.user.id} <a href="/logout">Sign Out</a></p>
      <p>Submission List</p>
      {
        submissionList.map((item) => {
          return (<pre key={item.submission_id}>{JSON.stringify(item)}</pre>)
        })
      }
     </>
    ) : (
      <SignIn />
    )}
    </div>
  );
}
