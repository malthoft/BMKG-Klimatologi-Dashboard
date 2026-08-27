"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { ConfirmDialog } from "./confirm-dialog";

interface ConfirmContextType {
  confirm: (message: string, title?: string) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{ title: string; message: string; resolve: (value: boolean) => void }>({
    title: "",
    message: "",
    resolve: () => {},
  });

  const confirm = (message: string, title: string = "Konfirmasi Tindakan"): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogConfig({ title, message, resolve });
      setIsOpen(true);
    });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    dialogConfig.resolve(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    dialogConfig.resolve(false);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmDialog
        isOpen={isOpen}
        title={dialogConfig.title}
        message={dialogConfig.message}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context.confirm;
}
