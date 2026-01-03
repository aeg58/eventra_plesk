'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, CheckCircle2, Circle, Building2, Users, User } from 'lucide-react';

interface OrganizationGroup {
  id: string;
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
}

interface FormSection {
  id: string;
  title: string;
  globalKey: string;
  sortOrder: number;
}

interface FormField {
  id: string;
  label: string;
  fieldKey: string;
  type: 'text' | 'number' | 'phone' | 'date' | 'select' | 'radio' | 'checkbox' | 'textarea' | 'city';
  placeholder?: string;
  helper?: string;
  isRequired: boolean;
  sortOrder: number;
  sectionId: string;
  FormSectionMaster: FormSection;
  FormFieldVisibility?: {
    id: string;
    groupId: string;
    isActive: boolean;
    sortOrder: number;
  }[];
}

interface City {
  id: string;
  name: string;
  slug: string;
}

function SortableFieldItem({
  field,
  selectedGroupId,
  cities,
  onToggleActive,
  onToggleRequired,
}: {
  field: FormField;
  selectedGroupId: string | null;
  cities: City[];
  onToggleActive: (fieldId: string, isActive: boolean) => void;
  onToggleRequired: (fieldId: string, isRequired: boolean) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const visibility = field.FormFieldVisibility?.find(v => v.groupId === selectedGroupId);
  // Eğer visibility kaydı yoksa, alan aktif değil demektir
  const isActive = visibility ? visibility.isActive : false;
  const isRequired = field.isRequired;

  // Şehir alanı için özel render
  if (field.type === 'city') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`bg-white dark:bg-gray-800 rounded-lg border-2 p-4 ${
          isActive ? 'border-blue-500' : 'border-gray-200 dark:border-gray-700'
        } ${isDragging ? 'shadow-lg' : ''}`}
      >
        <div className="flex items-start gap-4">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing mt-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <GripVertical size={20} />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => onToggleActive(field.id, e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="font-medium text-gray-900 dark:text-white">{field.label}</span>
              </label>
            </div>

            <div className="ml-6 mb-2">
              <select
                disabled={!isActive}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Şehir seçin</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>

            {isActive && (
              <div className="ml-6 flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRequired}
                    onChange={(e) => onToggleRequired(field.id, e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Zorunlu</span>
                </label>
              </div>
            )}

            {field.helper && (
              <p className="ml-6 mt-1 text-xs text-gray-500 dark:text-gray-400">{field.helper}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Diğer alan tipleri için standart render
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-gray-800 rounded-lg border-2 p-4 ${
        isActive ? 'border-blue-500' : 'border-gray-200 dark:border-gray-700'
      } ${isDragging ? 'shadow-lg' : ''}`}
    >
      <div className="flex items-start gap-4">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing mt-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <GripVertical size={20} />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => onToggleActive(field.id, e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="font-medium text-gray-900 dark:text-white">{field.label}</span>
            </label>
          </div>

          {isActive && (
            <div className="ml-6 flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRequired}
                  onChange={(e) => onToggleRequired(field.id, e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">Zorunlu</span>
              </label>
            </div>
          )}

          {field.helper && (
            <p className="ml-6 mt-1 text-xs text-gray-500 dark:text-gray-400">{field.helper}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FormAlanlari() {
  const [organizationGroups, setOrganizationGroups] = useState<OrganizationGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchOrganizationGroups();
    fetchCities();
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      fetchFormFields(selectedGroupId);
    } else {
      fetchFormFields(null);
    }
  }, [selectedGroupId]);

  const fetchOrganizationGroups = async () => {
    try {
      const res = await fetch('/eventra/api/organizasyon-gruplari');
      const data = await res.json();
      setOrganizationGroups(data.groups || data || []);
    } catch (error) {
      console.error('Error fetching organization groups:', error);
    }
  };

  const fetchCities = async () => {
    try {
      const res = await fetch('/eventra/api/cities');
      const data = await res.json();
      setCities(data.cities || data || []);
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const fetchFormFields = async (groupId: string | null) => {
    try {
      setLoading(true);
      const url = groupId
        ? `/eventra/api/form-fields?groupId=${groupId}`
        : '/eventra/api/form-fields';
      const res = await fetch(url);
      const data = await res.json();
      setFormFields(data);
    } catch (error) {
      console.error('Error fetching form fields:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (fieldId: string, isActive: boolean) => {
    if (!selectedGroupId) {
      alert('Lütfen önce bir organizasyon grubu seçin');
      return;
    }

    // Sadece local state'i güncelle, kaydetme işlemi için beklet
    setFormFields((prev) =>
      prev.map((field) => {
        if (field.id === fieldId) {
          const visibility = field.FormFieldVisibility || [];
          const existingVisibility = visibility.find((v) => v.groupId === selectedGroupId);
          if (existingVisibility) {
            return {
              ...field,
              FormFieldVisibility: visibility.map((v) =>
                v.groupId === selectedGroupId ? { ...v, isActive } : v
              ),
            };
          } else {
            return {
              ...field,
              FormFieldVisibility: [
                ...visibility,
                {
                  id: `${selectedGroupId}-${fieldId}`,
                  groupId: selectedGroupId,
                  isActive,
                  sortOrder: 0,
                },
              ],
            };
          }
        }
        return field;
      })
    );
  };

  const handleToggleRequired = async (fieldId: string, isRequired: boolean) => {
    // Sadece local state'i güncelle, kaydetme işlemi için beklet
    setFormFields((prev) =>
      prev.map((field) =>
        field.id === fieldId ? { ...field, isRequired } : field
      )
    );
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !selectedGroupId) {
      return;
    }

    const oldIndex = formFields.findIndex((field) => field.id === active.id);
    const newIndex = formFields.findIndex((field) => field.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Aynı bölüm içinde sıralama
    const sectionId = formFields[oldIndex].sectionId;
    const sectionFields = formFields.filter((f) => f.sectionId === sectionId);
    const sectionOldIndex = sectionFields.findIndex((f) => f.id === active.id);
    const sectionNewIndex = sectionFields.findIndex((f) => f.id === over.id);

    if (sectionOldIndex === -1 || sectionNewIndex === -1) {
      return;
    }

    const reorderedSectionFields = arrayMove(sectionFields, sectionOldIndex, sectionNewIndex);

    // Tüm alanları yeniden sırala
    const otherFields = formFields.filter((f) => f.sectionId !== sectionId);
    const reorderedFields = [...otherFields, ...reorderedSectionFields].sort((a, b) => {
      if (a.FormSectionMaster.sortOrder !== b.FormSectionMaster.sortOrder) {
        return a.FormSectionMaster.sortOrder - b.FormSectionMaster.sortOrder;
      }
      if (a.sectionId === sectionId && b.sectionId === sectionId) {
        const aIndex = reorderedSectionFields.findIndex((f) => f.id === a.id);
        const bIndex = reorderedSectionFields.findIndex((f) => f.id === b.id);
        return aIndex - bIndex;
      }
      return a.sortOrder - b.sortOrder;
    });

    setFormFields(reorderedFields);

    // Sıralamayı local state'te güncelle (kaydet butonuna basıldığında kaydedilecek)
    setFormFields((prev) =>
      prev.map((field) => {
        const reorderedField = reorderedSectionFields.find((f) => f.id === field.id);
        if (reorderedField) {
          const newIndex = reorderedSectionFields.findIndex((f) => f.id === field.id);
          const visibility = field.FormFieldVisibility?.find((v) => v.groupId === selectedGroupId);
          if (visibility) {
            return {
              ...field,
              FormFieldVisibility: field.FormFieldVisibility?.map((v) =>
                v.groupId === selectedGroupId ? { ...v, sortOrder: newIndex } : v
              ) || [],
            };
          }
        }
        return field;
      })
    );
  };

  // Bölümlere göre grupla
  const fieldsBySection = formFields.reduce((acc, field) => {
    const sectionKey = field.FormSectionMaster.globalKey;
    if (!acc[sectionKey]) {
      acc[sectionKey] = {
        section: field.FormSectionMaster,
        fields: [],
      };
    }
    acc[sectionKey].fields.push(field);
    return acc;
  }, {} as Record<string, { section: FormSection; fields: FormField[] }>);

  // Bölümleri sırala - Kurumsal Bilgiler en üstte, Davet Bilgileri hariç
  const sortedSections = Object.entries(fieldsBySection)
    .filter(([key]) => !key.includes('davet')) // Davet bilgilerini filtrele
    .sort(([keyA, { section: sectionA }], [keyB, { section: sectionB }]) => {
      // Kurumsal bilgiler her zaman en üstte
      if (keyA.includes('kurumsal') || keyA.includes('firma')) return -1;
      if (keyB.includes('kurumsal') || keyB.includes('firma')) return 1;
      
      // Damat ve Gelin alt alta (Damat önce)
      if (keyA.includes('damat') && keyB.includes('gelin')) return -1;
      if (keyA.includes('gelin') && keyB.includes('damat')) return 1;
      
      // Diğerleri sortOrder'a göre
      return sectionA.sortOrder - sectionB.sortOrder;
    });

  // Bölümdeki tüm alanların aktif olup olmadığını kontrol et
  const isSectionAllActive = (fields: FormField[]) => {
    if (fields.length === 0) return false;
    return fields.every((field) => {
      const visibility = field.FormFieldVisibility?.find((v) => v.groupId === selectedGroupId);
      return visibility ? visibility.isActive : false;
    });
  };

  // Bölümdeki tüm alanları aktif/pasif yap
  const handleToggleSectionAll = (fields: FormField[], isActive: boolean) => {
    if (!selectedGroupId) {
      alert('Lütfen önce bir organizasyon grubu seçin');
      return;
    }

    // Sadece local state'i güncelle, kaydetme işlemi için beklet
    setFormFields((prev) =>
      prev.map((field) => {
        if (fields.find((f) => f.id === field.id)) {
          const visibility = field.FormFieldVisibility || [];
          const existingVisibility = visibility.find((v) => v.groupId === selectedGroupId);
          if (existingVisibility) {
            return {
              ...field,
              FormFieldVisibility: visibility.map((v) =>
                v.groupId === selectedGroupId ? { ...v, isActive } : v
              ),
            };
          } else {
            return {
              ...field,
              FormFieldVisibility: [
                ...visibility,
                {
                  id: `${selectedGroupId}-${field.id}`,
                  groupId: selectedGroupId,
                  isActive,
                  sortOrder: 0,
                },
              ],
            };
          }
        }
        return field;
      })
    );
  };

  // Tüm değişiklikleri kaydet
  const handleSave = async () => {
    if (!selectedGroupId) {
      alert('Lütfen önce bir organizasyon grubu seçin');
      return;
    }

    try {
      setSaving(true);

      // Tüm form alanlarını kaydet
      const promises = formFields.map(async (field) => {
        const visibility = field.FormFieldVisibility?.find((v) => v.groupId === selectedGroupId);
        
        // Visibility kaydı varsa veya oluşturulması gerekiyorsa kaydet
        const isActive = visibility?.isActive ?? false;
        
        const res = await fetch('/eventra/api/form-fields', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fieldId: field.id,
            groupId: selectedGroupId,
            isActive: isActive,
            isRequired: field.isRequired,
            sortOrder: visibility?.sortOrder ?? field.sortOrder,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || data.message || 'Güncelleme başarısız');
        }
      });

      await Promise.all(promises);

      // Başarı mesajı göster
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);

      // Sayfayı yeniden yükle
      await fetchFormFields(selectedGroupId);
    } catch (error: any) {
      console.error('Error saving form fields:', error);
      alert(error.message || 'Değişiklikler kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  // Bölüm ikonları
  const getSectionIcon = (globalKey: string) => {
    if (globalKey.includes('gelin') || globalKey.includes('Gelin')) {
      return <User className="w-5 h-5" />;
    }
    if (globalKey.includes('damat') || globalKey.includes('Damat')) {
      return <User className="w-5 h-5" />;
    }
    if (globalKey.includes('firma') || globalKey.includes('Firma')) {
      return <Building2 className="w-5 h-5" />;
    }
    if (globalKey.includes('yetkili') || globalKey.includes('Yetkili')) {
      return <Users className="w-5 h-5" />;
    }
    return <Circle className="w-5 h-5" />;
  };

  return (
    <div className="h-full flex gap-4">
      {/* Sol Panel - Organizasyon Grupları */}
      <div className="w-80 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Organizasyon Grupları
        </h2>
        <div className="space-y-2">
          {organizationGroups.map((group) => (
            <button
              key={group.id}
              onClick={() => setSelectedGroupId(group.id)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                selectedGroupId === group.id
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
              }`}
            >
              <div className="font-medium">{group.name}</div>
              {group.description && (
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {group.description}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Sağ Panel - Form Alanları */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
        {!selectedGroupId ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              Lütfen sol taraftan bir organizasyon grubu seçin
            </p>
          </div>
        ) : loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Yükleniyor...</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Form Alanları Yönetimi
              </h2>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium shadow-sm flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Kaydediliyor...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Kaydet</span>
                  </>
                )}
              </button>
            </div>

            {showSaveSuccess && (
              <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">Değişiklikler başarıyla kaydedildi!</span>
                </div>
              </div>
            )}

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <div className="space-y-6">
                {sortedSections.map(([sectionKey, { section, fields }]) => {
                  const allActive = isSectionAllActive(fields);
                  
                  return (
                    <div key={section.id} className="space-y-3">
                      <div className="flex items-center gap-3 mb-3">
                        {getSectionIcon(section.globalKey)}
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex-1">
                          {section.title}
                        </h3>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={allActive}
                            onChange={(e) => handleToggleSectionAll(fields, e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Tümünü Seç</span>
                        </label>
                      </div>

                    <SortableContext
                      items={fields.map((f) => f.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3">
                        {fields.map((field) => (
                          <SortableFieldItem
                            key={field.id}
                            field={field}
                            selectedGroupId={selectedGroupId}
                            cities={cities}
                            onToggleActive={handleToggleActive}
                            onToggleRequired={handleToggleRequired}
                          />
                        ))}
                      </div>
                    </SortableContext>
                    </div>
                  );
                })}
              </div>
            </DndContext>

            {Object.keys(fieldsBySection).length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  Bu organizasyon grubu için henüz form alanı tanımlanmamış
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
