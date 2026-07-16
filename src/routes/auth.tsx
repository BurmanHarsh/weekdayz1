import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { AuthUI } from "@/components/ui/auth-ui";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Weekdayz" },
      { name: "description", content: "Sign in to your Weekdayz account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    navigate({ to: "/account" });
    return null;
  }

  return <AuthUI />;
}
