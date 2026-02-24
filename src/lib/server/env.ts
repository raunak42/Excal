type ServerEnv = {
  githubClientId: string;
  githubClientSecret: string;
  authSecret: string;
  allowedGithubId: string;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
};

let cachedEnv: ServerEnv | null = null;

const readEnv = (name: string) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

export const getServerEnv = (): ServerEnv => {
  if (cachedEnv) {
    return cachedEnv;
  }

  cachedEnv = {
    githubClientId: readEnv("GITHUB_ID"),
    githubClientSecret: readEnv("GITHUB_SECRET"),
    authSecret: readEnv("NEXTAUTH_SECRET"),
    allowedGithubId: readEnv("ALLOWED_GITHUB_ID"),
    supabaseUrl: readEnv("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseServiceRoleKey: readEnv("SUPABASE_SERVICE_ROLE_KEY"),
  };

  return cachedEnv;
};
