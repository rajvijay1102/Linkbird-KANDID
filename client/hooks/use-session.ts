import { useQuery, useQueryClient } from "@tanstack/react-query";

export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export function useSession() {
  const qc = useQueryClient();
  const query = useQuery<{ user: SessionUser | null }>({
    queryKey: ["session"],
    queryFn: async () => {
      const res = await fetch("/api/auth/session", { credentials: "include" });
      if (!res.ok) return { user: null };
      return res.json();
    },
  });

  const signInWithGoogle = () => {
    window.location.href = "/api/auth/sign-in/google";
  };

  const signOut = async () => {
    await fetch("/api/auth/sign-out", { method: "POST", credentials: "include" });
    await qc.invalidateQueries({ queryKey: ["session"] });
  };

  return { ...query, user: query.data?.user ?? null, signInWithGoogle, signOut };
}
