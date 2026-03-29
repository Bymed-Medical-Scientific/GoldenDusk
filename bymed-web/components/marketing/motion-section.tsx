"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease },
  },
};

const stagger = {
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.06 },
  },
};

export function MotionSection({
  className,
  children,
  ...props
}: HTMLMotionProps<"section">) {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-72px", amount: 0.2 }}
      variants={stagger}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.section>
  );
}

export function MotionFadeUp({
  className,
  children,
  ...props
}: HTMLMotionProps<"div">) {
  return (
    <motion.div variants={fadeUp} className={cn(className)} {...props}>
      {children}
    </motion.div>
  );
}

export function MotionLi({
  className,
  children,
  ...props
}: HTMLMotionProps<"li">) {
  return (
    <motion.li variants={fadeUp} className={cn(className)} {...props}>
      {children}
    </motion.li>
  );
}
