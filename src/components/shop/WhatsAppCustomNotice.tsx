import React from "react";
import { cn } from "@/lib/utils";

export const WHATSAPP_PHONE = "919236150810";
export const WHATSAPP_DEFAULT_SHARE_MSG =
  "Hi Weekdayzz, I have photos/texts to share for my custom order.";

export function WhatsAppIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.24-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.34-.76-1.84-.2-.49-.4-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.45 1.03 2.61.13.17 1.78 2.72 4.31 3.81.6.26 1.07.42 1.44.53.61.19 1.16.17 1.6.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.1-.23-.17-.48-.29z" />
    </svg>
  );
}

export function WhatsAppCallout({
  className,
  orderId,
  message,
}: {
  className?: string;
  orderId?: string;
  message?: string;
}) {
  const queryText = orderId
    ? `Hi Weekdayzz, I have photos/texts to share for my custom order #${orderId}.`
    : (message ?? WHATSAPP_DEFAULT_SHARE_MSG);

  return (
    <div
      className={cn(
        "bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-3.5 rounded-xl flex items-center gap-3 text-emerald-950 dark:text-emerald-100 shadow-sm",
        className
      )}
    >
      <div className="bg-[#25D366] text-white p-2 rounded-full flex-shrink-0 shadow-sm">
        <WhatsAppIcon className="h-4 w-4" />
      </div>
      <p className="text-xs sm:text-[13px] leading-relaxed">
        Kindly share the photos/texts with us via{" "}
        <a
          href={`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(queryText)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold underline text-[#075E54] dark:text-emerald-300 hover:text-emerald-700 dark:hover:text-emerald-200 transition-colors"
        >
          WhatsApp
        </a>{" "}
        along with the order ID!
      </p>
    </div>
  );
}

export function WhatsAppFloatingButton({
  className,
  message = "Hi Weekdayzz, I'm customizing a tee and need help/have photos to share.",
  label = "Chat on WhatsApp",
}: {
  className?: string;
  message?: string;
  label?: string;
}) {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Message on WhatsApp"
      className={cn(
        "fixed bottom-20 sm:bottom-24 right-4 sm:right-6 z-40 bg-[#25D366] hover:bg-[#20ba59] text-white p-3.5 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center group",
        className
      )}
    >
      <WhatsAppIcon className="h-6 w-6" />
      <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out font-bold text-xs pl-0 group-hover:pl-2">
        {label}
      </span>
    </a>
  );
}
