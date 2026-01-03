'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { PartyIcon, HeartIcon, CalendarIcon } from '@/app/components/Icons';
import { useSettings } from '@/app/context/SettingsContext';
import jsPDF from 'jspdf';

interface Reservation {
  id: string;
  rezervasyonNo: string;
  durum: string;
  rezervasyonTarihi: string | Date | null;
  sozlesmeTarihi: string | Date | null;
  zamanDilimi: string | null;
  davetiSayisi: number | null;
  ozelNotlar: string | null;
  ekstraNotu: string | null;
  yetkili: string | null;
  kaynakId: string | null;
  paketId: string | null;
  sozlesmeKontrati: string | null;
  kontratSahibiAdSoyad: string | null;
  kontratSahibiTelefon: string | null;
  kontratSahibiTc: string | null;
  kontratAdresi: string | null;
  faturaIstiyorum: boolean | null;
  faturaUnvani: string | null;
  faturaVergiDairesi: string | null;
  faturaVergiNo: string | null;
  faturaAdresi: string | null;
  createdAt: string | Date | null;
  updatedAt: string | Date | null;
  Customer: {
    id: string;
    adSoyad: string;
    telefon: string | null;
    email: string | null;
  };
  ReservationDynamicValues: Array<{
    fieldKey: string;
    fieldValue: string;
  }>;
  ReservationParticipants: Array<{
    participantKey: string;
    adSoyad: string | null;
    telefon: string | null;
    memleket: string | null;
    extraJson: string | null;
  }>;
  organizasyonGrupId: string | null;
  salonId: string | null;
  officeId: string | null;
  Office?: { id: string; name: string } | null;
  Salon?: { id: string; name: string } | null;
  OrganizasyonGrup?: { id: string; name: string } | null;
  Paket?: { id: string; name: string } | null;
  Kaynak?: { id: string; name: string } | null;
  YetkiliUser?: { id: string; name: string; email: string; role: string; Roller?: { name: string } | null } | null;
  SozlesmeSablon?: { id: string; title: string } | null;
}

interface OrganizationGroup {
  id: string;
  name: string;
}

interface Salon {
  id: string;
  name: string;
}

