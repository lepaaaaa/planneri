const SUPABASE_URL = "https://zppzqlcenivwfxbmljdy.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_0Q5_voRANWCpoOnD5hNL-Q_Afbho047";

export const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
