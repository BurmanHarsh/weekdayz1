import { useState, useEffect } from "react";
import { Gift, Check } from "lucide-react";

interface LoyaltyStampCardProps {
  orderCount: number;
}

const TOTAL_SLOTS = 6;
const FREE_REWARD_SLOT = 6;

export function LoyaltyStampCard({ orderCount }: LoyaltyStampCardProps) {
  const [animatedStamps, setAnimatedStamps] = useState(0);
  const filledSlots = Math.min(orderCount, TOTAL_SLOTS);
  const isUnlocked = orderCount >= FREE_REWARD_SLOT;

  // Animate stamps appearing one by one on mount
  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      if (current >= filledSlots) {
        clearInterval(interval);
        return;
      }
      current++;
      setAnimatedStamps(current);
    }, 180);
    return () => clearInterval(interval);
  }, [filledSlots]);

  return (
    <div
      className={`relative overflow-hidden border ${
        isUnlocked ? "border-foreground stamp-unlock-glow" : "border-border"
      } bg-card p-6 sm:p-8`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-1">
            WEEKDAYZZ
          </div>
          <h3 className="text-xl font-black tracking-tight">Stamp Card</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isUnlocked
              ? "🎉 You've unlocked a Free T-Shirt!"
              : `${TOTAL_SLOTS - filledSlots} more ${TOTAL_SLOTS - filledSlots === 1 ? "order" : "orders"} to unlock your free tee`}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="text-2xl font-black">{filledSlots}/{TOTAL_SLOTS}</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">stamps</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-secondary rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-foreground rounded-full transition-all duration-700 ease-out"
          style={{ width: `${(filledSlots / TOTAL_SLOTS) * 100}%` }}
        />
      </div>

      {/* Stamp Slots */}
      <div className="grid grid-cols-6 gap-2 sm:gap-3">
        {Array.from({ length: TOTAL_SLOTS }, (_, i) => {
          const slotIndex = i + 1;
          const isLastSlot = slotIndex === TOTAL_SLOTS;
          const isStamped = animatedStamps >= slotIndex;
          const isThisUnlocked = isLastSlot && isUnlocked && isStamped;

          return (
            <div
              key={slotIndex}
              className={`relative aspect-square flex flex-col items-center justify-center rounded-sm border-2 transition-all duration-300 ${
                isThisUnlocked
                  ? "border-foreground bg-foreground text-background shadow-lg"
                  : isStamped
                  ? "border-foreground bg-foreground/8 shadow-sm"
                  : isLastSlot
                  ? "border-dashed border-foreground/40 bg-secondary/50"
                  : "border-dashed border-border bg-secondary/30"
              }`}
            >
              {isThisUnlocked ? (
                // Unlocked free t-shirt slot
                <div className={`flex flex-col items-center ${isStamped ? "stamp-animate" : ""}`}>
                  <Gift className="h-4 w-4 sm:h-5 sm:w-5 text-background" />
                  <span className="text-[8px] font-black uppercase tracking-wider text-background mt-0.5 leading-none text-center">
                    FREE
                  </span>
                </div>
              ) : isStamped ? (
                // Filled stamp
                <div className={`flex flex-col items-center ${isStamped ? "stamp-animate" : ""}`}>
                  <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-foreground flex items-center justify-center">
                    <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-background" strokeWidth={3} />
                  </div>
                  <span className="text-[8px] font-bold text-foreground mt-0.5">{slotIndex}</span>
                </div>
              ) : isLastSlot ? (
                // Last slot — reward preview (not yet filled)
                <div className="flex flex-col items-center">
                  <Gift className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                  <span className="text-[7px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5 text-center leading-none">
                    FREE<br />TEE
                  </span>
                </div>
              ) : (
                // Empty slot
                <span className="text-[11px] font-bold text-muted-foreground/50">{slotIndex}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom legend */}
      <div className="mt-4 flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
        <span>Complete 5 orders</span>
        <div className="flex items-center gap-1.5">
          <Gift className="h-3 w-3" />
          <span>6th order = Free T-Shirt</span>
        </div>
      </div>

      {/* Unlocked reward banner */}
      {isUnlocked && (
        <div className="mt-5 flex items-center gap-3 bg-foreground text-background px-4 py-3">
          <Gift className="h-5 w-5 shrink-0" />
          <div>
            <div className="text-xs font-black uppercase tracking-widest">Free T-Shirt Unlocked!</div>
            <div className="text-[10px] font-medium opacity-70 mt-0.5">
              Use code <span className="font-black">STAMP6FREE</span> at checkout to claim your free tee.
            </div>
          </div>
        </div>
      )}

      {/* Decorative watermark */}
      <div className="absolute -bottom-4 -right-4 text-[6rem] font-black text-foreground/3 select-none pointer-events-none leading-none">
        WZ
      </div>
    </div>
  );
}
