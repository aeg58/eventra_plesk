'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CalendarIcon, PrinterIcon } from '@/app/components/Icons';
import SearchableSelect from '@/app/components/SearchableSelect';
import DatePicker from '@/app/components/DatePicker';
import { formatDateForInput } from '@/app/lib/dateUtils';
import { 
  Calendar, 
  Users, 
  FileText, 
  DollarSign, 
  Info,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Building2,
  Sparkles,
  UserCircle,
  Heart,
  Search,
  Loader2
} from 'lucide-react';
import { TURKISH_CITIES } from '@/app/utils/turkish-cities';

interface OrganizationGroup {
  id: string;
  name: string;
  slug: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface FormField {
  id: string;
  label: string;
  fieldKey: string;
  type: string;
  placeholder?: string;
  isRequired: boolean;
  FormSectionMaster: {
    id: string;
    title: string;
    globalKey: string;
  };
  FormFieldVisibility?: Array<{
    isActive: boolean;
  }>;
}

function YeniRezervasyonContent() {
  const searchParams = useSearchParams();
  const reservationId = searchParams?.get('id') || null;
  const [isEditMode, setIsEditMode] = useState(false);
  const [loadingReservation, setLoadingReservation] = useState(false);
  const hasMatchedIds = useRef(false);
  const [organizations, setOrganizations] = useState<OrganizationGroup[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [cities, setCities] = useState<Array<{ id: string; name: string }>>([]);
  const [offices, setOffices] = useState<Array<{ id: string; name: string; code?: string }>>([]);
  const [salons, setSalons] = useState<Array<{ id: string; name: string; capacity?: number }>>([]);
  const [timeSlots, setTimeSlots] = useState<Array<{ id: string; name: string; startTime: string; endTime: string; capacity?: number }>>([]);
  const [disabledTimeSlots, setDisabledTimeSlots] = useState<Set<string>>(new Set()); // Çakışan zaman dilimleri
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>('');
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>('');
  const [selectedSalonId, setSelectedSalonId] = useState<string>('');
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [dynamicFormData, setDynamicFormData] = useState<Record<string, any>>({});
  const [activeStep, setActiveStep] = useState(1);
  const [packages, setPackages] = useState<Array<{ id: string; name: string; description?: string; price?: number; perPersonPrice?: number; minGuests?: number; maxGuests?: number; details?: string }>>([]);
  const [allProducts, setAllProducts] = useState<Array<{ id: string; name: string; price?: number; unit?: string }>>([]);
  const [isCustomOffer, setIsCustomOffer] = useState(false);
  const [selectedExtras, setSelectedExtras] = useState<Array<{ id: string; name: string; price: number; unit?: string }>>([]);
  const [extraSearchQuery, setExtraSearchQuery] = useState('');
  const [reservationSources, setReservationSources] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [contractTemplates, setContractTemplates] = useState<Array<{ id: string; title: string }>>([]);
  const [showInvoiceFields, setShowInvoiceFields] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    // Temel Bilgiler
    yetkili: '',
    organizasyonGrupId: '',
    rezervasyonTarihi: '',
    sozlesmeTarihi: '',
    zamanDilimi: '',
    officeId: '',
    salonId: '',
    
    // Rezervasyon Detayları
    durum: 'Açık',
    program: '',
    davetiSayisi: '',
    fiyatKisiBasi: '',
    sozlesmeFiyati: '',
    ekstralar: '',
    iskonto: '',
    iskontoYuzde: false,
    kdvOrani: '20',
    minGuests: '',
    maxGuests: '',
    ozelNotlar: '',
    ekstraNotu: '',
    kaynakId: '',
    
    // Kontrat Bilgileri
    oneren: '',
    sozlesmeKontrati: '',
    kontratSahibiAdSoyad: '',
    kontratSahibiTc: '',
    kontratSahibiTelefon: '',
    kontratAdresi: '',
    faturaIstiyorum: false,
    faturaUnvani: '',
    faturaVergiDairesi: '',
    faturaVergiNo: '',
    faturaAdresi: '',
    
    // Kapora Bilgileri
    kaporaEkle: false,
    kaporaTutari: '',
    kaporaOtomatik: true,
    kaporaCashBoxId: '',
    kaporaPaymentMethod: 'Nakit',
    kaporaPaymentDate: new Date().toISOString().split('T')[0],
    kaporaNotes: '',
  });

  const [showEkstralar, setShowEkstralar] = useState(false);
  const [cashBoxes, setCashBoxes] = useState<Array<{ id: string; kasaAdi: string; tur: string }>>([]);
  const [kaporaYuzdesi, setKaporaYuzdesi] = useState<number>(20);
  
  // Fatura alanlarının görünürlüğünü kontrol et
  useEffect(() => {
    setShowInvoiceFields(formData.faturaIstiyorum);
  }, [formData.faturaIstiyorum]);

  useEffect(() => {
    fetchOrganizations();
    fetchUsers();
    fetchCities();
    fetchOffices();
    fetchAllProducts();
    fetchReservationSources();
    fetchContractTemplates();
    
    // Kapora yüzdesini yükle
    fetch('/eventra/api/ayarlar/finans/kapora', {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        if (data.kaporaYuzdesi !== undefined) {
          setKaporaYuzdesi(data.kaporaYuzdesi);
        }
      })
      .catch(err => console.error('Kapora yüzdesi yüklenemedi:', err));
    
    // Kasaları yükle
    fetch('/eventra/api/cash-boxes', {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        if (data.cashBoxes) {
          const activeBoxes = data.cashBoxes.filter((box: any) => box.isActive);
          setCashBoxes(activeBoxes);
        }
      })
      .catch(err => console.error('Kasalar yüklenemedi:', err));
  }, []);

