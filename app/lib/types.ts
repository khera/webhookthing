// store the supase handle and session in the OutletContext from the root.tsx file

import type { Session, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./generated/database.types";


export type OutletContext = {
  supabase: SupabaseClient<Database>;
  serverSession: Session;
};
