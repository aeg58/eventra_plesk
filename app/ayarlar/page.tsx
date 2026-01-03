import { SettingsIcon } from '@/app/components/Icons';

export default function Ayarlar() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Ayarlar
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Sistem ayarlarınızı yapılandırın
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-800 p-12 text-center">
        <SettingsIcon className="w-24 h-24 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Sistem Ayarları
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Bu sayfa henüz geliştirilme aşamasında
        </p>
      </div>
    </div>
  );
}

