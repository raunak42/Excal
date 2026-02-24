import { createClient } from "@supabase/supabase-js";

import { getServerEnv } from "@/lib/server/env";
import type { SupabaseDatabase } from "@/types/supabase";

let client: ReturnType<typeof createClient<SupabaseDatabase>> | null = null;

export const getSupabaseAdmin = () => {
  if (client) {
    return client;
  }

  const serverEnv = getServerEnv();

  client = createClient<SupabaseDatabase>(
    serverEnv.supabaseUrl,
    serverEnv.supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  return client;
};
