// store the supase handle and session in the OutletContext from the root.tsx file

import type { Session, SupabaseClient } from "@supabase/supabase-js";

export type OutletContext = {
  supabase: SupabaseClient;
  session: Session;
};
