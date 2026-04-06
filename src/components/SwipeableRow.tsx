import { useState, useRef } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Pencil, Trash2 } from "lucide-react";

interface SwipeableRowProps {
  children: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function SwipeableRow({ children, onEdit, onDelete }: SwipeableRowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const x = useMotionValue(0);
  const actionsWidth = 120;

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < -50) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleTap = () => {
    if (isOpen) setIsOpen(false);
  };

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Action buttons behind */}
      <div className="absolute right-0 top-0 bottom-0 flex items-stretch" style={{ width: actionsWidth }}>
        {onEdit && (
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center bg-primary text-primary-foreground"
          >
            <Pencil size={16} />
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="flex-1 flex items-center justify-center bg-destructive text-destructive-foreground"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Swipeable foreground */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -actionsWidth, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        onTap={handleTap}
        animate={{ x: isOpen ? -actionsWidth : 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
        style={{ x, touchAction: "pan-y" }}
        className="relative z-10 bg-card"
      >
        {children}
      </motion.div>
    </div>
  );
}
