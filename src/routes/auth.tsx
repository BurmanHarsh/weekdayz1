import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { AuthUI } from "@/components/ui/auth-ui";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Weekdayzz" },
      { name: "description", content: "Sign in to your Weekdayzz account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (user) {
      if (isAdmin) {
        navigate({ to: "/admin" });
      } else {
        navigate({ to: "/account" });
      }
    }
  }, [user, isAdmin, loading, navigate]);

  if (user) {
    return <div className="py-24 text-center text-muted-foreground text-sm">Directing to dashboard…</div>;
  }

  return <AuthUI />;
}