export default function RezervasyonDetay() {
  const params = useParams();
  const router = useRouter();
  const { generalSettings } = useSettings();
  const id = params.id as string;
  
  // Şirket bilgileri
  const companyName = generalSettings?.companyName || '';
  const taxNumber = generalSettings?.taxNumber || '';
  const taxOffice = generalSettings?.taxOffice || '';
  const companyAddress = generalSettings?.companyAddress || '';
  const companyPhone = generalSettings?.companyPhone || '';
  const companyEmail = generalSettings?.companyEmail || '';
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organizationGroup, setOrganizationGroup] = useState<OrganizationGroup | null>(null);
  const [salon, setSalon] = useState<Salon | null>(null);
  const [timeSlot, setTimeSlot] = useState<{ name: string; startTime: string; endTime: string } | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [office, setOffice] = useState<{ id: string; name: string } | null>(null);
  const [paket, setPaket] = useState<{ id: string; name: string } | null>(null);
  const [kaynak, setKaynak] = useState<{ id: string; name: string } | null>(null);
  const [generatingContract, setGeneratingContract] = useState(false);

  const fetchReservation = useCallback(async () => {
    if (!id) {
      setError('Rezervasyon ID bulunamadı');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/eventra/api/reservations/${id}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Rezervasyon yüklenemedi');
      }

      const data = await res.json();
      
      if (!data.reservation) {
        throw new Error('Rezervasyon bulunamadı');
      }

      setReservation(data.reservation);

      // API'den gelen ilişkili bilgileri set et
      if (data.reservation.Office) {
        setOffice(data.reservation.Office);
      }
      if (data.reservation.Salon) {
        setSalon(data.reservation.Salon);
      }
      if (data.reservation.OrganizasyonGrup) {
        setOrganizationGroup(data.reservation.OrganizasyonGrup);
      }
      if (data.reservation.Paket) {
        setPaket(data.reservation.Paket);
      }
      if (data.reservation.Kaynak) {
        setKaynak(data.reservation.Kaynak);
      }
      // Yetkili ve Sözleşme bilgileri API'den geliyor, state'e gerek yok

      // Eğer API'den gelmediyse manuel çek (fallback)
      if (!data.reservation.OrganizasyonGrup && data.reservation.organizasyonGrupId) {
        const orgRes = await fetch(`/eventra/api/organizasyon-gruplari`, {
          credentials: 'include',
        });
        if (orgRes.ok) {
          const orgData = await orgRes.json();
          const org = orgData.groups?.find((g: OrganizationGroup) => g.id === data.reservation.organizasyonGrupId);
          if (org) setOrganizationGroup(org);
        }
      }

      if (!data.reservation.Salon && data.reservation.salonId) {
        const salonRes = await fetch(`/eventra/api/salons`, {
          credentials: 'include',
        });
        if (salonRes.ok) {
          const salonData = await salonRes.json();
          const foundSalon = Array.isArray(salonData) 
            ? salonData.find((s: Salon) => s.id === data.reservation.salonId)
            : null;
          if (foundSalon) setSalon(foundSalon);
        }
      }

      // Kaynak bilgisini getir (fallback - API'den gelmediyse manuel çek)
      if (data.reservation.kaynakId) {
        // Eğer API'den Kaynak gelmediyse, manuel çek
        if (!data.reservation.Kaynak) {
          try {
            const kaynakRes = await fetch(`/eventra/api/rezervasyon-kaynaklari`, {
              credentials: 'include',
            });
            if (kaynakRes.ok) {
              const kaynakData = await kaynakRes.json();
              // API response formatı: { sources: [...] } veya direkt array
              const sources = Array.isArray(kaynakData) ? kaynakData : (kaynakData.sources || []);
              const foundKaynak = sources.find((k: any) => k.id === data.reservation.kaynakId);
              if (foundKaynak) {
                const kaynakInfo = { id: foundKaynak.id, name: foundKaynak.name };
                setKaynak(kaynakInfo);
                // reservation objesine de ekle ki direkt kullanılabilsin
                data.reservation.Kaynak = kaynakInfo;
              }
            }
          } catch (error) {
            console.error('Kaynak bilgisi yüklenirken hata:', error);
          }
        } else {
          // API'den geldiyse state'e de set et
          setKaynak(data.reservation.Kaynak);
        }
      }

      // Zaman dilimi bilgisini getir
      if (data.reservation.zamanDilimi) {
        const timeSlotRes = await fetch(`/eventra/api/time-slots`, {
          credentials: 'include',
        });
        if (timeSlotRes.ok) {
          const timeSlotData = await timeSlotRes.json();
          const foundTimeSlot = Array.isArray(timeSlotData)
            ? timeSlotData.find((ts: any) => ts.id === data.reservation.zamanDilimi)
            : null;
          if (foundTimeSlot) {
            setTimeSlot({
              name: foundTimeSlot.name || '',
              startTime: foundTimeSlot.startTime || '',
              endTime: foundTimeSlot.endTime || '',
            });
          }
        }
      }
    } catch (err: any) {
      console.error('Rezervasyon yükleme hatası:', err);
      setError(err.message || 'Rezervasyon yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchReservation();
  }, [fetchReservation]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Kesin':
        return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400';
      case 'Açık':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400';
      case 'İptal':
        return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'Düğün':
        return PartyIcon;
      case 'Kına':
        return HeartIcon;
      case 'Nişan':
        return HeartIcon;
      case 'Sünnet':
        return PartyIcon;
      default:
        return CalendarIcon;
    }
  };

  // Dinamik form verilerinden bilgileri çıkar
  const getDynamicValue = (fieldKey: string): string => {
    if (!reservation?.ReservationDynamicValues) return '';
    const value = reservation.ReservationDynamicValues.find(v => v.fieldKey === fieldKey);
    return value?.fieldValue || '';
  };

  // Yetkili bilgisini al (organizasyon türüne göre)
  const getYetkiliBilgisi = (): { adSoyad: string; telefon: string } | null => {
    if (!reservation) return null;
    
    // Önce API'den gelen YetkiliUser bilgisini kontrol et
    if (reservation.YetkiliUser) {
      const yetkiliTelefon = getDynamicValue('yetkili_telefon_etkinlik') || 
                             getDynamicValue('yetkili_telefon_mezuniyet') || 
                             getDynamicValue('yetkili_telefon_kurumsal') || '';
      return { adSoyad: reservation.YetkiliUser.name, telefon: yetkiliTelefon };
    }
    
    // Sonra rezervasyon tablosundaki yetkili alanını kontrol et
    if (reservation.yetkili) {
      // Eğer ID formatındaysa, dinamik form değerlerinden al
      if (reservation.yetkili.startsWith('user_') || reservation.yetkili.includes('_')) {
        const yetkiliAdi = getDynamicValue('yetkili_adi_etkinlik') || 
                           getDynamicValue('yetkili_adi_mezuniyet') || 
                           getDynamicValue('yetkili_adi_kurumsal') || '';
        const yetkiliTelefon = getDynamicValue('yetkili_telefon_etkinlik') || 
                               getDynamicValue('yetkili_telefon_mezuniyet') || 
                               getDynamicValue('yetkili_telefon_kurumsal') || '';
        if (yetkiliAdi) {
          return { adSoyad: yetkiliAdi, telefon: yetkiliTelefon };
        }
      } else {
        // Direkt isim olarak saklanmışsa
        const yetkiliTelefon = getDynamicValue('yetkili_telefon_etkinlik') || 
                               getDynamicValue('yetkili_telefon_mezuniyet') || 
                               getDynamicValue('yetkili_telefon_kurumsal') || '';
        return { adSoyad: reservation.yetkili, telefon: yetkiliTelefon };
      }
    }
    
    // Son olarak dinamik form değerlerinden al
    const yetkiliAdi = getDynamicValue('yetkili_adi_etkinlik') || 
                       getDynamicValue('yetkili_adi_mezuniyet') || 
                       getDynamicValue('yetkili_adi_kurumsal') || '';
    const yetkiliTelefon = getDynamicValue('yetkili_telefon_etkinlik') || 
                           getDynamicValue('yetkili_telefon_mezuniyet') || 
                           getDynamicValue('yetkili_telefon_kurumsal') || '';
    
    if (yetkiliAdi) {
      return { adSoyad: yetkiliAdi, telefon: yetkiliTelefon };
    }
    
    return null;
  };


  // Okul adını al
  const getOkulAdi = (): string => {
    return getDynamicValue('okul_adi') || '';
  };

  // Müşteri adını dinamik form verilerinden veya Customer'dan al
  const getCustomerName = (): string => {
    if (!reservation) return '';
    
    // Önce dinamik form verilerinden damat veya gelin adını al
    const damatAdi = getDynamicValue('damat_adi') || getDynamicValue('damat_adSoyad') || getDynamicValue('damatAdSoyad');
    const gelinAdi = getDynamicValue('gelin_adi') || getDynamicValue('gelin_adSoyad') || getDynamicValue('gelinAdSoyad');
    
    if (damatAdi && gelinAdi) {
      return `${damatAdi} & ${gelinAdi}`;
    } else if (damatAdi) {
      return damatAdi;
    } else if (gelinAdi) {
      return gelinAdi;
    }
    
    // Katılımcılardan al
    const damatParticipant = reservation.ReservationParticipants?.find(p => p.participantKey === 'damat');
    const gelinParticipant = reservation.ReservationParticipants?.find(p => p.participantKey === 'gelin');
    
    if (damatParticipant?.adSoyad && gelinParticipant?.adSoyad) {
      return `${damatParticipant.adSoyad} & ${gelinParticipant.adSoyad}`;
    } else if (damatParticipant?.adSoyad) {
      return damatParticipant.adSoyad;
    } else if (gelinParticipant?.adSoyad) {
      return gelinParticipant.adSoyad;
    }
    
    // Son çare olarak Customer'dan al
    return reservation.Customer?.adSoyad || '';
  };

  // Telefon numarasını dinamik form verilerinden veya Customer'dan al
  const getPhoneNumber = (): string => {
    if (!reservation) return '';
    
    const damatTelefon = getDynamicValue('damat_telefon');
    const gelinTelefon = getDynamicValue('gelin_telefon');
    
    if (damatTelefon) return damatTelefon;
    if (gelinTelefon) return gelinTelefon;
    
    const damatParticipant = reservation.ReservationParticipants?.find(p => p.participantKey === 'damat');
    if (damatParticipant?.telefon) return damatParticipant.telefon;
    
    const gelinParticipant = reservation.ReservationParticipants?.find(p => p.participantKey === 'gelin');
    if (gelinParticipant?.telefon) return gelinParticipant.telefon;
    
    return reservation.Customer?.telefon || '';
  };

  // Tarih formatla
  const formatDate = (date: string | Date | null): string => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('tr-TR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Saat formatla
  const formatTime = (): string => {
    if (timeSlot) {
      if (timeSlot.startTime && timeSlot.endTime) {
        return `${timeSlot.startTime} - ${timeSlot.endTime}`;
      } else if (timeSlot.startTime) {
        return timeSlot.startTime;
      } else if (timeSlot.name) {
        return timeSlot.name;
      }
    }
    if (reservation?.zamanDilimi) {
      // Eğer zaman dilimi ID'si ise, sadece ID'yi gösterme
      if (reservation.zamanDilimi.startsWith('timeslot') || reservation.zamanDilimi.includes('_')) {
        return '-';
      }
      return reservation.zamanDilimi;
    }
    return '-';
  };

  if (loading) {
    return (
      <div className="max-w-5xl">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || (!loading && !reservation)) {
    return (
      <div className="max-w-5xl">
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Rezervasyon bulunamadı'}</p>
          <button
            onClick={() => window.location.href = '/eventra'}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  const customerName = getCustomerName();
  const phoneNumber = getPhoneNumber();
  const eventType = organizationGroup?.name || 'Bilinmiyor';
  const salonName = salon?.name || '-';
  const reservationDate = formatDate(reservation.rezervasyonTarihi);
  const reservationTime = formatTime();
  const guestCount = reservation.davetiSayisi || 0;
  const notes = reservation.ozelNotlar || reservation.ekstraNotu || '';

  // Buton işlevleri
  const handleEdit = () => {
    router.push(`/rezervasyon/yeni?id=${reservation.id}`);
  };

  const handlePrint = () => {
    // Print için portrait stilini ekle
    const style = document.createElement('style');
    style.id = 'print-portrait-style';
    style.textContent = `
      @media print {
        @page {
          size: A4 portrait;
          margin: 1cm;
        }
        body {
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }
        [data-reservation-detail] .no-print {
          display: none !important;
        }
        [data-reservation-detail] .grid {
          display: block !important;
        }
        [data-reservation-detail] .lg\\:col-span-2 {
          width: 100% !important;
        }
        [data-reservation-detail] .max-w-5xl {
          max-width: 100% !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    window.print();
    
    // Print sonrası style'ı kaldır
    setTimeout(() => {
      const printStyle = document.getElementById('print-portrait-style');
      if (printStyle) {
        printStyle.remove();
      }
    }, 1000);
  };

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async () => {
    if (!reservation) return;
    
    setShowCancelModal(false);

    try {
      const res = await fetch(`/eventra/api/reservations/${reservation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          durum: 'İptal',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Rezervasyonu yeniden yükle
        await fetchReservation();
        alert('Rezervasyon başarıyla iptal edildi');
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('İptal hatası:', errorData);
        alert(errorData.error || errorData.message || 'Rezervasyon iptal edilirken bir hata oluştu');
      }
    } catch (error: any) {
      console.error('Cancel error:', error);
      alert('Rezervasyon iptal edilirken bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
    }
  };

  const handleSendEmail = () => {
    if (reservation.Customer?.email) {
      window.location.href = `mailto:${reservation.Customer.email}?subject=Rezervasyon Bilgileri - ${reservation.rezervasyonNo}`;
    } else {
      alert('Müşteri e-posta adresi bulunamadı');
    }
  };

  const handleSendSMS = () => {
    if (phoneNumber) {
      const message = encodeURIComponent(`Rezervasyonunuz hakkında bilgilendirme: ${reservation.rezervasyonNo}`);
      window.open(`sms:${phoneNumber}?body=${message}`, '_blank');
    } else {
      alert('Telefon numarası bulunamadı');
    }
  };

  const handleCall = () => {
    if (phoneNumber) {
      window.location.href = `tel:${phoneNumber}`;
    } else {
      alert('Telefon numarası bulunamadı');
    }
  };

  const handleCreateContract = async () => {
    if (!reservation) {
      alert('Rezervasyon bilgileri yüklenemedi');
      return;
    }

    try {
      setGeneratingContract(true);

      // Aktif sözleşme şablonunu çek
      const templateRes = await fetch('/eventra/api/sozlesme-sablonlari', {
        credentials: 'include',
      });

      if (!templateRes.ok) {
        throw new Error('Sözleşme şablonu yüklenemedi');
      }

      const templateData = await templateRes.json();
      const activeTemplate = templateData.templates?.find((t: any) => t.isActive);

      if (!activeTemplate) {
        alert('Aktif sözleşme şablonu bulunamadı. Lütfen önce bir sözleşme şablonu oluşturun.');
        return;
      }

      // Profil ayarlarından bilgileri al
      const companyName = generalSettings?.companyName || 'İşletme Adı';
      const taxNumber = generalSettings?.taxNumber || '';
      const taxOffice = generalSettings?.taxOffice || '';
      const companyAddress = generalSettings?.companyAddress || '';
      const companyPhone = generalSettings?.companyPhone || '';
      const companyEmail = generalSettings?.companyEmail || '';
      const companyLogo = generalSettings?.companyLogo || null;

      // Rezervasyon bilgilerini hazırla
      const customerName = getCustomerName();
      const phoneNumber = getPhoneNumber();
      const email = reservation.Customer?.email || '';
      const rezervasyonNo = reservation.rezervasyonNo;
      const rezervasyonTarihi = formatDate(reservation.rezervasyonTarihi);
      const sozlesmeTarihi = formatDate(reservation.sozlesmeTarihi) || rezervasyonTarihi;
      const salonName = salon?.name || '';
      const eventType = organizationGroup?.name || '';
      const guestCount = reservation.davetiSayisi || 0;
      const sozlesmeFiyati = reservation.sozlesmeFiyati || 0;
      const kontratSahibi = reservation.kontratSahibiAdSoyad || customerName;
      const kontratTelefon = reservation.kontratSahibiTelefon || phoneNumber;
      const kontratTc = reservation.kontratSahibiTc || '';
      const kontratAdresi = reservation.kontratAdresi || '';

      // Şablon içeriğini al
      let contractContent = activeTemplate.content;

      // Placeholder'ları değiştir
      const replacements: Record<string, string> = {
        '{{companyName}}': companyName,
        '{{taxNumber}}': taxNumber,
        '{{taxOffice}}': taxOffice,
        '{{companyAddress}}': companyAddress,
        '{{companyPhone}}': companyPhone,
        '{{companyEmail}}': companyEmail,
        '{{customerName}}': customerName,
        '{{phoneNumber}}': phoneNumber,
        '{{email}}': email,
        '{{rezervasyonNo}}': rezervasyonNo,
        '{{rezervasyonTarihi}}': rezervasyonTarihi,
        '{{sozlesmeTarihi}}': sozlesmeTarihi,
        '{{salonName}}': salonName,
        '{{eventType}}': eventType,
        '{{guestCount}}': guestCount.toString(),
        '{{sozlesmeFiyati}}': sozlesmeFiyati.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }),
        '{{kontratSahibi}}': kontratSahibi,
        '{{kontratTelefon}}': kontratTelefon,
        '{{kontratTc}}': kontratTc,
        '{{kontratAdresi}}': kontratAdresi,
        '{{tarih}}': new Date().toLocaleDateString('tr-TR'),
        '{{bugun}}': new Date().toLocaleDateString('tr-TR'),
      };

      // Tüm placeholder'ları değiştir
      Object.keys(replacements).forEach(key => {
        const regex = new RegExp(key.replace(/[{}]/g, '\\$&'), 'g');
        contractContent = contractContent.replace(regex, replacements[key]);
      });

      // PDF oluştur
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);

      // Helper fonksiyon: Metni satırlara böl ve yazdır
      const addText = (text: string, x: number, y: number, options: { 
        fontSize?: number; 
        fontStyle?: 'normal' | 'bold' | 'italic';
        align?: 'left' | 'center' | 'right';
        lineHeight?: number;
      } = {}) => {
        const fontSize = options.fontSize || 10;
        const fontStyle = options.fontStyle || 'normal';
        const align = options.align || 'left';
        const lineHeight = options.lineHeight || fontSize * 1.2;

        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', fontStyle);
        
        const lines = pdf.splitTextToSize(text, maxWidth);
        let currentY = y;
        
        lines.forEach((line: string) => {
          pdf.text(line, x, currentY, { align });
          currentY += lineHeight;
        });
        
        return currentY;
      };

      // Logo varsa ekle
      let yPos = margin;
      if (companyLogo) {
        try {
          const img = new Image();
          img.src = companyLogo;
          await new Promise((resolve, reject) => {
            img.onload = () => {
              const logoWidth = 50;
              const logoHeight = Math.min((img.height * logoWidth) / img.width, 20);
              pdf.addImage(companyLogo, 'PNG', margin, margin, logoWidth, logoHeight);
              yPos = margin + logoHeight + 8;
              resolve(null);
            };
            img.onerror = () => {
              yPos = margin;
              resolve(null);
            };
          });
        } catch (error) {
          console.error('Logo yüklenemedi:', error);
          yPos = margin;
        }
      }

      // Şirket bilgileri
      yPos = addText(companyName, margin, yPos, { fontSize: 16, fontStyle: 'bold', lineHeight: 8 });
      yPos += 3;

      if (taxOffice) {
        yPos = addText(`Vergi Dairesi: ${taxOffice}`, margin, yPos, { fontSize: 10, lineHeight: 6 });
      }
      if (taxNumber) {
        yPos = addText(`Vergi No: ${taxNumber}`, margin, yPos, { fontSize: 10, lineHeight: 6 });
      }
      if (companyAddress) {
        yPos = addText(companyAddress, margin, yPos, { fontSize: 10, lineHeight: 6 });
      }
      if (companyPhone) {
        yPos = addText(`Tel: ${companyPhone}`, margin, yPos, { fontSize: 10, lineHeight: 6 });
      }
      if (companyEmail) {
        yPos = addText(`E-posta: ${companyEmail}`, margin, yPos, { fontSize: 10, lineHeight: 6 });
      }

      // Başlık
      yPos += 8;
      const titleY = addText('SÖZLEŞME', pageWidth / 2, yPos, { 
        fontSize: 16, 
        fontStyle: 'bold', 
        align: 'center',
        lineHeight: 10 
      });
      yPos = titleY + 8;

      // Sözleşme içeriği - paragrafları ayır
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      // İçeriği paragraflara böl
      const paragraphs = contractContent.split(/\n\s*\n/).filter(p => p.trim());
      
      paragraphs.forEach((paragraph, index) => {
        const trimmedParagraph = paragraph.trim();
        if (!trimmedParagraph) return;
        
        // Paragraf başında boşluk bırak (ilk paragraf hariç)
        if (index > 0) {
          yPos += 4;
        }
        
        // Paragrafı satırlara böl
        const lines = pdf.splitTextToSize(trimmedParagraph, maxWidth);
        
        lines.forEach((line: string) => {
          // Sayfa sonu kontrolü
          if (yPos + 6 > pageHeight - margin) {
            pdf.addPage();
            yPos = margin;
          }
          
          pdf.text(line, margin, yPos);
          yPos += 6;
        });
      });

      // İmza alanları
      yPos += 12;
      if (yPos + 40 > pageHeight - margin) {
        pdf.addPage();
        yPos = margin;
      }

      // İmza başlığı
      const imzaTitleY = addText('İMZALAR', pageWidth / 2, yPos, { 
        fontSize: 12, 
        fontStyle: 'bold', 
        align: 'center',
        lineHeight: 8 
      });
      yPos = imzaTitleY + 12;

      // Sol taraf - Şirket
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const companyLines = pdf.splitTextToSize(companyName, maxWidth / 2 - 5);
      const companyStartY = yPos;
      companyLines.forEach((line: string, idx: number) => {
        pdf.text(line, margin, companyStartY + (idx * 6));
      });
      const companyEndY = companyStartY + (companyLines.length * 6);
      pdf.setFontSize(9);
      pdf.text('_________________', margin, companyEndY + 5);
      pdf.text('Şirket', margin, companyEndY + 10);

      // Sağ taraf - Müşteri
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const customerLines = pdf.splitTextToSize(kontratSahibi, maxWidth / 2 - 5);
      const rightX = pageWidth - margin;
      const customerStartY = yPos;
      customerLines.forEach((line: string, idx: number) => {
        pdf.text(line, rightX, customerStartY + (idx * 6), { align: 'right' });
      });
      const customerEndY = customerStartY + (customerLines.length * 6);
      pdf.setFontSize(9);
      pdf.text('_________________', rightX, customerEndY + 5, { align: 'right' });
      pdf.text('Müşteri', rightX, customerEndY + 10, { align: 'right' });

      // PDF'i indir
      pdf.save(`Sozlesme_${rezervasyonNo}_${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error: any) {
      console.error('Sözleşme oluşturma hatası:', error);
      alert('Sözleşme oluşturulurken bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
    } finally {
      setGeneratingContract(false);
    }
  };

  return (
    <div className="max-w-5xl" data-reservation-detail>
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Rezervasyon Detayı
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Rezervasyon No: {reservation.rezervasyonNo}
          </p>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info Card */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-800 p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                {(() => {
                  const Icon = getEventIcon(eventType);
                  return <Icon className="w-12 h-12 text-blue-600 dark:text-blue-500" />;
                })()}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {customerName || 'Müşteri Bilgisi Yok'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">{eventType}</p>
                </div>
              </div>
              <span className={`px-4 py-2 rounded-full font-semibold ${getStatusColor(reservation.durum)}`}>
                {reservation.durum}
              </span>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <CalendarIcon className="w-4 h-4" /> Tarih
                </p>
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {reservationDate}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">Saat</p>
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {reservationTime}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">Salon</p>
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {salonName}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">Kişi Sayısı</p>
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {guestCount > 0 ? `${guestCount} Kişi` : '-'}
                </p>
              </div>

              {office && (
                <div className="space-y-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Ofis</p>
                  <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {office.name}
                  </p>
                </div>
              )}

              {(reservation.YetkiliUser || reservation.yetkili) && (
                <div className="space-y-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Yetkili</p>
                  <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {reservation.YetkiliUser ? (
                      <div className="space-y-1">
                        <p>{reservation.YetkiliUser.email}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {reservation.YetkiliUser.Roller?.name || reservation.YetkiliUser.role || 'Rol yok'}
                        </p>
                      </div>
                    ) : (
                      <p>{reservation.yetkili}</p>
                    )}
                  </div>
                </div>
              )}

              {(paket || reservation.SozlesmeSablon) && (
                <div className="space-y-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Sözleşme Türü</p>
                  <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {paket?.name || reservation.SozlesmeSablon?.title || reservation.sozlesmeKontrati}
                  </p>
                </div>
              )}

              {/* Kaynak bilgisi - her zaman göster (kaynakId varsa) */}
              {reservation?.kaynakId && (
                <div className="space-y-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Kaynak</p>
                  <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {reservation?.Kaynak?.name || kaynak?.name || 'Yükleniyor...'}
                  </p>
                </div>
              )}

              {getOkulAdi() && (
                <div className="space-y-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Okul Adı</p>
                  <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {getOkulAdi()}
                  </p>
                </div>
              )}

              {getYetkiliBilgisi() && (
                <>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Yetkili Adı</p>
                    <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      {getYetkiliBilgisi()?.adSoyad || '-'}
                    </p>
                  </div>
                  {getYetkiliBilgisi()?.telefon && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Yetkili Telefon</p>
                      <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {getYetkiliBilgisi()?.telefon}
                      </p>
                    </div>
                  )}
                </>
              )}

              <div className="space-y-1 col-span-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">İletişim</p>
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {phoneNumber || '-'}
                </p>
              </div>

              {reservation.createdAt && (
                <div className="space-y-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Oluşturulma</p>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {formatDate(reservation.createdAt)}
                  </p>
                </div>
              )}

              {reservation.updatedAt && (
                <div className="space-y-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Son Güncelleme</p>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {formatDate(reservation.updatedAt)}
                  </p>
                </div>
              )}
            </div>

            {/* Kontrat Bilgileri */}
            {(reservation.sozlesmeKontrati || reservation.kontratSahibiAdSoyad || reservation.kontratSahibiTelefon || reservation.kontratSahibiTc || reservation.kontratAdresi) && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Kontrat Bilgileri</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {(reservation.SozlesmeSablon || reservation.sozlesmeKontrati) && (
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Sözleşme Türü</p>
                      <p className="text-gray-900 dark:text-gray-100 font-medium">
                        {reservation.SozlesmeSablon?.title || reservation.sozlesmeKontrati}
                      </p>
                    </div>
                  )}
                  {reservation.kontratSahibiAdSoyad && (
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Kontrat Sahibi</p>
                      <p className="text-gray-900 dark:text-gray-100 font-medium">{reservation.kontratSahibiAdSoyad}</p>
                    </div>
                  )}
                  {reservation.kontratSahibiTelefon && (
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Telefon</p>
                      <p className="text-gray-900 dark:text-gray-100 font-medium">{reservation.kontratSahibiTelefon}</p>
                    </div>
                  )}
                  {reservation.kontratSahibiTc && (
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">TC Kimlik No</p>
                      <p className="text-gray-900 dark:text-gray-100 font-medium">{reservation.kontratSahibiTc}</p>
                    </div>
                  )}
                  {reservation.kontratAdresi && (
                    <div className="col-span-2">
                      <p className="text-gray-500 dark:text-gray-400">Adres</p>
                      <p className="text-gray-900 dark:text-gray-100 font-medium">{reservation.kontratAdresi}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Fatura Bilgileri */}
            {reservation.faturaIstiyorum && (reservation.faturaUnvani || reservation.faturaVergiDairesi || reservation.faturaVergiNo || reservation.faturaAdresi) && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Fatura Bilgileri</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {reservation.faturaUnvani && (
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Ünvan</p>
                      <p className="text-gray-900 dark:text-gray-100 font-medium">{reservation.faturaUnvani}</p>
                    </div>
                  )}
                  {reservation.faturaVergiDairesi && (
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Vergi Dairesi</p>
                      <p className="text-gray-900 dark:text-gray-100 font-medium">{reservation.faturaVergiDairesi}</p>
                    </div>
                  )}
                  {reservation.faturaVergiNo && (
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Vergi No</p>
                      <p className="text-gray-900 dark:text-gray-100 font-medium">{reservation.faturaVergiNo}</p>
                    </div>
                  )}
                  {reservation.faturaAdresi && (
                    <div className="col-span-2">
                      <p className="text-gray-500 dark:text-gray-400">Fatura Adresi</p>
                      <p className="text-gray-900 dark:text-gray-100 font-medium">{reservation.faturaAdresi}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Şirket Bilgileri */}
            {(taxNumber || taxOffice || companyAddress || companyPhone || companyEmail) && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Şirket Bilgileri</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {companyName && (
                    <div className="col-span-2">
                      <p className="text-gray-500 dark:text-gray-400">Şirket Adı</p>
                      <p className="text-gray-900 dark:text-gray-100 font-medium">{companyName}</p>
                    </div>
                  )}
                  {taxOffice && (
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Vergi Dairesi</p>
                      <p className="text-gray-900 dark:text-gray-100 font-medium">{taxOffice}</p>
                    </div>
                  )}
                  {taxNumber && (
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Vergi No</p>
                      <p className="text-gray-900 dark:text-gray-100 font-medium">{taxNumber}</p>
                    </div>
                  )}
                  {companyAddress && (
                    <div className="col-span-2">
                      <p className="text-gray-500 dark:text-gray-400">Adres</p>
                      <p className="text-gray-900 dark:text-gray-100 font-medium">{companyAddress}</p>
                    </div>
                  )}
                  {companyPhone && (
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Telefon</p>
                      <p className="text-gray-900 dark:text-gray-100 font-medium">{companyPhone}</p>
                    </div>
                  )}
                  {companyEmail && (
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">E-posta</p>
                      <p className="text-gray-900 dark:text-gray-100 font-medium">{companyEmail}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {notes && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Notlar</p>
                <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  {notes}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 no-print">
            <button 
              onClick={handleEdit}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Düzenle
            </button>
            <button 
              onClick={handlePrint}
              className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
            >
              Yazdır
            </button>
            {reservation.durum !== 'İptal' && (
              <button 
                onClick={handleCancel}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
              >
                İptal Et
              </button>
            )}
          </div>
        </div>

        {/* Sidebar - Quick Actions */}
        <div className="space-y-6 no-print">
          {/* Quick Info */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-800 p-6">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Hızlı İşlemler
            </h4>
            <div className="space-y-3">
              <button 
                onClick={handleSendEmail}
                className="w-full px-4 py-2 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
              >
                E-posta Gönder
              </button>
              <button 
                onClick={handleSendSMS}
                className="w-full px-4 py-2 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
              >
                SMS Gönder
              </button>
              <button 
                onClick={handleCall}
                className="w-full px-4 py-2 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
              >
                Ara
              </button>
              <button 
                onClick={handleCreateContract}
                disabled={generatingContract || !reservation}
                className="w-full px-4 py-2 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
              >
                <span>{generatingContract ? 'Sözleşme Oluşturuluyor...' : 'Sözleşme Oluştur'}</span>
                {generatingContract && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                )}
              </button>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-800 p-6">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Aktivite Geçmişi
            </h4>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Rezervasyon oluşturuldu
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(reservation.rezervasyonTarihi)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && reservation && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Rezervasyonu İptal Et
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Bu rezervasyonu iptal etmek istediğinize emin misiniz?
              <br />
              <strong className="text-gray-900 dark:text-gray-100">
                Rezervasyon No: {reservation.rezervasyonNo}
              </strong>
              <br />
              <span className="text-sm text-amber-600 dark:text-amber-400 mt-2 block">
                ⚠️ İptal edilen rezervasyonun tüm ödemeleri otomatik olarak iade edilecektir.
              </span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Vazgeç
              </button>
              <button
                onClick={handleCancelConfirm}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
              >
                İptal Et
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
