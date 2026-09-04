import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { supabase } from "@/integrations/supabase/client";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-display text-8xl text-accent">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Lost in the void</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This page doesn't exist or was dropped.
        </p>
        <Link to="/" className="mt-6 inline-block bg-accent text-accent-foreground px-5 py-3 text-sm uppercase tracking-widest font-semibold">
          Back home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-display text-2xl">Something went sideways</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Refresh or head back to the home page.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="bg-accent text-accent-foreground px-5 py-3 text-sm uppercase tracking-widest font-semibold"
          >
            Try again
          </button>
          <a href="/" className="border border-border px-5 py-3 text-sm uppercase tracking-widest font-semibold">
            Home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "WEEKDAYZZ — Premium Gen-Z Streetwear" },
      { name: "description", content: "WEEKDAYZZ drops premium streetwear every week. Shop the latest tees, hoodies, and design your own custom prints." },
      { name: "author", content: "WEEKDAYZZ" },
      { property: "og:title", content: "WEEKDAYZZ — Premium Gen-Z Streetwear" },
      { property: "og:description", content: "Premium tees, hoodies, and custom prints. Built for the always-online generation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://checkout.razorpay.com" },
    ],
    scripts: [
      {
        src: "https://checkout.razorpay.com/v1/checkout.js",
        async: true,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const isAuthPage = router.state.location.pathname.startsWith('/auth');

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col">
        {!isAuthPage && <Navbar />}
        <main className={`flex-1 ${!isAuthPage ? "pt-16 md:pt-20" : ""}`}>
          <Outlet />
        </main>
        {!isAuthPage && <Footer />}
      </div>
      <CartDrawer />
      <Toaster theme="light" position="bottom-right" />
    </QueryClientProvider>
  );
}
