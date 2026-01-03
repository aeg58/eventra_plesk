'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Musteriler() {
  const router = useRouter();

  useEffect(() => {
    // Aktif müşteriler sayfasına yönlendir
    router.replace('/musteriler/aktif');
  }, [router]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Yönlendiriliyor...</p>
      </div>
    </div>
  );
}

