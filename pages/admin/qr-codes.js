import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { supabase, getUser } from '../../lib/supabase';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';

export default function QRCodesPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    checkUserAndLoadRooms();
  }, []);

  const checkUserAndLoadRooms = async () => {
    try {
      const currentUser = await getUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', currentUser.id)
        .single();

      if (userError || userData.role !== 'admin') {
        router.push('/dashboard');
        return;
      }

      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select(`
          *,
          locations (building_name)
        `)
        .order('locations(building_name)', { ascending: true })
        .order('room_number', { ascending: true });

      if (roomsError) {
        console.error('Error fetching rooms:', roomsError);
      } else {
        setRooms(roomsData);
      }

      setUser(currentUser);
    } catch (error) {
      console.error('Error:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const generateQRCodes = async () => {
    setGenerating(true);
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const qrSize = 60;
      const margin = 20;
      const cols = 3;
      const rows = 4;
      
      let currentPage = 0;
      let currentRow = 0;
      let currentCol = 0;

      for (let i = 0; i < rooms.length; i++) {
        const room = rooms[i];
        const roomUrl = `${window.location.origin}/room/${room.id}`;
        
        // Generate QR code
        const qrDataUrl = await QRCode.toDataURL(roomUrl, {
          width: 200,
          margin: 1,
        });

        // Calculate position
        const x = margin + currentCol * (qrSize + 10);
        const y = margin + currentRow * (qrSize + 25);

        // Add new page if needed
        if (currentRow === 0 && currentCol === 0 && i > 0) {
          pdf.addPage();
        }

        // Add QR code
        pdf.addImage(qrDataUrl, 'PNG', x, y, qrSize, qrSize);
        
        // Add room info
        pdf.setFontSize(10);
        pdf.text(`${room.locations?.building_name}`, x, y + qrSize + 5);
        pdf.text(`Room ${room.room_number}`, x, y + qrSize + 12);

        // Move to next position
        currentCol++;
        if (currentCol >= cols) {
          currentCol = 0;
          currentRow++;
          if (currentRow >= rows) {
            currentRow = 0;
          }
        }
      }

      // Save PDF
      pdf.save('xeless-qr-codes.pdf');
    } catch (error) {
      console.error('Error generating QR codes:', error);
      alert(t('error'));
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-xl">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{t('generate_qr')}</h1>
        <button
          onClick={() => router.push('/dashboard')}
          className="btn-secondary"
        >
          {t('back')}
        </button>
      </div>

      <div className="card">
        <div className="text-center space-y-4">
          <div className="text-4xl">📱</div>
          <h2 className="text-xl font-semibold">QR Code Generation</h2>
          <p className="text-gray-600">
            Generate QR codes for all {rooms.length} rooms across 17 buildings
          </p>
          
          <button
            onClick={generateQRCodes}
            disabled={generating}
            className="btn-primary text-lg px-8 py-4"
          >
            {generating ? t('loading') : `${t('generate_qr')} (${rooms.length} rooms)`}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.slice(0, 12).map((room) => (
          <div key={room.id} className="card">
            <div className="text-center">
              <h3 className="font-semibold">{room.locations?.building_name}</h3>
              <p className="text-gray-600">Room {room.room_number}</p>
              <div className="mt-2">
                <QRPreview roomId={room.id} />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {rooms.length > 12 && (
        <div className="text-center text-gray-600">
          And {rooms.length - 12} more rooms...
        </div>
      )}
    </div>
  );
}

function QRPreview({ roomId }) {
  const [qrCode, setQrCode] = useState('');

  useEffect(() => {
    generatePreview();
  }, [roomId]);

  const generatePreview = async () => {
    try {
      const roomUrl = `${window.location.origin}/room/${roomId}`;
      const qrDataUrl = await QRCode.toDataURL(roomUrl, {
        width: 100,
        margin: 1,
      });
      setQrCode(qrDataUrl);
    } catch (error) {
      console.error('Error generating QR preview:', error);
    }
  };

  return qrCode ? (
    <img src={qrCode} alt="QR Code" className="w-16 h-16 mx-auto" />
  ) : (
    <div className="w-16 h-16 bg-gray-200 mx-auto rounded"></div>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}