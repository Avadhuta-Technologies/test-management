import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

const ALLOWED_ORG = "Avadhuta-Technologies";

export type AuthState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "unauthorized"; user: User; login: string }
  | { status: "authenticated"; user: User; login: string; avatarUrl: string };

async function checkOrgMembership(token: string): Promise<boolean> {
  const res = await fetch(`https://api.github.com/user/memberships/orgs/${ALLOWED_ORG}`, {
    headers: { Authorization: `token ${token}`, Accept: "application/vnd.github+json" },
  });
  if (!res.ok) return false;
  const data = await res.json();
  return data.state === "active";
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    async function resolve(session: any) {
      if (!session) { setAuth({ status: "unauthenticated" }); return; }
      const user = session.user;
      const token = session.provider_token;
      const login: string = user.user_metadata?.user_name ?? user.user_metadata?.preferred_username ?? "";
      const avatarUrl: string = user.user_metadata?.avatar_url ?? "";

      if (token) {
        const member = await checkOrgMembership(token);
        if (!member) { setAuth({ status: "unauthorized", user, login }); return; }
      }

      setAuth({ status: "authenticated", user, login, avatarUrl });
    }

    supabase.auth.getSession().then(({ data }) => resolve(data.session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      resolve(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return auth;
}

export function signInWithGitHub() {
  return supabase.auth.signInWithOAuth({
    provider: "github",
    options: { scopes: "read:org", redirectTo: window.location.origin },
  });
}

export function signOut() {
  return supabase.auth.signOut();
}
