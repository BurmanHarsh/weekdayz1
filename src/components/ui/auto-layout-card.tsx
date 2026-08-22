"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";

export type Step = 1 | 2 | 3;

export interface StepStyle {
  containerWidth: number | string;
  containerHeight: string | number;
  imageHeight: number;
  contentDirection: "row" | "column";
  contentAlign: "flex-start" | "center";
  contentJustify: "flex-start" | "space-between";
  infoDirection: "row" | "column";
  infoAlign: "flex-start" | "center";
  infoJustify: "flex-start" | "space-between";
  infoWidth: string;
}

const stepStyles: Record<Step, StepStyle> = {
  1: {
    containerWidth: "100%",
    containerHeight: "auto",
    imageHeight: 240,
    contentDirection: "column",
    contentAlign: "flex-start",
    contentJustify: "flex-start",
    infoDirection: "column",
    infoAlign: "flex-start",
    infoJustify: "flex-start",
    infoWidth: "100%",
  },
  2: {
    containerWidth: "100%",
    containerHeight: "auto",
    imageHeight: 300,
    contentDirection: "column",
    contentAlign: "flex-start",
    contentJustify: "flex-start",
    infoDirection: "row",
    infoAlign: "center",
    infoJustify: "space-between",
    infoWidth: "100%",
  },
  3: {
    containerWidth: "100%",
    containerHeight: "auto",
    imageHeight: 340,
    contentDirection: "row",
    contentAlign: "center",
    contentJustify: "space-between",
    infoDirection: "row",
    infoAlign: "center",
    infoJustify: "space-between",
    infoWidth: "auto",
  },
};

const cardVariants = {
  hidden: {
    y: 120,
    transition: {
      duration: 0.2,
      ease: "easeIn" as const,
    },
  },
  visible: {
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut" as const,
    },
  },
};

export interface AutoLayoutCardProps extends Omit<HTMLMotionProps<"div">, "title"> {
  title?: React.ReactNode;
  subtitle?: string;
  badge?: string;
  mainImage?: string;
  logoImage?: string;
  extraImages?: string[];
  linkTo?: string;
  linkSearch?: Record<string, string>;
}

const AutoLayoutCard = React.forwardRef<HTMLDivElement, AutoLayoutCardProps>(
  (
    {
      className,
      title = (
        <>
          Couple <br /> Collection
        </>
      ),
      subtitle = "SS26 Collection • Match Your Vibe",
      badge = "TRENDING",
      mainImage = "https://images.unsplash.com/photo-1516257984-b1b4d707412e?q=80&w=1740&auto=format&fit=crop",
      logoImage = "/logo.png",
      extraImages = [
        "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?q=80&w=1742&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1740&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1740&auto=format&fit=crop",
      ],
      linkTo = "/shop",
      linkSearch = { category: "couple" },
      ...props
    },
    ref,
  ) => {
    const [step, setStep] = useState<Step>(1);

    const handleClick = () => setStep((prevStep) => ((prevStep % 3) + 1) as Step);

    const currentStyle = stepStyles[step];

    return (
      <motion.div
        ref={ref}
        className={cn(
          "relative cursor-pointer overflow-hidden bg-card border border-border p-3 shadow-md hover:shadow-xl transition-shadow",
          className,
        )}
        style={{
          width: currentStyle.containerWidth,
          height: currentStyle.containerHeight,
          borderRadius: 24,
        }}
        layout
        onClick={handleClick}
        {...props}
      >
        <motion.div
          layout
          style={{
            height: currentStyle.imageHeight,
            borderRadius: 18,
          }}
          className="relative w-full cursor-pointer overflow-hidden group"
        >
          <motion.img
            src={mainImage}
            alt="main-image"
            className="bg-slate-50 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
            {logoImage.startsWith("/") ? (
              <span className="text-white text-2xl md:text-3xl font-black uppercase tracking-widest border-2 border-white/80 px-4 py-1.5 bg-black/40 backdrop-blur-md">
                WEEKDAYZZ
              </span>
            ) : (
              <motion.img
                layout
                src={logoImage}
                alt="logo"
                className="w-20 object-contain drop-shadow-md"
              />
            )}
          </div>
          <div className="absolute top-3 left-3 bg-foreground text-background text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-md">
            {badge}
          </div>
          <div className="absolute bottom-3 right-3 text-[10px] font-bold uppercase tracking-widest text-white bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full">
            Tap to expand ({step}/3)
          </div>
        </motion.div>

        <motion.div
          className="flex items-start gap-6 px-4 pb-6 pt-6 text-card-foreground"
          style={{
            flexDirection: currentStyle.contentDirection,
            alignItems: currentStyle.contentAlign,
            justifyContent: currentStyle.contentJustify,
          }}
          layout
        >
          <motion.div layout>
            <motion.h1 layout className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              {title}
            </motion.h1>
            <motion.p layout className="text-xs text-muted-foreground mt-1">
              {subtitle}
            </motion.p>
          </motion.div>

          <motion.div
            className="flex items-center gap-4"
            style={{
              flexDirection: currentStyle.infoDirection,
              justifyContent: currentStyle.infoJustify,
              alignItems: currentStyle.infoAlign,
              width: currentStyle.infoWidth,
            }}
          >
            <Link
              to={linkTo}
              search={linkSearch}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 text-xs font-bold uppercase tracking-widest hover:opacity-85 transition-all rounded-full shadow-md"
            >
              Explore <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>
        </motion.div>

        <AnimatePresence mode="wait">
          {step === 3 && (
            <motion.div
              className="relative py-4 flex w-full items-center justify-center gap-3 overflow-hidden"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={cardVariants}
            >
              {extraImages.map((img, idx) => (
                <motion.img
                  key={idx}
                  src={img}
                  alt={`card-image-${idx + 1}`}
                  className="bg-slate-50 cursor-pointer object-cover shadow-md hover:scale-105 transition-transform"
                  style={{
                    width: 140,
                    height: 180,
                    borderRadius: 14,
                  }}
                  initial={{ rotate: idx === 0 ? -6 : idx === 2 ? 6 : 0 }}
                  layout
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  },
);

AutoLayoutCard.displayName = "AutoLayoutCard";

export default AutoLayoutCard;
