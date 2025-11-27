'use client';

import React, { useEffect, useRef } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (dialog && e.target === dialog) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      onClick={handleBackdropClick}
      onClose={onClose}
    >
      <div className="modal-box">
        {title && <h3 className="font-bold text-lg mb-4">{title}</h3>}
        <button
          type="button"
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={onClose}
          aria-label="Close modal"
        >
          ✕
        </button>
        {children}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}
