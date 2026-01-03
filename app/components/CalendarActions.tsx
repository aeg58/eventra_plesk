'use client';

import { useState } from 'react';
import { PrinterIcon } from './Icons';
import CalendarPrintModal from './CalendarPrintModal';

export default function CalendarActions() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-medium shadow-md whitespace-nowrap"
      >
        <PrinterIcon className="w-4 h-4" />
        <span>Takvimi Yazdır</span>
      </button>

      <CalendarPrintModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

