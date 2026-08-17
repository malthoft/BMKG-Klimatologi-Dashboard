"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onCancel}
          />

          {/* Dialog Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-surface rounded-2xl shadow-xl border border-border p-6 overflow-hidden mx-4"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 text-red-600">
                <div className="p-2 bg-red-100 rounded-xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-text-primary">{title}</h3>
              </div>
              <button
                onClick={onCancel}
                className="text-text-secondary hover:bg-surface-container-low p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-text-secondary text-sm leading-relaxed mb-6">
              {message}
            </p>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/50">
              <button
                onClick={onCancel}
                className="px-4 py-2 font-bold text-sm rounded-xl text-text-secondary hover:bg-surface-container-low transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onConfirm();
                }}
                className="px-4 py-2 font-bold text-sm rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-sm transition-colors"
              >
                Ya, Lanjutkan
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
