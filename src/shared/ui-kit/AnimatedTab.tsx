// src/shared/ui-kit/AnimatedTab.tsx
import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";

type Props = {
  activeKey: string;
  children: ReactNode;
};

export function AnimatedTab({ activeKey, children }: Props) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeKey}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{
          duration: 0.2,
          ease: "easeOut",
          layout: { duration: 1, ease: "easeIn" },
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