  useEffect(() => {
    // Eğer ID varsa, mevcut rezervasyonu yükle
    if (reservationId) {
      setIsEditMode(true);
      fetchReservationForEdit(reservationId);
    } else {
      // Query parametrelerinden müşteri bilgilerini al (aday müşteriden dönüştürme)
      const customerId = searchParams?.get('customerId');
      const customerName = searchParams?.get('customerName');
      const customerPhone = searchParams?.get('customerPhone');
      const customerEmail = searchParams?.get('customerEmail');
      const tarih = searchParams?.get('tarih');
      
      // Tarih parametresini rezervasyon tarihine set et
      if (tarih) {
        setFormData(prev => ({
          ...prev,
          rezervasyonTarihi: tarih
        }));
      }
      
      if (customerId && customerName) {
        // Müşteri bilgilerini dinamik form verilerine ekle
        // Farklı field key varyasyonlarını destekle
        setDynamicFormData(prev => ({
          ...prev,
          // Genel müşteri bilgileri
          customerName: customerName,
          customerPhone: customerPhone || '',
          customerEmail: customerEmail || '',
          // Damat/Gelin alanları için de ekle (organizasyon grubuna göre değişebilir)
          damat_adSoyad: customerName,
          damat_telefon: customerPhone || '',
          damat_email: customerEmail || '',
          gelin_adSoyad: customerName,
          gelin_telefon: customerPhone || '',
          gelin_email: customerEmail || '',
        }));
        
        setToastMessage('Müşteri bilgileri yüklendi. Lütfen organizasyon grubu seçin ve formu tamamlayın.');
        setToastType('success');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 5000);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservationId, searchParams]);

  useEffect(() => {
    if (selectedOrganizationId) {
      fetchPackages(selectedOrganizationId);
    } else {
      setPackages([]);
    }
  }, [selectedOrganizationId]);

  useEffect(() => {
    if (selectedOfficeId) {
      fetchSalons(selectedOfficeId);
      fetchTimeSlots(selectedOfficeId, null);
    } else {
      setSalons([]);
      setTimeSlots([]);
      setSelectedSalonId('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOfficeId]);

  useEffect(() => {
    if (selectedSalonId) {
      fetchTimeSlots(selectedOfficeId, selectedSalonId);
    } else if (selectedOfficeId) {
      fetchTimeSlots(selectedOfficeId, null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSalonId, selectedOfficeId]);

  // Zaman dilimlerini çakışma kontrolü ile filtrele
  useEffect(() => {
    const checkTimeSlotConflicts = async () => {
      // Tarih, şube ve salon seçilmiş olmalı
      if (!formData.rezervasyonTarihi || !selectedOfficeId || !selectedSalonId || timeSlots.length === 0) {
        setDisabledTimeSlots(new Set());
        return;
      }

      const excludeId = isEditMode && reservationId ? reservationId : null;
      const disabledSlots = new Set<string>();

      // Her zaman dilimi için çakışma kontrolü yap
      for (const slot of timeSlots) {
        try {
          const params = new URLSearchParams({
            rezervasyonTarihi: formData.rezervasyonTarihi,
            officeId: selectedOfficeId,
            salonId: selectedSalonId,
            zamanDilimi: slot.id,
          });

          if (excludeId) {
            params.append('excludeReservationId', excludeId);
          }

          const res = await fetch(`/eventra/api/reservations/check-conflict?${params.toString()}`, {
            credentials: 'include',
            cache: 'no-store',
          });

          if (res.ok) {
            const data = await res.json();
            if (data.hasConflict) {
              disabledSlots.add(slot.id);
            }
          }
        } catch (error) {
          console.error(`Zaman dilimi ${slot.id} kontrolü hatası:`, error);
        }
      }

      setDisabledTimeSlots(disabledSlots);
    };

    checkTimeSlotConflicts();
  }, [formData.rezervasyonTarihi, selectedOfficeId, selectedSalonId, timeSlots, isEditMode, reservationId]);

  // Zaman dilimi, yetkili ve öneren ID eşleştirmesi için useEffect
  useEffect(() => {
    if (!isEditMode || hasMatchedIds.current) return;
    
    // Kullanıcılar ve rezervasyon kaynakları yüklendi mi kontrol et
    // Zaman dilimi için timeSlots yüklenmesi opsiyonel (string formatında da olabilir)
    const usersAndSourcesLoaded = users.length > 0 && reservationSources.length > 0;
    if (!usersAndSourcesLoaded) return;

    let updated = false;

    // Zaman dilimi ID eşleştirmesi - timeSlots yüklendiğinde ve zamanDilimi string formatındaysa
    if (formData.zamanDilimi && timeSlots.length > 0) {
      // Eğer zamanDilimi zaten bir ID formatındaysa (UUID veya timeslot-xxx gibi) kontrol et
      const isAlreadyId = timeSlots.some(slot => slot.id === formData.zamanDilimi);
      
      if (!isAlreadyId) {
        // String formatından ID'ye çevir (örn: "10:00 - 14:00" -> slot ID)
        const matchingSlot = timeSlots.find(slot => {
          const slotTimeStr = `${slot.startTime} - ${slot.endTime}`;
          return formData.zamanDilimi === slotTimeStr ||
                 formData.zamanDilimi === slot.name ||
                 (typeof formData.zamanDilimi === 'string' && (
                   formData.zamanDilimi.includes(slot.startTime) ||
                   formData.zamanDilimi.includes(slot.endTime)
                 ));
        });
        if (matchingSlot) {
          setFormData(prev => {
            if (prev.zamanDilimi !== matchingSlot.id) {
              updated = true;
              return {
                ...prev,
                zamanDilimi: matchingSlot.id
              };
            }
            return prev;
          });
        }
      }
    }

    // Yetkili ID eşleştirmesi - sadece users yüklendiğinde ve yetkili string formatındaysa
    if (formData.yetkili) {
      const isAlreadyId = users.some(user => user.id === formData.yetkili);
      
      if (!isAlreadyId) {
        const matchingUser = users.find(user => user.name === formData.yetkili);
        if (matchingUser) {
          setFormData(prev => {
            if (prev.yetkili !== matchingUser.id) {
              updated = true;
              return {
                ...prev,
                yetkili: matchingUser.id
              };
            }
            return prev;
          });
        }
      }
    }

    // Öneren ID eşleştirmesi - sadece reservationSources yüklendiğinde ve oneren string formatındaysa
    if (formData.oneren) {
      const isAlreadyId = reservationSources.some(source => source.id === formData.oneren);
      
      if (!isAlreadyId) {
        const matchingSource = reservationSources.find(source => source.name === formData.oneren);
        if (matchingSource) {
          setFormData(prev => {
            if (prev.oneren !== matchingSource.id) {
              updated = true;
              return {
                ...prev,
                oneren: matchingSource.id
              };
            }
            return prev;
          });
        }
      }
    }

    // Eğer hiçbir güncelleme yapılmadıysa, bir sonraki render'da tekrar kontrol etme
    if (!updated) {
      hasMatchedIds.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, timeSlots, users, reservationSources]);

  useEffect(() => {
    if (selectedOrganizationId) {
      fetchFormFields(selectedOrganizationId);
      setActiveStep(2);
    } else {
      setFormFields([]);
      setDynamicFormData({});
      setActiveStep(1);
    }
  }, [selectedOrganizationId]);

  const fetchOrganizations = async () => {
    try {
      const res = await fetch('/eventra/api/organizasyon-gruplari', {
        cache: 'no-store',
      });
      
      if (res.ok) {
        const data = await res.json();
        setOrganizations(data.groups || []);
      }
    } catch (error) {
      console.error('Fetch organizations error:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/eventra/api/users', {
        cache: 'no-store',
      });
      
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Fetch users error:', error);
    }
  };

  const fetchCities = async () => {
    try {
      const res = await fetch('/eventra/api/cities', {
        cache: 'no-store',
      });
      
      if (res.ok) {
        const data = await res.json();
        setCities(data || []);
      }
    } catch (error) {
      console.error('Fetch cities error:', error);
    }
  };

  const fetchOffices = async () => {
    try {
      const res = await fetch('/eventra/api/offices', {
        cache: 'no-store',
      });
      
      if (res.ok) {
        const data = await res.json();
        // API direkt array döndürüyor, data.offices değil
        const officesArray = Array.isArray(data) ? data : (data.offices || []);
        // Sadece aktif ofisleri filtrele
        const activeOffices = officesArray.filter((office: any) => office.isActive !== false);
        setOffices(activeOffices);
      }
    } catch (error) {
      console.error('Fetch offices error:', error);
    }
  };

  const fetchSalons = async (officeId: string): Promise<Array<{ id: string; name: string; capacity?: number }>> => {
    try {
      const res = await fetch(`/eventra/api/salons?officeId=${officeId}`, {
        cache: 'no-store',
      });
      
      if (res.ok) {
        const data = await res.json();
        // API direkt array döndürüyor, data.salons değil
        const salonsArray = Array.isArray(data) ? data : (data.salons || []);
        // Sadece aktif salonları filtrele
        const activeSalons = salonsArray.filter((salon: any) => salon.isActive !== false);
        setSalons(activeSalons);
        return activeSalons;
      }
      return [];
    } catch (error) {
      console.error('Fetch salons error:', error);
      return [];
    }
  };

  const fetchTimeSlots = async (officeId: string, salonId: string | null): Promise<Array<{ id: string; name: string; startTime: string; endTime: string; capacity?: number }>> => {
    try {
      let url = '/eventra/api/time-slots';
      const params = [];
      if (officeId) params.push(`officeId=${officeId}`);
      if (salonId) params.push(`salonId=${salonId}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const res = await fetch(url, {
        cache: 'no-store',
      });
      
      if (res.ok) {
        const data = await res.json();
        // API direkt array döndürüyor, data.timeSlots değil
        const timeSlotsArray = Array.isArray(data) ? data : (data.timeSlots || []);
        setTimeSlots(timeSlotsArray);
        return timeSlotsArray;
      }
      return [];
    } catch (error) {
      console.error('Fetch time slots error:', error);
      setTimeSlots([]); // Hata durumunda boş array set et
      return [];
    }
  };

  const fetchReservationForEdit = async (id: string) => {
    try {
      setLoadingReservation(true);
      hasMatchedIds.current = false; // Reset ID matching flag
      const res = await fetch(`/eventra/api/reservations/${id}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Rezervasyon yüklenemedi');
      }

      const data = await res.json();
      const reservation = data.reservation;

      if (!reservation) {
        throw new Error('Rezervasyon bulunamadı');
      }

      // Form verilerini doldur
      setFormData({
        yetkili: reservation.yetkili || '',
        organizasyonGrupId: reservation.organizasyonGrupId || '',
        rezervasyonTarihi: reservation.rezervasyonTarihi 
          ? formatDateForInput(reservation.rezervasyonTarihi)
          : '',
        sozlesmeTarihi: reservation.sozlesmeTarihi
          ? formatDateForInput(reservation.sozlesmeTarihi)
          : '',
        zamanDilimi: reservation.zamanDilimi || '',
        officeId: reservation.officeId || '',
        salonId: reservation.salonId || '',
        durum: reservation.durum || 'Açık',
        program: reservation.paketId || '',
        davetiSayisi: reservation.davetiSayisi ? String(reservation.davetiSayisi) : '',
        fiyatKisiBasi: reservation.fiyatKisiBasi ? String(reservation.fiyatKisiBasi) : '',
        sozlesmeFiyati: reservation.sozlesmeFiyati ? String(reservation.sozlesmeFiyati) : '',
        ekstralar: '',
        iskonto: reservation.iskonto ? String(reservation.iskonto) : '',
        iskontoYuzde: reservation.iskontoYuzde || false,
        kdvOrani: reservation.kdvOrani ? String(reservation.kdvOrani) : '20',
        minGuests: '',
        maxGuests: '',
        ozelNotlar: reservation.ozelNotlar || '',
        ekstraNotu: reservation.ekstraNotu || '',
        kaynakId: reservation.kaynakId || '',
        oneren: '',
        sozlesmeKontrati: reservation.sozlesmeKontrati || '',
        kontratSahibiAdSoyad: reservation.kontratSahibiAdSoyad || '',
        kontratSahibiTc: reservation.kontratSahibiTc || '',
        kontratSahibiTelefon: reservation.kontratSahibiTelefon || '',
        kontratAdresi: reservation.kontratAdresi || '',
        faturaIstiyorum: reservation.faturaIstiyorum || false,
        faturaUnvani: reservation.faturaUnvani || '',
        faturaVergiDairesi: reservation.faturaVergiDairesi || '',
        faturaVergiNo: reservation.faturaVergiNo || '',
        faturaAdresi: reservation.faturaAdresi || '',
        kaporaEkle: false,
        kaporaTutari: '',
        kaporaOtomatik: true,
        kaporaCashBoxId: '',
        kaporaPaymentMethod: 'Nakit',
        kaporaPaymentDate: new Date().toISOString().slice(0, 16), // datetime-local format
        kaporaNotes: '',
      });

      // Dinamik form verilerini doldur
      if (reservation.ReservationDynamicValues && reservation.ReservationDynamicValues.length > 0) {
        const dynamicData: Record<string, any> = {};
        reservation.ReservationDynamicValues.forEach((dv: { fieldKey: string; fieldValue: string }) => {
          dynamicData[dv.fieldKey] = dv.fieldValue;
        });
        setDynamicFormData(dynamicData);
        
        // oneren alanını dinamik form verilerinden al ve formData'ya set et
        if (dynamicData.oneren) {
          setFormData(prev => ({
            ...prev,
            oneren: dynamicData.oneren
          }));
        }
      } else {
        // Eğer dinamik form verileri yoksa, oneren'i boş bırak
        setFormData(prev => ({
          ...prev,
          oneren: prev.oneren || ''
        }));
      }

      // Mevcut rezervasyonun ilk kapora ödemesini bul
      if (reservation.Payments && reservation.Payments.length > 0) {
        const kaporaPayment = reservation.Payments.find((p: any) => 
          p.notes && p.notes.includes('Kapora') && !p.isCancelled
        );
        
        if (kaporaPayment) {
          setFormData(prev => ({
            ...prev,
            kaporaEkle: true,
            kaporaTutari: String(kaporaPayment.amount),
            kaporaOtomatik: false, // Mevcut ödeme varsa manuel
            kaporaCashBoxId: kaporaPayment.cashBoxId || '',
            kaporaPaymentMethod: kaporaPayment.paymentMethod || 'Nakit',
            kaporaPaymentDate: kaporaPayment.paymentDate 
              ? formatDateForInput(kaporaPayment.paymentDate)
              : new Date().toISOString().slice(0, 16), // datetime-local format
            kaporaNotes: kaporaPayment.notes?.replace('Kapora - ', '') || '',
          }));
        }
      }

      // Organizasyon, ofis, salon seçimlerini yap
      if (reservation.organizasyonGrupId) {
        setSelectedOrganizationId(reservation.organizasyonGrupId);
        // Form alanlarını yükle
        fetchFormFields(reservation.organizasyonGrupId);
      }

      if (reservation.officeId) {
        setSelectedOfficeId(reservation.officeId);
        const loadedSalons = await fetchSalons(reservation.officeId);
        
        // Salonlar yüklendikten sonra salon seçimini yap
        if (reservation.salonId) {
          setSelectedSalonId(reservation.salonId);
          const loadedTimeSlots = await fetchTimeSlots(reservation.officeId, reservation.salonId);
          
          // Zaman dilimi slotları yüklendikten sonra zaman dilimi eşleştirmesi yap
          if (reservation.zamanDilimi && loadedTimeSlots.length > 0) {
            const matchingSlot = loadedTimeSlots.find(slot => {
              const slotTimeStr = `${slot.startTime} - ${slot.endTime}`;
              return reservation.zamanDilimi === slot.id || 
                     reservation.zamanDilimi === slotTimeStr ||
                     reservation.zamanDilimi === slot.name ||
                     (typeof reservation.zamanDilimi === 'string' && (
                       reservation.zamanDilimi.includes(slot.startTime) ||
                       reservation.zamanDilimi.includes(slot.endTime)
                     ));
            });
            if (matchingSlot) {
              setFormData(prev => ({
                ...prev,
                zamanDilimi: matchingSlot.id
              }));
            }
          }
        }
      }

      // Yetkili ID eşleştirmesi - users zaten yüklü olmalı (component mount'ta yükleniyor)
      if (reservation.yetkili && users.length > 0) {
        const matchingUser = users.find(user => 
          user.name === reservation.yetkili || user.id === reservation.yetkili
        );
        if (matchingUser && reservation.yetkili !== matchingUser.id) {
          setFormData(prev => ({
            ...prev,
            yetkili: matchingUser.id
          }));
        }
      }

      // Öneren ID eşleştirmesi - reservationSources zaten yüklü olmalı (component mount'ta yükleniyor)
      // Eğer henüz yüklenmemişse, useEffect içindeki eşleştirme mantığı bunu yakalayacak
      if (reservation.ReservationDynamicValues) {
        const onerenValue = reservation.ReservationDynamicValues.find(
          (dv: { fieldKey: string; fieldValue: string }) => dv.fieldKey === 'oneren'
        )?.fieldValue;
        
        if (onerenValue) {
          if (reservationSources.length > 0) {
            const matchingSource = reservationSources.find(source => 
              source.name === onerenValue || source.id === onerenValue
            );
            if (matchingSource) {
              setFormData(prev => ({
                ...prev,
                oneren: matchingSource.id
              }));
            } else {
              // Eğer eşleşme bulunamazsa, string değeri direkt kullan
              setFormData(prev => ({
                ...prev,
                oneren: onerenValue
              }));
            }
          } else {
            // Eğer reservationSources henüz yüklenmediyse, string değeri direkt kullan
            // useEffect içindeki eşleştirme mantığı bunu yakalayacak
            setFormData(prev => ({
              ...prev,
              oneren: onerenValue
            }));
          }
        }
      }

      // Özel teklif durumunu kontrol et
      setIsCustomOffer(reservation.ozelTeklif || false);

    } catch (error: any) {
      console.error('Fetch reservation error:', error);
      setToastMessage(error.message || 'Rezervasyon yüklenirken bir hata oluştu');
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    } finally {
      setLoadingReservation(false);
    }
  };

  const fetchFormFields = async (groupId: string) => {
    try {
      setLoadingFields(true);
      const res = await fetch(`/eventra/api/form-fields?groupId=${groupId}`, {
        cache: 'no-store',
      });
      
      if (res.ok) {
        const fields = await res.json();
        // Sadece aktif olan alanları filtrele
        const activeFields = fields.filter((field: FormField) => {
          if (!field.FormFieldVisibility || field.FormFieldVisibility.length === 0) {
            return false;
          }
          return field.FormFieldVisibility[0].isActive;
        });
        setFormFields(activeFields);
        if (activeFields.length > 0) {
          setActiveStep(2);
        }
      }
    } catch (error) {
      console.error('Fetch form fields error:', error);
    } finally {
      setLoadingFields(false);
    }
  };

  const fetchPackages = async (groupId: string) => {
    try {
      const res = await fetch(`/eventra/api/organizasyon-paketleri?groupId=${groupId}&isActive=true`, {
        cache: 'no-store',
      });
      
      if (res.ok) {
        const data = await res.json();
        setPackages(data.packages || []);
      }
    } catch (error) {
      console.error('Fetch packages error:', error);
    }
  };

  const fetchAllProducts = async () => {
    try {
      const res = await fetch('/eventra/api/organizasyon-urunleri?isActive=true', {
        cache: 'no-store',
      });
      
      if (res.ok) {
        const data = await res.json();
        setAllProducts(data.items || []);
      }
    } catch (error) {
      console.error('Fetch all products error:', error);
    }
  };

  const fetchReservationSources = async () => {
    try {
      const res = await fetch('/eventra/api/rezervasyon-kaynaklari', {
        cache: 'no-store',
      });
      
      if (res.ok) {
        const data = await res.json();
        setReservationSources(data.sources || []);
      }
    } catch (error) {
      console.error('Fetch reservation sources error:', error);
    }
  };

  const fetchContractTemplates = async () => {
    try {
      const res = await fetch('/eventra/api/sozlesme-sablonlari', {
        cache: 'no-store',
      });
      
      if (res.ok) {
        const data = await res.json();
        // Sadece aktif şablonları filtrele
        const activeTemplates = (data.templates || []).filter((t: any) => t.isActive !== false);
        setContractTemplates(activeTemplates.map((t: any) => ({
          id: t.id,
          title: t.title,
        })));
      }
    } catch (error) {
      console.error('Fetch contract templates error:', error);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Paket seçildiğinde otomatik doldur
    if (field === 'program' && value && typeof value === 'string') {
      const selectedPackage = packages.find(p => p.id === value);
      if (selectedPackage && !isCustomOffer) {
        setFormData(prev => ({
          ...prev,
          program: value,
          fiyatKisiBasi: selectedPackage.perPersonPrice?.toString() || '',
          sozlesmeFiyati: selectedPackage.price?.toString() || '',
          davetiSayisi: selectedPackage.minGuests?.toString() || '',
        }));
      }
    }
  };

  const handleDynamicFieldChange = (fieldKey: string, value: any) => {
    setDynamicFormData(prev => ({ ...prev, [fieldKey]: value }));
  };

  const handleOrganizationChange = (orgId: string) => {
    setSelectedOrganizationId(orgId);
    setFormData(prev => ({ ...prev, organizasyonGrupId: orgId }));
    setDynamicFormData({}); // Yeni organizasyon seçildiğinde dinamik formu temizle
  };

  const handleOfficeChange = (officeId: string) => {
    setSelectedOfficeId(officeId);
    setFormData(prev => ({ ...prev, officeId, salonId: '' }));
    setSelectedSalonId('');
  };

  const handleSalonChange = async (salonId: string) => {
    setSelectedSalonId(salonId);
    setFormData(prev => ({ ...prev, salonId }));
    
    // Salon değiştiğinde, eğer zaman dilimi seçilmişse çakışma kontrolü yap
    if (formData.zamanDilimi && formData.rezervasyonTarihi && salonId && (formData.officeId || selectedOfficeId)) {
      try {
        const officeIdToCheck = formData.officeId || selectedOfficeId;
        const excludeId = isEditMode && reservationId ? reservationId : null;
        
        const params = new URLSearchParams({
          rezervasyonTarihi: formData.rezervasyonTarihi,
          officeId: officeIdToCheck,
          salonId: salonId,
          zamanDilimi: formData.zamanDilimi,
        });
        
        if (excludeId) {
          params.append('excludeReservationId', excludeId);
        }
        
        const res = await fetch(`/eventra/api/reservations/check-conflict?${params.toString()}`, {
          credentials: 'include',
          cache: 'no-store',
        });
        
        if (res.ok) {
          const data = await res.json();
          
          if (data.hasConflict) {
            const conflictInfo = data.conflictingReservations
              .map((r: any) => `• ${r.rezervasyonNo} - ${r.musteriAdi} (${r.durum})`)
              .join('\n');
            
            const message = `⚠️ Seçili zaman diliminde bu salonda rezervasyon mevcut!\n\n${conflictInfo}\n\nLütfen farklı bir zaman dilimi seçin.`;
            
            alert(message);
            
            // Zaman dilimini temizle
            setFormData(prev => ({ ...prev, zamanDilimi: '' }));
          }
        }
      } catch (error) {
        console.error('Çakışma kontrolü hatası:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.organizasyonGrupId || !formData.rezervasyonTarihi || !formData.yetkili) {
      setToastMessage('Lütfen zorunlu alanları doldurun (Organizasyon, Tarih, Yetkili)');
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
      return;
    }

    // Müşteri bilgilerini dinamik form alanlarından çıkar
    // Form field'larından müşteri bilgisi olan alanları bul (adSoyad, adi, isim, telefon, email pattern'leri)
    let customerAdSoyad = '';
    let customerTelefon = '';
    let customerEmail = '';
    let customerAdres = '';

    // Form field'larından müşteri bilgisi alanlarını tespit et
    const nameFields = formFields.filter(field => {
      const key = field.fieldKey.toLowerCase();
      return (key.includes('adsoyad') || key.includes('ad_soyad') || key.includes('adi') || key.includes('isim') || key.includes('name')) &&
             field.isRequired;
    });

    const phoneFields = formFields.filter(field => {
      const key = field.fieldKey.toLowerCase();
      return (key.includes('telefon') || key.includes('phone') || key.includes('tel'));
    });

    const emailFields = formFields.filter(field => {
      const key = field.fieldKey.toLowerCase();
      return (key.includes('email') || key.includes('e-posta') || key.includes('eposta'));
    });

    const addressFields = formFields.filter(field => {
      const key = field.fieldKey.toLowerCase();
      return (key.includes('adres') || key.includes('address'));
    });

    // İlk zorunlu ad/soyad alanından müşteri adını al
    if (nameFields.length > 0) {
      for (const nameField of nameFields) {
        const value = dynamicFormData[nameField.fieldKey];
        if (value && value.trim()) {
          customerAdSoyad = value.trim();
          break;
        }
      }
    }

    // Fallback: Eğer form field'lardan bulunamazsa, eski pattern'leri dene (damat/gelin)
    if (!customerAdSoyad) {
      customerAdSoyad = 
        dynamicFormData['damat_adSoyad'] || 
        dynamicFormData['damat_adi'] || 
        dynamicFormData['damatAdSoyad'] ||
        dynamicFormData['gelin_adSoyad'] || 
        dynamicFormData['gelin_adi'] ||
        dynamicFormData['gelinAdSoyad'] ||
        '';
    }

    // Telefon alanını bul
    if (phoneFields.length > 0) {
      for (const phoneField of phoneFields) {
        const value = dynamicFormData[phoneField.fieldKey];
        if (value && value.trim()) {
          customerTelefon = value.trim();
          break;
        }
      }
    }
    
    // Fallback
    if (!customerTelefon) {
      customerTelefon = 
        dynamicFormData['damat_telefon'] || 
        dynamicFormData['gelin_telefon'] || 
        '';
    }

    // Email alanını bul
    if (emailFields.length > 0) {
      for (const emailField of emailFields) {
        const value = dynamicFormData[emailField.fieldKey];
        if (value && value.trim()) {
          customerEmail = value.trim();
          break;
        }
      }
    }
    
    // Fallback
    if (!customerEmail) {
      customerEmail = 
        dynamicFormData['damat_email'] || 
        dynamicFormData['gelin_email'] || 
        '';
    }

    // Adres alanını bul
    if (addressFields.length > 0) {
      for (const addressField of addressFields) {
        const value = dynamicFormData[addressField.fieldKey];
        if (value && value.trim()) {
          customerAdres = value.trim();
          break;
        }
      }
    }
    
    // Fallback
    if (!customerAdres) {
      customerAdres = dynamicFormData['damat_adres'] || dynamicFormData['gelin_adres'] || '';
    }

    // Müşteri adı validasyonu - zorunlu ad/soyad alanı varsa kontrol et
    if (nameFields.length > 0 && nameFields.some(f => f.isRequired) && !customerAdSoyad) {
      const requiredField = nameFields.find(f => f.isRequired);
      setToastMessage(`${requiredField?.label || 'Müşteri adı'} gereklidir`);
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
      return;
    }

    // Fallback validasyon (eski sistem için)
    if (nameFields.length === 0 && !customerAdSoyad) {
      setToastMessage('Müşteri adı gereklidir');
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
      return;
    }

    // Kapora validasyonu
    if (formData.kaporaEkle) {
      if (!formData.kaporaCashBoxId) {
        setToastMessage('Kapora için kasa seçimi zorunludur');
        setToastType('error');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
        return;
      }
      
      const kaporaTutari = parseFloat(formData.kaporaTutari) || 0;
      const sozlesmeFiyati = parseFloat(formData.sozlesmeFiyati) || 0;
      
      if (kaporaTutari <= 0) {
        setToastMessage('Kapora tutarı 0\'dan büyük olmalıdır');
        setToastType('error');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
        return;
      }
      
      if (kaporaTutari > sozlesmeFiyati && sozlesmeFiyati > 0) {
        setToastMessage('Kapora tutarı proje bedelini aşamaz');
        setToastType('error');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const url = isEditMode && reservationId 
        ? `/eventra/api/reservations/${reservationId}`
        : '/eventra/api/reservations';
      
      const response = await fetch(url, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          // Müşteri bilgileri
          customerAdSoyad,
          customerTelefon,
          customerEmail,
          customerAdres,
          
          // Rezervasyon bilgileri
          organizasyonGrupId: formData.organizasyonGrupId,
          officeId: formData.officeId || selectedOfficeId || null,
          salonId: formData.salonId || selectedSalonId || null,
          yetkili: formData.yetkili,
          rezervasyonTarihi: formData.rezervasyonTarihi,
          sozlesmeTarihi: formData.sozlesmeTarihi || null,
          zamanDilimi: (formData.zamanDilimi && formData.zamanDilimi.trim() !== '') ? formData.zamanDilimi : null,
          durum: formData.durum || 'Açık',
          paketId: (formData.program && formData.program.trim() !== '') ? formData.program : null,
          davetiSayisi: formData.davetiSayisi ? (isNaN(parseInt(formData.davetiSayisi)) ? null : parseInt(formData.davetiSayisi)) : null,
          fiyatKisiBasi: formData.fiyatKisiBasi ? (isNaN(parseFloat(formData.fiyatKisiBasi)) ? null : parseFloat(formData.fiyatKisiBasi)) : null,
          sozlesmeFiyati: formData.sozlesmeFiyati ? (isNaN(parseFloat(formData.sozlesmeFiyati)) ? null : parseFloat(formData.sozlesmeFiyati)) : null,
          iskonto: formData.iskonto ? (isNaN(parseFloat(formData.iskonto)) ? null : parseFloat(formData.iskonto)) : null,
          iskontoYuzde: formData.iskontoYuzde || false,
          kdvOrani: formData.kdvOrani ? (isNaN(parseFloat(formData.kdvOrani)) ? '20' : formData.kdvOrani) : '20',
          ozelTeklif: isCustomOffer,
          ozelNotlar: formData.ozelNotlar || null,
          ekstraNotu: formData.ekstraNotu || null,
          kaynakId: formData.kaynakId || null,
          
          // Kontrat bilgileri
          sozlesmeKontrati: formData.sozlesmeKontrati || null,
          kontratSahibiAdSoyad: formData.kontratSahibiAdSoyad || null,
          kontratSahibiTelefon: formData.kontratSahibiTelefon || null,
          kontratSahibiTc: formData.kontratSahibiTc || null,
          kontratAdresi: formData.kontratAdresi || null,
          
          // Fatura bilgileri
          faturaIstiyorum: formData.faturaIstiyorum,
          faturaUnvani: formData.faturaUnvani || null,
          faturaVergiDairesi: formData.faturaVergiDairesi || null,
          faturaVergiNo: formData.faturaVergiNo || null,
          faturaAdresi: formData.faturaAdresi || null,
          
          // Dinamik form verileri (oneren dahil)
          dynamicValues: {
            ...dynamicFormData,
            oneren: formData.oneren || dynamicFormData.oneren || null,
          },
          
          // Katılımcılar - dinamik form alanlarından oluştur
          participants: (() => {
            const participants: any[] = [];
            
            // Form field'larından katılımcı bilgilerini topla
            // Her form section'ı bir katılımcı olabilir (örn: damat, gelin, toplantı_sahibi, vb.)
            const participantSections = new Map<string, any>();
            
            // Dinamik form verilerini analiz et ve katılımcıları bul
            Object.keys(dynamicFormData).forEach(key => {
              if (!dynamicFormData[key] || !dynamicFormData[key].trim()) return;
              
              // Key pattern'ini analiz et (örn: "damat_adSoyad", "toplanti_sahibi_adi", vb.)
              const parts = key.split('_');
              if (parts.length >= 2) {
                const participantKey = parts[0]; // damat, gelin, toplanti_sahibi, vb.
                const fieldType = parts.slice(1).join('_'); // adSoyad, telefon, email, vb.
                
                if (!participantSections.has(participantKey)) {
                  participantSections.set(participantKey, { participantKey, extraJson: {} });
                }
                
                const participant = participantSections.get(participantKey);
                
                if (fieldType.includes('adsoyad') || fieldType.includes('ad_soyad') || fieldType.includes('adi') || fieldType.includes('isim') || fieldType.includes('name')) {
                  participant.adSoyad = dynamicFormData[key];
                } else if (fieldType.includes('telefon') || fieldType.includes('phone') || fieldType.includes('tel')) {
                  participant.telefon = dynamicFormData[key];
                } else if (fieldType.includes('memleket') || fieldType.includes('hometown')) {
                  participant.memleket = dynamicFormData[key];
                } else if (fieldType.includes('email') || fieldType.includes('e-posta') || fieldType.includes('eposta')) {
                  participant.extraJson.email = dynamicFormData[key];
                } else if (fieldType.includes('adres') || fieldType.includes('address')) {
                  participant.extraJson.adres = dynamicFormData[key];
                } else {
                  // Diğer alanları extraJson'a ekle
                  participant.extraJson[fieldType] = dynamicFormData[key];
                }
              }
            });
            
            // AdSoyad'ı olan katılımcıları ekle
            participantSections.forEach((participant) => {
              if (participant.adSoyad && participant.adSoyad.trim()) {
                participants.push(participant);
              }
            });
            
            // Fallback: Eğer dinamik analiz sonuç vermediyse, eski pattern'leri kullan
            if (participants.length === 0) {
              if (dynamicFormData['damat_adSoyad'] || dynamicFormData['damat_adi'] || dynamicFormData['damatAdSoyad']) {
                participants.push({
                  participantKey: 'damat',
                  adSoyad: dynamicFormData['damat_adSoyad'] || dynamicFormData['damat_adi'] || dynamicFormData['damatAdSoyad'] || '',
                  telefon: dynamicFormData['damat_telefon'] || '',
                  memleket: dynamicFormData['damat_memleket'] || '',
                  extraJson: {
                    email: dynamicFormData['damat_email'] || '',
                    adres: dynamicFormData['damat_adres'] || '',
                  },
                });
              }
              
              if (dynamicFormData['gelin_adSoyad'] || dynamicFormData['gelin_adi'] || dynamicFormData['gelinAdSoyad']) {
                participants.push({
                  participantKey: 'gelin',
                  adSoyad: dynamicFormData['gelin_adSoyad'] || dynamicFormData['gelin_adi'] || dynamicFormData['gelinAdSoyad'] || '',
                  telefon: dynamicFormData['gelin_telefon'] || '',
                  memleket: dynamicFormData['gelin_memleket'] || '',
                  extraJson: {
                    email: dynamicFormData['gelin_email'] || '',
                    adres: dynamicFormData['gelin_adres'] || '',
                  },
                });
              }
            }
            
            return participants;
          })(),
          
          // Kapora bilgileri
          kaporaBilgisi: formData.kaporaEkle ? {
            kaporaEkle: true,
            kaporaTutari: parseFloat(formData.kaporaTutari) || 0,
            kaporaCashBoxId: formData.kaporaCashBoxId,
            kaporaPaymentMethod: formData.kaporaPaymentMethod,
            kaporaPaymentDate: formData.kaporaPaymentDate,
            kaporaNotes: formData.kaporaNotes,
          } : null,
        }),
      });

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        const text = await response.text();
        console.error('JSON parse error:', text);
        throw new Error(`Sunucu hatası (${response.status}): ${text.substring(0, 200)}`);
      }

      if (!response.ok) {
        const errorMessage = result.message || result.error || `Rezervasyon oluşturulamadı (${response.status})`;
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: result.error,
          message: result.message,
          fullResult: result,
        });
        throw new Error(errorMessage);
      }

      setToastMessage(isEditMode 
        ? 'Rezervasyon başarıyla güncellendi! ✅' 
        : 'Rezervasyon başarıyla oluşturuldu! ✅');
      setToastType('success');
      setShowToast(true);
      
      // Rezervasyon detay sayfasına yönlendir
      setTimeout(() => {
        const redirectId = isEditMode ? reservationId : result.reservation?.id;
        if (redirectId) {
          window.location.href = `/eventra/rezervasyon/${redirectId}`;
        } else {
          // Ana sayfaya yönlendir
          window.location.href = '/eventra';
        }
      }, 1500);
    } catch (error: any) {
      console.error('Submit error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      const errorMessage = error.message || 'Rezervasyon oluşturulurken bir hata oluştu';
      setToastMessage(errorMessage);
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 8000); // 8 saniye göster
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format numbers with Turkish locale (kuruş kısmı yok)
  const formatPrice = (value: string | number, showSymbol: boolean = true) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue) || numValue === 0) return showSymbol ? '0 ₺' : '0';
    const formatted = Math.round(numValue).toLocaleString('tr-TR');
    return showSymbol ? `${formatted} ₺` : formatted;
  };

  // Otomatik kapora hesaplama
  const otomatikKaporaTutari = (() => {
    if (!formData.kaporaOtomatik || !formData.sozlesmeFiyati) {
      return 0;
    }
    const fiyat = parseFloat(formData.sozlesmeFiyati) || 0;
    const yuzde = kaporaYuzdesi / 100;
    return Math.round(fiyat * yuzde);
  })();

  // Kapora tutarı validasyonu
  useEffect(() => {
    if (formData.kaporaEkle && formData.kaporaTutari) {
      const kaporaTutari = parseFloat(formData.kaporaTutari) || 0;
      const sozlesmeFiyati = parseFloat(formData.sozlesmeFiyati) || 0;
      
      if (kaporaTutari > sozlesmeFiyati && sozlesmeFiyati > 0) {
        setToastMessage('Kapora tutarı proje bedelini aşamaz!');
        setToastType('error');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        
        // Maksimum değeri set et
        setFormData(prev => ({
          ...prev,
          kaporaTutari: String(sozlesmeFiyati),
        }));
      }
    }
  }, [formData.kaporaTutari, formData.sozlesmeFiyati, formData.kaporaEkle]);

  // Kapora otomatik hesaplama - sözleşme fiyatı değiştiğinde otomatik güncelle
  useEffect(() => {
    if (formData.kaporaEkle && formData.kaporaOtomatik && formData.sozlesmeFiyati) {
      const sozlesmeFiyati = parseFloat(formData.sozlesmeFiyati) || 0;
      if (sozlesmeFiyati > 0) {
        const yuzde = kaporaYuzdesi / 100;
        const hesaplananKapora = Math.round(sozlesmeFiyati * yuzde);
        setFormData(prev => ({
          ...prev,
          kaporaTutari: String(hesaplananKapora),
        }));
      }
    }
  }, [formData.sozlesmeFiyati, formData.kaporaOtomatik, formData.kaporaEkle, kaporaYuzdesi]);

  // Otomatik hesaplamalar
  const kisiBasiToplam = formData.fiyatKisiBasi && formData.davetiSayisi 
    ? (parseFloat(formData.fiyatKisiBasi) * parseInt(formData.davetiSayisi))
    : 0;

  // Davetli sayısı ve kişi fiyatı değiştiğinde sözleşme fiyatını otomatik hesapla
  // Kullanıcı manuel değiştirebilir, ama davetli sayısı veya kişi fiyatı değiştiğinde otomatik güncellenir
  useEffect(() => {
    if (formData.davetiSayisi && formData.fiyatKisiBasi) {
      const davetliSayisi = parseInt(formData.davetiSayisi);
      const kisiFiyati = parseFloat(formData.fiyatKisiBasi);
      
      if (!isNaN(davetliSayisi) && !isNaN(kisiFiyati) && davetliSayisi > 0 && kisiFiyati > 0) {
        const hesaplananFiyat = Math.round(davetliSayisi * kisiFiyati);
        
        // Otomatik hesaplanan değeri set et
        setFormData(prev => ({
          ...prev,
          sozlesmeFiyati: String(hesaplananFiyat),
        }));
      }
    }
  }, [formData.davetiSayisi, formData.fiyatKisiBasi]);

  const fiyat = formData.sozlesmeFiyati ? parseFloat(formData.sozlesmeFiyati) : kisiBasiToplam;
  
  // İskonto hesaplama - yüzde kontrolü ve negatif değer kontrolü
  let iskontoTutari = 0;
  if (formData.iskonto) {
    const iskontoDegeri = parseFloat(formData.iskonto);
    if (!isNaN(iskontoDegeri) && iskontoDegeri >= 0) {
      if (formData.iskontoYuzde) {
        // Yüzde iskonto - maksimum %10
        const yuzdeDegeri = Math.min(iskontoDegeri, 10);
        iskontoTutari = Math.round(fiyat * yuzdeDegeri / 100);
      } else {
        // Sabit tutar iskonto - maksimum 1000 TL ve fiyattan fazla olamaz
        const maxDiscount = Math.min(1000, fiyat);
        iskontoTutari = Math.min(Math.round(iskontoDegeri), Math.round(maxDiscount));
      }
    }
  }
  
  // İskonto sonrası fiyat - negatif olamaz
  const fiyatIskontoSonrasi = Math.max(0, Math.round(fiyat - iskontoTutari));
  
  // Ana paket için KDV
  const kdvTutari = Math.round(fiyatIskontoSonrasi * parseFloat(formData.kdvOrani) / 100);
  
  // Ekstra ürünlerin toplam fiyatı
  const ekstraToplam = selectedExtras.reduce((sum, extra) => sum + extra.price, 0);
  
  // Ekstra ürünlere KDV ekle
  const ekstraKdvTutari = Math.round(ekstraToplam * parseFloat(formData.kdvOrani) / 100);
  
  // Genel toplam: Ana paket (iskonto sonrası + KDV) + Ekstra ürünler (toplam + KDV)
  // Negatif olamaz
  const genelToplam = Math.max(0, fiyatIskontoSonrasi + kdvTutari + ekstraToplam + ekstraKdvTutari);

  const durumRenkleri: Record<string, { bg: string; text: string; border: string; icon: any }> = {
    'Açık': { 
      bg: 'bg-amber-50 dark:bg-amber-900/20', 
      text: 'text-amber-700 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-800',
      icon: Clock
    },
    'Kesin': { 
      bg: 'bg-green-50 dark:bg-green-900/20', 
      text: 'text-green-700 dark:text-green-400',
      border: 'border-green-200 dark:border-green-800',
      icon: CheckCircle2
    },
    'İptal': { 
      bg: 'bg-red-50 dark:bg-red-900/20', 
      text: 'text-red-700 dark:text-red-400',
      border: 'border-red-200 dark:border-red-800',
      icon: XCircle
    },
  };

  // Form alanlarını bölümlere göre grupla
  const fieldsBySection = formFields.reduce((acc, field) => {
    const sectionKey = field.FormSectionMaster.globalKey;
    if (!acc[sectionKey]) {
      acc[sectionKey] = {
        title: field.FormSectionMaster.title,
        fields: [],
      };
    }
    acc[sectionKey].fields.push(field);
    return acc;
  }, {} as Record<string, { title: string; fields: FormField[] }>);

  const renderField = (field: FormField) => {
    const value = dynamicFormData[field.fieldKey] || '';
    
    switch (field.type) {
      case 'text':
      case 'phone':
        return (
          <input
            type={field.type === 'phone' ? 'tel' : 'text'}
            value={value}
            onChange={(e) => handleDynamicFieldChange(field.fieldKey, e.target.value)}
            placeholder={field.placeholder || field.label}
            required={field.isRequired}
            className="px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleDynamicFieldChange(field.fieldKey, e.target.value)}
            placeholder={field.placeholder || field.label}
            required={field.isRequired}
            className="px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        );
      
      case 'date':
        return (
          <DatePicker
            value={value}
            onChange={(val) => handleDynamicFieldChange(field.fieldKey, val)}
            placeholder={field.placeholder || 'gg.aa.yyyy'}
            required={field.isRequired}
          />
        );
      
      case 'city':
        return (
          <SearchableSelect
            options={cities.map((city) => ({
              id: city.id,
              name: city.name,
            }))}
            value={value}
            onChange={(val) => handleDynamicFieldChange(field.fieldKey, val)}
            placeholder={field.placeholder || 'Şehir seçiniz'}
            required={field.isRequired}
          />
        );
      
      case 'select':
      case 'radio':
        return (
          <SearchableSelect
            options={[]}
            value={value}
            onChange={(val) => handleDynamicFieldChange(field.fieldKey, val)}
            placeholder={field.placeholder || 'Seçiniz'}
            required={field.isRequired}
          />
        );
      
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleDynamicFieldChange(field.fieldKey, e.target.value)}
            placeholder={field.placeholder || field.label}
            required={field.isRequired}
            rows={3}
            className="px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
          />
        );
      
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleDynamicFieldChange(field.fieldKey, e.target.value)}
            placeholder={field.placeholder || field.label}
            required={field.isRequired}
            className="px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        );
    }
  };

  const steps = [
    { id: 1, name: 'Temel Bilgiler', icon: FileText, completed: selectedOrganizationId !== '' },
    { id: 2, name: 'Katılımcı Bilgileri', icon: Users, completed: formFields.length > 0 && Object.keys(dynamicFormData).length > 0 },
    { id: 3, name: 'Rezervasyon Detayları', icon: Calendar, completed: formData.durum !== '' },
    { id: 4, name: 'Özet', icon: CheckCircle2, completed: false },
  ];

  // Loading state for editing
  if (loadingReservation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Rezervasyon bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Modern Header with Gradient */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                {isEditMode ? 'Rezervasyon Düzenle' : 'Yeni Rezervasyon'}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Rezervasyon oluşturma süresi ortalama 2 dakika
              </p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = activeStep === step.id;
                const isCompleted = step.completed;
                
                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
                        isActive
                          ? 'bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-500 text-white shadow-lg scale-110'
                          : isCompleted
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'bg-white dark:bg-gray-800 border-slate-300 dark:border-slate-700 text-gray-400'
                      }`}>
                        <Icon className="w-5 h-5" />
                        {isCompleted && !isActive && (
                          <CheckCircle2 className="w-4 h-4 absolute -top-1 -right-1 text-green-500 bg-white rounded-full" />
                        )}
                      </div>
                      <span className={`mt-2 text-xs font-medium ${
                        isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {step.name}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-4 ${
                        isCompleted ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 1. Temel Bilgiler - Modern Card */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-visible">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4 rounded-t-2xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">
                      Temel Bilgiler
                    </h3>
                  </div>
                </div>
                <div className="p-6 space-y-5">
                  <div className="space-y-4">
                    {/* Organizasyon Türü, Şube, Salon - 3'lü Grup */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex flex-col gap-2">
                        <label htmlFor="organizasyonGrupId" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-blue-500" />
                          Organizasyon Türü <span className="text-red-500">*</span>
                        </label>
                        <SearchableSelect
                          options={organizations.map((org) => ({
                            id: org.id,
                            name: org.name,
                            description: org.slug,
                          }))}
                          value={selectedOrganizationId}
                          onChange={handleOrganizationChange}
                          placeholder="Organizasyon seçiniz"
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label htmlFor="officeId" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-blue-500" />
                          Şube <span className="text-red-500">*</span>
                        </label>
                        <SearchableSelect
                          options={offices?.map((office) => ({
                            id: office?.id || '',
                            name: office?.name || '',
                            description: office?.code || '',
                          })) || []}
                          value={selectedOfficeId}
                          onChange={handleOfficeChange}
                          placeholder="Şube seçiniz"
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label htmlFor="salonId" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-blue-500" />
                          Salon <span className="text-red-500">*</span>
                        </label>
                        <SearchableSelect
                          options={salons?.map((salon) => ({
                            id: salon?.id || '',
                            name: salon?.name || '',
                            description: salon?.capacity ? `Kapasite: ${salon.capacity} kişi` : '',
                          })) || []}
                          value={selectedSalonId}
                          onChange={handleSalonChange}
                          placeholder="Salon seçiniz"
                          required
                          disabled={!selectedOfficeId}
                        />
                      </div>
                    </div>

                    {/* Rezervasyon Tarihi, Zaman Dilimi, Yetkili - 3'lü Grup */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex flex-col gap-2">
                        <label htmlFor="rezervasyonTarihi" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-500" />
                          Rezervasyon Tarihi <span className="text-red-500">*</span>
                        </label>
                        <DatePicker
                          value={formData.rezervasyonTarihi}
                          onChange={async (value) => {
                            handleChange('rezervasyonTarihi', value);
                            
                            // Tarih değiştiğinde, eğer zaman dilimi seçilmişse çakışma kontrolü yap
                            if (formData.zamanDilimi && value && (formData.salonId || selectedSalonId) && (formData.officeId || selectedOfficeId)) {
                              try {
                                const salonIdToCheck = formData.salonId || selectedSalonId;
                                const officeIdToCheck = formData.officeId || selectedOfficeId;
                                const excludeId = isEditMode && reservationId ? reservationId : null;
                                
                                const params = new URLSearchParams({
                                  rezervasyonTarihi: value,
                                  officeId: officeIdToCheck,
                                  salonId: salonIdToCheck,
                                  zamanDilimi: formData.zamanDilimi,
                                });
                                
                                if (excludeId) {
                                  params.append('excludeReservationId', excludeId);
                                }
                                
                                const res = await fetch(`/eventra/api/reservations/check-conflict?${params.toString()}`, {
                                  credentials: 'include',
                                  cache: 'no-store',
                                });
                                
                                if (res.ok) {
                                  const data = await res.json();
                                  
                                  if (data.hasConflict) {
                                    const conflictInfo = data.conflictingReservations
                                      .map((r: any) => `• ${r.rezervasyonNo} - ${r.musteriAdi} (${r.durum})`)
                                      .join('\n');
                                    
                                    const message = `⚠️ Seçili zaman diliminde bu tarihte rezervasyon mevcut!\n\n${conflictInfo}\n\nLütfen farklı bir zaman dilimi seçin.`;
                                    
                                    alert(message);
                                    
                                    // Zaman dilimini temizle
                                    setFormData(prev => ({ ...prev, zamanDilimi: '' }));
                                  }
                                }
                              } catch (error) {
                                console.error('Çakışma kontrolü hatası:', error);
                              }
                            }
                          }}
                          placeholder="gg.aa.yyyy"
                          required
                          minDate={new Date().toISOString().split('T')[0]}
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label htmlFor="zamanDilimi" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-500" />
                          Zaman Dilimi <span className="text-red-500">*</span>
                        </label>
                        <SearchableSelect
                          options={timeSlots?.map((slot) => ({
                            id: slot?.id || '',
                            name: `${slot?.name || ''} (${slot?.startTime || ''} - ${slot?.endTime || ''})`,
                            description: slot?.capacity ? `Kapasite: ${slot.capacity} kişi` : '',
                            disabled: disabledTimeSlots.has(slot.id), // Çakışan zaman dilimleri disabled
                          })) || []}
                          value={formData.zamanDilimi}
                          onChange={async (value) => {
                            // Çakışma kontrolü yap - organizasyon türü fark etmeksizin, sadece şube + salon + tarih + zaman dilimi
                            if (value && formData.rezervasyonTarihi && (formData.salonId || selectedSalonId) && (formData.officeId || selectedOfficeId)) {
                              try {
                                const salonIdToCheck = formData.salonId || selectedSalonId;
                                const officeIdToCheck = formData.officeId || selectedOfficeId;
                                const excludeId = isEditMode && reservationId ? reservationId : null;
                                
                                const params = new URLSearchParams({
                                  rezervasyonTarihi: formData.rezervasyonTarihi,
                                  officeId: officeIdToCheck,
                                  salonId: salonIdToCheck,
                                  zamanDilimi: value,
                                });
                                
                                if (excludeId) {
                                  params.append('excludeReservationId', excludeId);
                                }
                                
                                const res = await fetch(`/eventra/api/reservations/check-conflict?${params.toString()}`, {
                                  credentials: 'include',
                                  cache: 'no-store',
                                });
                                
                                if (res.ok) {
                                  const data = await res.json();
                                  
                                  if (data.hasConflict) {
                                    // Çakışma var - uyarı göster ve seçimi engelle
                                    const conflictInfo = data.conflictingReservations
                                      .map((r: any) => `• ${r.rezervasyonNo} - ${r.musteriAdi} (${r.durum})`)
                                      .join('\n');
                                    
                                    const message = `⚠️ Bu tarih ve saatte rezervasyon mevcut!\n\n${conflictInfo}\n\nBu zaman dilimini seçemezsiniz.`;
                                    
                                    alert(message);
                                    
                                    // Seçimi geri al (değeri değiştirme)
                                    return;
                                  }
                                }
                              } catch (error) {
                                console.error('Çakışma kontrolü hatası:', error);
                                // Hata durumunda devam et
                              }
                            }
                            
                            // Çakışma yoksa veya kontrol yapılamadıysa değeri güncelle
                            handleChange('zamanDilimi', value);
                          }}
                          placeholder={selectedOfficeId ? "Zaman dilimi seçiniz" : "Önce şube seçiniz"}
                          required
                          disabled={!selectedOfficeId}
                        />
                        {selectedOfficeId && timeSlots.length === 0 && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                            Bu şube için zaman dilimi tanımlanmamış.
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <label htmlFor="yetkili" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <User className="w-4 h-4 text-blue-500" />
                          Yetkili <span className="text-red-500">*</span>
                        </label>
                        <SearchableSelect
                          options={users.map((user) => ({
                            id: user.id,
                            name: user.name,
                            description: user.email,
                          }))}
                          value={formData.yetkili}
                          onChange={(value) => handleChange('yetkili', value)}
                          placeholder="Kullanıcı seçiniz"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Dinamik Form Alanları - Organizasyona Göre */}
              {selectedOrganizationId && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-visible">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">
                        {loadingFields ? 'Form alanları yükleniyor...' : 'Katılımcı Bilgileri'}
                      </h3>
                    </div>
                  </div>
                  {loadingFields ? (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
                      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Form alanları yükleniyor...</p>
                    </div>
                  ) : (
                    <div className="p-6 space-y-6">
                      {(() => {
                        // Section'ları kategorize et
                        const damatSection = Object.entries(fieldsBySection).find(([_, section]) => 
                          section.title.toLowerCase().includes('damat')
                        );
                        const gelinSection = Object.entries(fieldsBySection).find(([_, section]) => 
                          section.title.toLowerCase().includes('gelin')
                        );
                        const ozelSection = Object.entries(fieldsBySection).find(([_, section]) => 
                          section.title.toLowerCase().includes('özel') || 
                          section.title.toLowerCase().includes('notlar') ||
                          section.title.toLowerCase().includes('talep')
                        );
                        const otherSections = Object.entries(fieldsBySection).filter(([_, section]) => 
                          !section.title.toLowerCase().includes('damat') &&
                          !section.title.toLowerCase().includes('gelin') &&
                          !section.title.toLowerCase().includes('özel') &&
                          !section.title.toLowerCase().includes('notlar') &&
                          !section.title.toLowerCase().includes('talep')
                        );

                        return (
                          <>
                            {/* Damat ve Gelin Yan Yana */}
                            {(damatSection || gelinSection) && (
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Damat Bilgileri - Sol */}
                                {damatSection && (
                                  <div className="space-y-4">
                                    <div className="flex items-center gap-3 pb-3 border-b-2 border-blue-200 dark:border-blue-800">
                                      <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl">
                                        <UserCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                      </div>
                                      <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                        {damatSection[1].title}
                                      </h4>
                                    </div>
                                    <div className="space-y-4">
                                      {damatSection[1].fields
                                        .filter((field) => {
                                          // "damat_sehir" alanını gizle, sadece "damat_memleket" göster
                                          return field.fieldKey !== 'damat_sehir' && !field.label.toLowerCase().includes('şehir');
                                        })
                                        .map((field) => {
                                          // Memleket alanını özel olarak render et
                                          if (field.fieldKey === 'damat_memleket' || field.label.toLowerCase().includes('memleket')) {
                                            return (
                                              <div key={field.id} className="flex flex-col gap-2">
                                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                  Memleket
                                                  {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                                                </label>
                                                <SearchableSelect
                                                  options={TURKISH_CITIES.map((city) => ({
                                                    id: city.name,
                                                    name: city.name,
                                                  }))}
                                                  value={dynamicFormData[field.fieldKey] || ''}
                                                  onChange={(val) => handleDynamicFieldChange(field.fieldKey, val)}
                                                  placeholder="Şehir seçiniz"
                                                  required={field.isRequired}
                                                />
                                              </div>
                                            );
                                          }
                                          // Diğer alanlar normal render
                                          return (
                                            <div key={field.id} className="flex flex-col gap-2">
                                              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                {field.label}
                                                {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                                              </label>
                                              {renderField(field)}
                                            </div>
                                          );
                                        })}
                                    </div>
                                  </div>
                                )}

                                {/* Gelin Bilgileri - Sağ */}
                                {gelinSection && (
                                  <div className="space-y-4">
                                    <div className="flex items-center gap-3 pb-3 border-b-2 border-pink-200 dark:border-pink-800">
                                      <div className="p-2 bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900/30 dark:to-pink-800/30 rounded-xl">
                                        <UserCircle className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                                      </div>
                                      <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                        {gelinSection[1].title}
                                      </h4>
                                    </div>
                                    <div className="space-y-4">
                                      {gelinSection[1].fields
                                        .filter((field) => {
                                          // "gelin_sehir" alanını gizle, sadece "gelin_memleket" göster
                                          return field.fieldKey !== 'gelin_sehir' && !field.label.toLowerCase().includes('şehir');
                                        })
                                        .map((field) => {
                                          // Memleket alanını özel olarak render et
                                          if (field.fieldKey === 'gelin_memleket' || field.label.toLowerCase().includes('memleket')) {
                                            return (
                                              <div key={field.id} className="flex flex-col gap-2">
                                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                  Memleket
                                                  {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                                                </label>
                                                <SearchableSelect
                                                  options={TURKISH_CITIES.map((city) => ({
                                                    id: city.name,
                                                    name: city.name,
                                                  }))}
                                                  value={dynamicFormData[field.fieldKey] || ''}
                                                  onChange={(val) => handleDynamicFieldChange(field.fieldKey, val)}
                                                  placeholder="Şehir seçiniz"
                                                  required={field.isRequired}
                                                />
                                              </div>
                                            );
                                          }
                                          // Diğer alanlar normal render
                                          return (
                                            <div key={field.id} className="flex flex-col gap-2">
                                              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                {field.label}
                                                {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                                              </label>
                                              {renderField(field)}
                                            </div>
                                          );
                                        })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Özel Rezervasyon Talep ve Notları - Tam Genişlik */}
                            {ozelSection && (
                              <div className="space-y-4">
                                <div className="flex items-center gap-3 pb-3 border-b-2 border-purple-200 dark:border-purple-800">
                                  <div className="p-2 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl">
                                    <Heart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                  </div>
                                  <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                    {ozelSection[1].title}
                                  </h4>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                  {ozelSection[1].fields.map((field) => (
                                    <div key={field.id} className="flex flex-col gap-2">
                                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        {field.label}
                                        {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                                      </label>
                                      {renderField(field)}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Diğer Bölümler - Standart Grid */}
                            {otherSections.map(([sectionKey, section]) => (
                              <div key={sectionKey} className="space-y-4">
                                <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-700">
                                  <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                    <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                  </div>
                                  <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200">
                                    {section.title}
                                  </h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {section.fields.map((field) => (
                                    <div key={field.id} className="flex flex-col gap-2">
                                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {field.label}
                                        {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                                      </label>
                                      {renderField(field)}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}

                            {formFields.length === 0 && (
                              <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700">
                                <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Bu organizasyon için henüz form alanı tanımlanmamış.
                                </p>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* 3. Rezervasyon Detayları */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-visible">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4 rounded-t-2xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">
                      Rezervasyon Detayları
                    </h3>
                  </div>
                </div>
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="durum" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Info className="w-4 h-4 text-emerald-500" />
                        Durum <span className="text-red-500">*</span>
                      </label>
                      <SearchableSelect
                        options={[
                          { id: 'Açık', name: 'Açık' },
                          { id: 'Kesin', name: 'Kesin' },
                          { id: 'İptal', name: 'İptal' },
                        ]}
                        value={formData.durum}
                        onChange={(value) => handleChange('durum', value)}
                        placeholder="Durum seçiniz"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label htmlFor="program" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-500" />
                        Hazır Paketlerden Seçiniz
                      </label>
                      <SearchableSelect
                        options={packages.map((pkg) => ({
                          id: pkg.id,
                          name: pkg.name,
                          description: pkg.description || '',
                        }))}
                        value={formData.program}
                        onChange={(value) => handleChange('program', value)}
                        placeholder="Paket seçiniz"
                        disabled={!selectedOrganizationId}
                      />
                    </div>
                  </div>

                  {/* Özel Teklif Ver Butonu */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                    <div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {isCustomOffer ? 'Özel Teklif Modu Aktif' : 'Standart Paket Fiyatları'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {isCustomOffer ? 'Fiyatları özelleştirebilirsiniz' : 'Paket fiyatları otomatik uygulanır'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCustomOffer(!isCustomOffer)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        isCustomOffer
                          ? 'bg-orange-600 hover:bg-orange-700 text-white'
                          : 'bg-white dark:bg-gray-800 border-2 border-amber-500 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30'
                      }`}
                    >
                      {isCustomOffer ? 'Standart Moda Dön' : 'Özel Teklif Ver'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="davetiSayisi" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Daveti Sayısı <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        id="davetiSayisi"
                        value={formData.davetiSayisi}
                        onChange={(e) => handleChange('davetiSayisi', e.target.value)}
                        min="0"
                        disabled={!isCustomOffer && formData.program !== ''}
                        className="px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label htmlFor="fiyatKisiBasi" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Fiyat Kişi Başı
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          id="fiyatKisiBasi"
                          value={formData.fiyatKisiBasi}
                          onChange={(e) => handleChange('fiyatKisiBasi', e.target.value)}
                          min="0"
                          step="0.01"
                          disabled={!isCustomOffer && formData.program !== ''}
                          className="px-4 py-2.5 pr-12 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all w-full disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm font-medium">₺</span>
                      </div>
                    </div>
                  </div>

                  {formData.fiyatKisiBasi && formData.davetiSayisi && (
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
                      <p className="text-sm text-emerald-700 dark:text-emerald-400">
                        <span className="font-semibold">Kişi Başı Toplam:</span> {formatPrice(kisiBasiToplam)}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <label htmlFor="sozlesmeFiyati" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Sözleşme Fiyatı
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="sozlesmeFiyati"
                        value={formData.sozlesmeFiyati}
                        onChange={(e) => handleChange('sozlesmeFiyati', e.target.value)}
                        min="0"
                        step="0.01"
                        disabled={!isCustomOffer && formData.program !== ''}
                        className="px-4 py-2.5 pr-12 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all w-full disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm font-medium">₺</span>
                    </div>
                  </div>

                  {/* Ekstralar - Collapsible */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowEkstralar(!showEkstralar)}
                      className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                    >
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Ekstralar</span>
                      <svg
                        className={`w-5 h-5 text-gray-500 transition-transform ${showEkstralar ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showEkstralar && (
                      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                        <div className="space-y-3">
                          {/* Arama Barı */}
                          <div className="relative">
                            <input
                              type="text"
                              value={extraSearchQuery}
                              onChange={(e) => setExtraSearchQuery(e.target.value)}
                              placeholder="Ürün ara..."
                              className="w-full px-4 py-2.5 pl-10 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          </div>

                          {/* Ürün Listesi */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                            {allProducts
                              .filter((product) => {
                                if (!extraSearchQuery.trim()) return true;
                                const query = extraSearchQuery.toLowerCase();
                                const normalizedQuery = query
                                  .replace(/İ/g, 'i')
                                  .replace(/I/g, 'i')
                                  .replace(/ı/g, 'i')
                                  .replace(/Ğ/g, 'g')
                                  .replace(/ğ/g, 'g')
                                  .replace(/Ü/g, 'u')
                                  .replace(/ü/g, 'u')
                                  .replace(/Ş/g, 's')
                                  .replace(/ş/g, 's')
                                  .replace(/Ö/g, 'o')
                                  .replace(/ö/g, 'o')
                                  .replace(/Ç/g, 'c')
                                  .replace(/ç/g, 'c');
                                const normalizedName = product.name.toLowerCase()
                                  .replace(/İ/g, 'i')
                                  .replace(/I/g, 'i')
                                  .replace(/ı/g, 'i')
                                  .replace(/Ğ/g, 'g')
                                  .replace(/ğ/g, 'g')
                                  .replace(/Ü/g, 'u')
                                  .replace(/ü/g, 'u')
                                  .replace(/Ş/g, 's')
                                  .replace(/ş/g, 's')
                                  .replace(/Ö/g, 'o')
                                  .replace(/ö/g, 'o')
                                  .replace(/Ç/g, 'c')
                                  .replace(/ç/g, 'c');
                                return normalizedName.includes(normalizedQuery);
                              })
                              .map((product) => {
                                const isSelected = selectedExtras.some(e => e.id === product.id);
                                return (
                                  <label
                                    key={product.id}
                                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                                      isSelected
                                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedExtras([...selectedExtras, {
                                            id: product.id,
                                            name: product.name,
                                            price: product.price || 0,
                                            unit: product.unit,
                                          }]);
                                        } else {
                                          setSelectedExtras(selectedExtras.filter(e => e.id !== product.id));
                                        }
                                      }}
                                      className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                                    />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {product.name}
                                      </p>
                                      {product.price && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                          {formatPrice(product.price)} {product.unit && `/${product.unit}`}
                                        </p>
                                      )}
                                    </div>
                                  </label>
                                );
                              })}
                          </div>
                          {allProducts.length === 0 && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                              Henüz ürün eklenmemiş
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="iskonto" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        İskonto
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          id="iskonto"
                          value={formData.iskonto}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Yüzde modunda maksimum 10, sabit tutar modunda maksimum 1000 TL
                            if (formData.iskontoYuzde) {
                              const numValue = parseFloat(value);
                              if (!isNaN(numValue) && numValue > 10) {
                                handleChange('iskonto', '10');
                              } else {
                                handleChange('iskonto', value);
                              }
                            } else {
                              const numValue = parseFloat(value);
                              if (!isNaN(numValue) && numValue > 1000) {
                                handleChange('iskonto', '1000');
                              } else {
                                handleChange('iskonto', value);
                              }
                            }
                          }}
                          min="0"
                          max={formData.iskontoYuzde ? "10" : "1000"}
                          step="0.01"
                          disabled={!isCustomOffer && formData.program !== ''}
                          className="px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all w-full disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                      <label className="flex items-center gap-2 mt-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.iskontoYuzde}
                          onChange={(e) => handleChange('iskontoYuzde', e.target.checked)}
                          className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-400">Yüzde olarak hesapla</span>
                      </label>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label htmlFor="kdvOrani" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        KDV Oranı
                      </label>
                      <SearchableSelect
                        options={[
                          { id: '0', name: '%0' },
                          { id: '1', name: '%1' },
                          { id: '10', name: '%10' },
                          { id: '20', name: '%20' },
                        ]}
                        value={formData.kdvOrani}
                        onChange={(value) => handleChange('kdvOrani', value)}
                        placeholder="KDV oranı seçiniz"
                        disabled={!isCustomOffer && formData.program !== ''}
                      />
                    </div>
                  </div>

                  {/* Fiyat Özeti - Modern Card */}
                  <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-900 rounded-xl p-5 border-2 border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                      <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">Fiyat Özeti</h4>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Fiyat:</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{formatPrice(fiyat)}</span>
                    </div>
                    {formData.iskonto && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">İskonto:</span>
                        <span className="font-semibold text-red-600 dark:text-red-400">-{formatPrice(iskontoTutari)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">KDV ({formData.kdvOrani}%):</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{formatPrice(kdvTutari)}</span>
                    </div>
                    {selectedExtras.length > 0 && (
                      <>
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1">
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Ekstralar:</p>
                          {selectedExtras.map((extra) => {
                            const extraKdv = Math.round(extra.price * parseFloat(formData.kdvOrani) / 100);
                            return (
                              <div key={extra.id} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600 dark:text-gray-400">{extra.name}</span>
                                  <span className="font-semibold text-gray-900 dark:text-gray-100">{formatPrice(extra.price)}</span>
                                </div>
                                <div className="flex justify-between text-xs ml-4">
                                  <span className="text-gray-500 dark:text-gray-500">KDV ({formData.kdvOrani}%):</span>
                                  <span className="text-gray-700 dark:text-gray-300">{formatPrice(extraKdv)}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-between text-sm pt-1">
                          <span className="text-gray-600 dark:text-gray-400">Ekstra Toplam:</span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">{formatPrice(ekstraToplam)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Ekstra KDV ({formData.kdvOrani}%):</span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">{formatPrice(ekstraKdvTutari)}</span>
                        </div>
                      </>
                    )}
                    <div className="pt-3 border-t-2 border-slate-300 dark:border-slate-600 flex justify-between items-center">
                      <span className="font-bold text-gray-900 dark:text-gray-100">Genel Toplam:</span>
                      <span className="font-bold text-2xl text-emerald-600 dark:text-emerald-400">{formatPrice(genelToplam)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ödeme Bilgileri - Sadece Açık veya Kesin durumunda görünür */}
              {(formData.durum === 'Açık' || formData.durum === 'Kesin') && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-visible">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <DollarSign className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">
                        Ödeme Bilgileri
                      </h3>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    {/* Kapora Ekle Checkbox */}
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="kaporaEkle"
                        checked={formData.kaporaEkle}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            kaporaEkle: e.target.checked,
                            kaporaTutari: e.target.checked && prev.kaporaOtomatik 
                              ? String(otomatikKaporaTutari) 
                              : prev.kaporaTutari,
                          }));
                        }}
                        className="w-5 h-5 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      />
                      <label htmlFor="kaporaEkle" className="text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                        Kapora Ekle
                      </label>
                    </div>

                    {formData.kaporaEkle && (
                      <div className="ml-8 space-y-4 p-4 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 dark:from-emerald-900/10 dark:to-teal-900/10 rounded-xl border border-emerald-200/50 dark:border-emerald-800/50">
                        {/* Otomatik/Manuel Seçimi */}
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="kaporaOtomatik"
                            checked={formData.kaporaOtomatik}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                kaporaOtomatik: e.target.checked,
                                kaporaTutari: e.target.checked 
                                  ? String(otomatikKaporaTutari) 
                                  : prev.kaporaTutari,
                              }));
                            }}
                            className="w-4 h-4 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500"
                          />
                          <label htmlFor="kaporaOtomatik" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                            Otomatik Hesapla (%{kaporaYuzdesi})
                          </label>
                        </div>

                        {/* Kapora Tutarı */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Kapora Tutarı <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            value={formData.kaporaTutari}
                            onChange={(e) => {
                              const value = e.target.value;
                              setFormData(prev => ({
                                ...prev,
                                kaporaTutari: value,
                                kaporaOtomatik: false, // Manuel girildiğinde otomatik'i kapat
                              }));
                            }}
                            disabled={formData.kaporaOtomatik}
                            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none disabled:bg-gray-100 dark:disabled:bg-gray-700"
                            placeholder="0"
                          />
                          {formData.kaporaOtomatik && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                              Otomatik hesaplanan tutar: {formatPrice(otomatikKaporaTutari)}
                            </p>
                          )}
                          {formData.sozlesmeFiyati && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Maksimum: {formatPrice(formData.sozlesmeFiyati)}
                            </p>
                          )}
                        </div>

                        {/* Kasa Seçimi */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Kasa <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={formData.kaporaCashBoxId}
                            onChange={(e) => handleChange('kaporaCashBoxId', e.target.value)}
                            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                            required={formData.kaporaEkle}
                          >
                            <option value="">Kasa Seçin</option>
                            {cashBoxes.map((box) => (
                              <option key={box.id} value={box.id}>
                                {box.kasaAdi} ({box.tur})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Ödeme Yöntemi */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Ödeme Yöntemi
                          </label>
                          <select
                            value={formData.kaporaPaymentMethod}
                            onChange={(e) => handleChange('kaporaPaymentMethod', e.target.value)}
                            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                          >
                            <option value="Nakit">Nakit</option>
                            <option value="Kredi Kartı">Kredi Kartı</option>
                            <option value="Banka Transferi">Banka Transferi</option>
                            <option value="Çek">Çek</option>
                          </select>
                        </div>

                        {/* Ödeme Tarihi */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Ödeme Tarihi
                          </label>
                          <input
                            type="datetime-local"
                            value={formatDateForInput(formData.kaporaPaymentDate)}
                            onChange={(e) => handleChange('kaporaPaymentDate', e.target.value)}
                            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                          />
                        </div>

                        {/* Notlar */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Notlar
                          </label>
                          <textarea
                            value={formData.kaporaNotes}
                            onChange={(e) => handleChange('kaporaNotes', e.target.value)}
                            rows={2}
                            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
                            placeholder="Kapora ödemesi ile ilgili notlar..."
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 4. Kontrat Bilgileri */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-visible">
                <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-4 rounded-t-2xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">
                      Kontrat Bilgileri
                    </h3>
                  </div>
                </div>
                <div className="p-6">
                  {/* Rezervasyon Bilgileri - İlk Bölüm */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
                    {/* Öneren */}
                    <div className="flex flex-col gap-2">
                      <label htmlFor="oneren" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Öneren
                      </label>
                      <SearchableSelect
                        options={reservationSources.map(source => ({
                          id: source.id,
                          name: source.name,
                          description: source.slug,
                        }))}
                        value={formData.oneren}
                        onChange={(value) => handleChange('oneren', value)}
                        placeholder="Öneren seçiniz"
                      />
                    </div>

                    {/* Sözleşme Türü */}
                    <div className="flex flex-col gap-2">
                      <label htmlFor="sozlesmeKontrati" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <span>Sözleşme Türü</span>
                        <span className="text-red-500">*</span>
                      </label>
                      <SearchableSelect
                        options={contractTemplates.map(template => ({
                          id: template.id,
                          name: template.title,
                        }))}
                        value={formData.sozlesmeKontrati}
                        onChange={(value) => handleChange('sozlesmeKontrati', value)}
                        placeholder="Sözleşme türü seçiniz"
                        required
                      />
                      {contractTemplates.length === 0 && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                          <span>⚠️</span>
                          <span>Henüz sözleşme şablonu tanımlanmamış</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Kontrat Sahibi Bilgileri */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent"></div>
                      <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">
                        Kontrat Sahibi Bilgileri
                      </h4>
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent"></div>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Ad Soyad ve TC Kimlik No - Yan yana */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <label htmlFor="kontratSahibiAdSoyad" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                            <span>Ad Soyad</span>
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="kontratSahibiAdSoyad"
                            value={formData.kontratSahibiAdSoyad}
                            onChange={(e) => handleChange('kontratSahibiAdSoyad', e.target.value)}
                            onFocus={() => {
                              const damatAdSoyad = dynamicFormData['damat_adSoyad'] || dynamicFormData['damat_Ad_Soyad'] || dynamicFormData['damatAdSoyad'];
                              if (damatAdSoyad && !formData.kontratSahibiAdSoyad) {
                                if (confirm('Damat bilgilerinden otomatik doldurulsun mu?')) {
                                  handleChange('kontratSahibiAdSoyad', damatAdSoyad);
                                  const damatTelefon = dynamicFormData['damat_telefon'] || dynamicFormData['damat_Telefon'] || dynamicFormData['damatTelefon'];
                                  if (damatTelefon) {
                                    handleChange('kontratSahibiTelefon', damatTelefon);
                                  }
                                }
                              }
                            }}
                            placeholder="Ad Soyad"
                            className="px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                            required
                          />
                          {dynamicFormData['damat_adSoyad'] || dynamicFormData['damat_Ad_Soyad'] || dynamicFormData['damatAdSoyad'] ? (
                            <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                              <span>💡</span>
                              <span>Damat bilgilerinden otomatik doldurmak için alana tıklayın</span>
                            </p>
                          ) : null}
                        </div>

                        <div className="flex flex-col gap-2">
                          <label htmlFor="kontratSahibiTc" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                            <span>TC Kimlik No</span>
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="kontratSahibiTc"
                            value={formData.kontratSahibiTc}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              if (value.length <= 11) {
                                handleChange('kontratSahibiTc', value);
                              }
                            }}
                            placeholder="TC Kimlik No"
                            maxLength={11}
                            className="px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                            required
                          />
                        </div>
                      </div>

                      {/* Telefon - Tek başına */}
                      <div className="flex flex-col gap-2">
                        <label htmlFor="kontratSahibiTelefon" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Telefon
                        </label>
                        <input
                          type="tel"
                          id="kontratSahibiTelefon"
                          value={formData.kontratSahibiTelefon}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^\d+]/g, '');
                            handleChange('kontratSahibiTelefon', value);
                          }}
                          placeholder="Telefon"
                          className="px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                        />
                      </div>

                      {/* Adres - Tek başına */}
                      <div className="flex flex-col gap-2">
                        <label htmlFor="kontratAdresi" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Adres
                        </label>
                        <textarea
                          id="kontratAdresi"
                          value={formData.kontratAdresi}
                          onChange={(e) => handleChange('kontratAdresi', e.target.value)}
                          rows={3}
                          placeholder="Adres bilgisi"
                          className="px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Fatura Bilgileri */}
                  <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3 mb-4">
                      <input
                        type="checkbox"
                        id="faturaIstiyorum"
                        checked={formData.faturaIstiyorum}
                        onChange={(e) => {
                          handleChange('faturaIstiyorum', e.target.checked);
                        }}
                        className="w-5 h-5 text-amber-600 rounded focus:ring-2 focus:ring-amber-500 cursor-pointer"
                      />
                      <label htmlFor="faturaIstiyorum" className="text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                        Fatura Kesilecek
                      </label>
                    </div>

                    {showInvoiceFields && (
                      <div className="ml-8 space-y-4 p-5 bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-900/10 dark:to-orange-900/10 rounded-xl border border-amber-200/50 dark:border-amber-800/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-2">
                            <label htmlFor="faturaUnvani" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                              Fatura Ünvanı
                            </label>
                            <input
                              type="text"
                              id="faturaUnvani"
                              value={formData.faturaUnvani}
                              onChange={(e) => handleChange('faturaUnvani', e.target.value)}
                              placeholder="Fatura ünvanı"
                              className="px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                            />
                          </div>

                          <div className="flex flex-col gap-2">
                            <label htmlFor="faturaVergiDairesi" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                              Vergi Dairesi
                            </label>
                            <input
                              type="text"
                              id="faturaVergiDairesi"
                              value={formData.faturaVergiDairesi}
                              onChange={(e) => handleChange('faturaVergiDairesi', e.target.value)}
                              placeholder="Vergi dairesi"
                              className="px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-2">
                            <label htmlFor="faturaVergiNo" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                              Vergi No
                            </label>
                            <input
                              type="text"
                              id="faturaVergiNo"
                              value={formData.faturaVergiNo}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                handleChange('faturaVergiNo', value);
                              }}
                              placeholder="Vergi numarası"
                              className="px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                            />
                          </div>

                          <div className="flex flex-col gap-2">
                            <label htmlFor="faturaAdresi" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                              Fatura Adresi
                            </label>
                            <textarea
                              id="faturaAdresi"
                              value={formData.faturaAdresi}
                              onChange={(e) => handleChange('faturaAdresi', e.target.value)}
                              rows={3}
                              placeholder="Fatura adresi"
                              className="px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all resize-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="px-6 py-3 border-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    isEditMode ? 'Rezervasyonu Güncelle' : 'Rezervasyonu Kaydet'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column - Summary Card */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 sticky top-6">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Rezervasyon Özeti
                </h3>
              </div>
              <div className="space-y-5">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Organizasyon</p>
                  <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    {organizations.find(o => o.id === selectedOrganizationId)?.name || (
                      <span className="text-gray-400">Seçilmedi</span>
                    )}
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Rezervasyon Tarihi</p>
                  <div className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-gray-100">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span>{formData.rezervasyonTarihi || 'Seçilmedi'}</span>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Durum</p>
                  {formData.durum && durumRenkleri[formData.durum] && (() => {
                    const statusStyle = durumRenkleri[formData.durum];
                    const StatusIcon = statusStyle.icon;
                    return (
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                        <StatusIcon className="w-4 h-4" />
                        <span className="text-sm font-semibold">{formData.durum}</span>
                      </div>
                    );
                  })()}
                </div>

                <div className="pt-4 border-t-2 border-slate-200 dark:border-slate-800">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Fiyat Toplamı</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    {formatPrice(genelToplam)}
                  </p>
                  {selectedExtras.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-1">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Ekstralar:</p>
                      {selectedExtras.map((extra) => {
                        const extraKdv = Math.round(extra.price * parseFloat(formData.kdvOrani) / 100);
                        return (
                          <div key={extra.id} className="space-y-0.5">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600 dark:text-gray-400">{extra.name}</span>
                              <span className="font-semibold text-gray-900 dark:text-gray-100">{formatPrice(extra.price)}</span>
                            </div>
                            <div className="flex justify-between text-xs ml-3">
                              <span className="text-gray-500 dark:text-gray-500">KDV:</span>
                              <span className="text-gray-700 dark:text-gray-300">{formatPrice(extraKdv)}</span>
                            </div>
                          </div>
                        );
                      })}
                      <div className="flex justify-between text-xs pt-1 mt-1 border-t border-slate-200 dark:border-slate-700">
                        <span className="text-gray-600 dark:text-gray-400 font-semibold">Ekstra KDV Toplam:</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{formatPrice(ekstraKdvTutari)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="w-full mt-6 px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled
                >
                  <PrinterIcon className="w-4 h-4" />
                  PDF Önizleme
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed bottom-6 right-6 ${
          toastType === 'success' 
            ? 'bg-green-600 text-white' 
            : 'bg-red-600 text-white'
        } px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in flex items-center gap-2 max-w-md`}>
          {toastType === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Toast Animation */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default function YeniRezervasyon() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Yükleniyor...</p>
        </div>
      </div>
    }>
      <YeniRezervasyonContent />
    </Suspense>
  );
}
