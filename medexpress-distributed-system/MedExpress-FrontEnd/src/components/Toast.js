import React from 'react';
import { useCart } from '../CartContext';

export default function Toast() {
  const { toastMsg } = useCart();

  if (!toastMsg) return null;

  return (
    <div className="toast-container position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1100 }}>
      <div className={`toast show align-items-center border-0 text-bg-${toastMsg.tipo}`} role="alert">
        <div className="d-flex">
          <div className="toast-body">
            <i className="bi bi-check-circle me-2"></i>
            {toastMsg.msg}
          </div>
        </div>
      </div>
    </div>
  );
}
