import type { MetaFunction } from "@remix-run/node";
import { useOutletContext } from "@remix-run/react";
import type { OutletContext } from "~/lib/types";

import SignIn from './login';

export const meta: MetaFunction = () => {
  return [
    { title: "Web Hook Thing" },
    { name: "description", content: "Web Hook Testing App" },
  ];
};

export default function Index() {
  const { session } = useOutletContext<OutletContext>();

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <h1>Web Hook Thing</h1>
      {session?.user.id ? 
    (<>
      <p>Logged in {session?.user.id}</p>
      <a href="/logout">Sign Out</a>
     </>
    ) : (
      <SignIn />
    )}
    </div>
  );
}
