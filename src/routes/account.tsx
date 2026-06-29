import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { LogOut, Package } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { myOrders } from "@/lib/orders.functions";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Account — Weekdayz" },
      { name: "description", content: "Your Weekdayz account, orders, and saved designs." },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const { data: orders } = useQuery({
    queryKey: ["my-orders", user?.id],
    queryFn: () => myOrders(),
    enabled: Boolean(user),
  });

  if (!user) return null;

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
      <div className="flex items-center justify-between mb-10">
        <div>
          <span className="text-xs uppercase tracking-[0.3em] text-accent">Account</span>
          <h1 className="text-display text-5xl mt-2">Hi, {user.email?.split("@")[0]}</h1>
        </div>
        <div className="flex gap-3">
          {isAdmin && (
            <Link to="/admin" className="border border-accent text-accent px-4 py-2 text-xs uppercase tracking-widest font-semibold">
              Admin
            </Link>
          )}
          <button onClick={signOut} className="inline-flex items-center gap-2 border border-border px-4 py-2 text-xs uppercase tracking-widest">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </div>

      <section>
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Orders</h2>
        {!orders?.length ? (
          <div className="border border-border p-10 text-center">
            <Package className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No orders yet.</p>
            <Link to="/shop" className="inline-block mt-4 text-accent uppercase text-xs tracking-widest underline">Start shopping</Link>
          </div>
        ) : (
          <ul className="divide-y divide-border border border-border">
            {orders.map((o) => (
              <li key={o.id} className="p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">#{o.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                    {new Date(o.created_at).toLocaleDateString()} · {o.fulfillment_status} · {o.payment_status}
                  </p>
                </div>
                <p className="font-semibold">{formatPrice(o.total_cents)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
