import React, { useEffect, useState } from 'react';
import { DynamicAttendanceChart } from './DynamicAttendanceChart';
import { GroupAttendanceChart } from './GroupAttendanceChart';
import { KPICards } from './KPICards';
import { 
  KPICardDTO,
  GroupAttendanceDTO,
  DynamicAttendanceDTO
} from '../../models';
import axios from 'axios';

interface Props {
  subjectId: number;
  groupId: number;
  subjectName?: string;
  groupNumber?: string;
}

const API_BASE_URL = "/api/api";

// Безопасное округление чисел
const safeToFixed = (value: any, digits: number = 1): string => {
  const num = typeof value === 'number' && !isNaN(value) ? value : 0;
  return num.toFixed(digits);
};

export const AnalyticsPage: React.FC<Props> = ({ 
  subjectId, 
  groupId,
  subjectName = 'Предмет',
  groupNumber = 'Группа'
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupAttendance, setGroupAttendance] = useState<number>(0);
  const [comparisonData, setComparisonData] = useState<GroupAttendanceDTO[]>([]);
  const [dynamicData, setDynamicData] = useState<DynamicAttendanceDTO[]>([]);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('=== ЗАГРУЗКА ГРУППОВОЙ АНАЛИТИКИ ===');
        
        // 1. Средняя посещаемость группы
        try {
          const groupRes = await axios.get<number>(
            `${API_BASE_URL}/analytics/group/${subjectId}/${groupId}`
          );
          console.log('Групповая посещаемость:', groupRes.data);
          setGroupAttendance(groupRes.data ?? 0);
        } catch (groupErr: any) {
          console.warn('Групповая посещаемость недоступна:', groupErr.message);
          setGroupAttendance(0);
        }
        
        // 2. Сравнение с другими предметами
        try {
          const comparisonRes = await axios.get<GroupAttendanceDTO[]>(
            `${API_BASE_URL}/analytics/comparison/${groupId}`
          );
          console.log('Сравнение предметов:', comparisonRes.data);
          setComparisonData(Array.isArray(comparisonRes.data) ? comparisonRes.data : []);
        } catch (comparisonErr: any) {
          console.warn('Сравнение предметов недоступно:', comparisonErr.message);
          setComparisonData([]);
        }
        
        // 3. Динамическая аналитика
        try {
          const dynamicRes = await axios.get<DynamicAttendanceDTO[]>(
            `${API_BASE_URL}/analytics/dynamic/weekly/${subjectId}/${groupId}`
          );
          console.log('Динамические данные:', dynamicRes.data);
          setDynamicData(Array.isArray(dynamicRes.data) ? dynamicRes.data : []);
        } catch (dynamicErr: any) {
          console.warn('Динамическая аналитика недоступна:', dynamicErr.message);
          setDynamicData([]);
        }
        
      } catch (err: any) {
        console.error('Ошибка загрузки аналитики:', err);
        setError(err.message || 'Не удалось загрузить данные');
      } finally {
        setLoading(false);
      }
    };

    if (subjectId && groupId) {
      fetchAnalyticsData();
    }
  }, [subjectId, groupId]);

  // Генерация KPI карточек (с защитой от undefined)
  const generateKPICards = (): KPICardDTO[] => {
    // Безопасное вычисление общего количества занятий
    const totalLessons = Array.isArray(dynamicData) 
      ? dynamicData.reduce((sum, item) => sum + (item?.totalLessons ?? 0), 0)
      : 0;
    
    return [
      {
        title: 'Средняя посещаемость группы',
        value: `${safeToFixed(groupAttendance)}%`,
        icon: 'attendance',
        color: groupAttendance >= 80 ? 'success' : 
               groupAttendance >= 60 ? 'warning' : 'danger'
      },
      {
        title: 'Всего занятий',
        value: totalLessons,
        icon: 'lessons',
        color: 'info'
      },
      {
        title: 'Периодов анализа',
        value: Array.isArray(dynamicData) ? dynamicData.length : 0,
        icon: 'trend-up',
        color: 'info'
      },
      {
        title: 'Предметов для сравнения',
        value: Array.isArray(comparisonData) ? comparisonData.length : 0,
        icon: 'group',
        color: 'info'
      }
    ];
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        background: '#f5f5f5',
        borderRadius: '8px',
        margin: '20px'
      }}>
        <h3>Загрузка групповой аналитики...</h3>
        <p>{subjectName} - {groupNumber}</p>
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'inline-block', padding: '10px', background: '#e3f2fd', borderRadius: '4px' }}>
            Запросы к серверу...
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={{ 
        padding: '20px',
        background: '#ffebee',
        color: '#c62828',
        borderRadius: '8px',
        margin: '20px'
      }}>
        <h3>Ошибка загрузки аналитики</h3>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{ 
            marginTop: '15px',
            padding: '8px 16px',
            background: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Повторить
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '5px' }}>Групповая аналитика</h2>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        {subjectName} • Группа {groupNumber}
      </p>
      
      <KPICards cards={generateKPICards()} />
      
      {/* ГРУППОВАЯ ПОСЕЩАЕМОСТЬ */}
      <div style={{ 
        margin: '40px 0',
        padding: '30px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginBottom: '20px', color: '#333' }}>
          📊 Посещаемость группы
        </h3>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '30px'
        }}>
          <div style={{ 
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: `conic-gradient(
              ${groupAttendance >= 80 ? '#4caf50' : groupAttendance >= 60 ? '#ff9800' : '#f44336'} ${groupAttendance * 3.6}deg, 
              #e0e0e0 0deg
            )`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            <div style={{ 
              width: '160px',
              height: '160px',
              borderRadius: '50%',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column'
            }}>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#333' }}>
                {safeToFixed(groupAttendance)}%
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                средняя
              </div>
            </div>
          </div>
          
          <div style={{ marginLeft: '40px', textAlign: 'left' }}>
            <div style={{ 
              fontSize: '24px', 
              fontWeight: 'bold',
              color: groupAttendance >= 80 ? '#4caf50' : groupAttendance >= 60 ? '#ff9800' : '#f44336'
            }}>
              {groupAttendance >= 80 ? 'Высокая' : groupAttendance >= 60 ? 'Средняя' : 'Низкая'}
            </div>
            <div style={{ color: '#666', marginTop: '10px' }}>
              {groupAttendance >= 80 ? 'Группа показывает отличные результаты' :
               groupAttendance >= 60 ? 'Стабильная посещаемость в группе' :
               'Требуется внимание к посещаемости'}
            </div>
            <div style={{ 
              marginTop: '20px',
              padding: '10px 15px',
              background: '#f5f5f5',
              borderRadius: '6px',
              fontSize: '14px'
            }}>
              <div>📈 <strong>Целевой показатель:</strong> 85%</div>
              <div>📊 <strong>Текущий результат:</strong> {safeToFixed(groupAttendance)}%</div>
              <div>🎯 <strong>Осталось до цели:</strong> {safeToFixed(85 - groupAttendance)}%</div>
            </div>
          </div>
        </div>
      </div>
      
      
      
      
      
      {/* НЕТ ДАННЫХ */}
      {!loading && !error && (!Array.isArray(dynamicData) || dynamicData.length === 0) && (!Array.isArray(comparisonData) || comparisonData.length === 0) && (
        <div style={{ 
          padding: '40px',
          textAlign: 'center',
          background: '#f5f5f5',
          borderRadius: '8px',
          margin: '20px 0'
        }}>
          <h3 style={{ color: '#666' }}>Нет данных для анализа</h3>
          <p style={{ color: '#666', marginTop: '10px' }}>
            Добавьте посещаемость для отображения аналитики
          </p>
        </div>
      )}
    </div>
  );
};