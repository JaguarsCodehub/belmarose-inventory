/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_DEFAULT_CURRENCY: string;
  readonly VITE_CURRENCY_SYMBOL: string;
  readonly VITE_DEFAULT_ORDER_BUDGET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
