// TeacherQRScanner.tsx
import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import jsQR from 'jsqr';

interface Props {
  groupId: number;
  subjectId: number;
}

const TeacherQRScanner: React.FC<Props> = ({ groupId, subjectId }) => {
  const webcamRef = useRef<Webcam>(null);
  const [scanning, setScanning] = useState(true);
  const [lastScanned, setLastScanned] = useState<any>(null);
  const [scannedStudents, setScannedStudents] = useState<any[]>([]);
  const [error, setError] = useState('');
  
  // Функция сканирования кадра
  const scanFrame = async () => {
    if (!webcamRef.current || !scanning) return;
    
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;
    
    try {
      // Декодируем QR из изображения
      const qrData = await decodeQR(imageSrc);
      
      if (qrData) {
        // Извлекаем studentId из QR
        const studentId = extractStudentId(qrData);
        
        // Отправляем отметку на сервер
        await markAttendance(studentId);
        
        // Вибрируем (если устройство поддерживает)
        if (navigator.vibrate) {
          navigator.vibrate(200);
        }
        
        // Проигрываем звук
        playBeep();
      }
    } catch (err) {
      // Ошибка сканирования - просто игнорируем
    }
    
    // Сканируем следующий кадр
    requestAnimationFrame(scanFrame);
  };
  
  // Запускаем непрерывное сканирование
  useEffect(() => {
    const scanLoop = setInterval(() => {
      scanFrame();
    }, 100); // Сканируем каждые 100мс
    
    return () => clearInterval(scanLoop);
  }, [scanning]);
  
  // Отметка посещаемости
  const markAttendance = async (studentId: number) => {
    try {
      const response = await fetch(
        `/api/api/qr/mark?studentId=${studentId}&subjectId=${subjectId}&groupId=${groupId}`,
        { method: 'GET' }
      );
      
      const result = await response.json();
      
      if (result.success) {
        // Показываем уведомление об успехе
        setLastScanned({
          type: 'success',
          studentName: result.studentName,
          time: new Date().toLocaleTimeString(),
          message: 'Посещаемость отмечена'
        });
        
        // Добавляем в список отмеченных
        setScannedStudents(prev => [
          { 
            ...result, 
            time: new Date().toLocaleTimeString() 
          },
          ...prev
        ]);
        
        // Убираем уведомление через 3 секунды
        setTimeout(() => setLastScanned(null), 3000);
        
      } else {
        // Показываем уведомление об ошибке
        setLastScanned({
          type: 'error',
          studentName: result.studentName || 'Неизвестный студент',
          time: new Date().toLocaleTimeString(),
          message: result.message
        });
        
        console.log(`Студент ${result.studentName || 'неизвестный'} пытался отметиться`);
        
        // Убираем уведомление через 3 секунды
        setTimeout(() => setLastScanned(null), 3000);
      }
    } catch (err) {
      console.error('Ошибка отметки:', err);
      setLastScanned({
        type: 'error',
        studentName: '',
        time: new Date().toLocaleTimeString(),
        message: 'Ошибка соединения с сервером'
      });
      setTimeout(() => setLastScanned(null), 3000);
    }
  };
  
  // Вспомогательные функции
  const decodeQR = async (imageSrc: string): Promise<string | null> => {
    // Создаем изображение для декодирования
    const img = new Image();
    img.src = imageSrc;
    
    return new Promise((resolve) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0, img.width, img.height);
        
        const imageData = ctx?.getImageData(0, 0, img.width, img.height);
        if (imageData) {
          const code = jsQR(imageData.data, img.width, img.height);
          resolve(code ? code.data : null);
        } else {
          resolve(null);
        }
      };
    });
  };
  
  const extractStudentId = (qrData: string): number => {
    // Парсим QR данные (может быть URL или просто ID)
    if (qrData.includes('studentId=')) {
      const match = qrData.match(/studentId=(\d+)/);
      return match ? parseInt(match[1]) : parseInt(qrData);
    }
    return parseInt(qrData);
  };
  
  const playBeep = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    gainNode.gain.value = 0.5;
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
  };
  
  return (
    <div style={{ display: 'flex', gap: '20px', padding: '20px' }}>
      {/* Левая колонка - камера */}
      <div style={{ flex: 1 }}>
        <div style={{ 
          position: 'relative',
          border: '3px solid #4caf50',
          borderRadius: '10px',
          overflow: 'hidden'
        }}>
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              facingMode: 'environment', // Задняя камера
              width: 640,
              height: 480
            }}
            style={{ width: '100%', display: 'block' }}
          />
          
          {/* Наложение для сканирования */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '200px',
            height: '200px',
            border: '3px solid #ff4081',
            borderRadius: '10px',
            boxShadow: '0 0 0 999px rgba(0,0,0,0.3)',
            pointerEvents: 'none'
          }} />
        </div>
        
        {/* Всплывающее уведомление */}
        {lastScanned && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: lastScanned.type === 'success' ? '#4caf50' : '#f44336',
            color: 'white',
            padding: '15px 25px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            animation: 'slideIn 0.3s, fadeOut 0.3s 2.7s',
            zIndex: 1000,
            minWidth: '250px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ fontSize: '24px' }}>
                {lastScanned.type === 'success' ? '✅' : '❌'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                  {lastScanned.studentName}
                </div>
                <div style={{ fontSize: '13px', opacity: 0.9 }}>
                  {lastScanned.message}
                </div>
                <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '4px' }}>
                  {lastScanned.time}
                </div>
              </div>
            </div>
          </div>
        )}
        
      </div>
      
      {/* Правая колонка - список отмеченных */}
      <div style={{ 
        flex: 1,
        maxHeight: '600px',
        overflowY: 'auto',
        background: '#f5f5f5',
        borderRadius: '10px',
        padding: '15px'
      }}>
        <h3>Отмеченные сегодня</h3>
        <div style={{ 
          fontSize: '14px',
          color: '#666',
          marginBottom: '10px'
        }}>
          Всего: {scannedStudents.length}
        </div>
        
        {scannedStudents.map((student, index) => (
          <div key={index} style={{
            padding: '10px',
            margin: '5px 0',
            background: 'white',
            borderRadius: '5px',
            borderLeft: '4px solid #4caf50',
            animation: 'fadeIn 0.3s'
          }}>
            <div style={{ fontWeight: 'bold' }}>{student.studentName}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {student.time}
            </div>
          </div>
        ))}
      </div>
      
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default TeacherQRScanner;