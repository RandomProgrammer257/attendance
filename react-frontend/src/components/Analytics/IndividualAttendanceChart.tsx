import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { IndividualAttendanceDTO } from '../../models';

interface Props {
  data: IndividualAttendanceDTO[];
  threshold?: number;
}

export const IndividualAttendanceChart: React.FC<Props> = ({ data, threshold = 70 }) => {
  // Конвертируем данные в нужный формат
  const chartData = data.map(item => ({
    name: item.studentName,
    percentage: item.attendancePercentage,
    attended: item.attendedLessons,
    total: item.totalLessons,
    studentId: item.studentId
  }));

  const sortedData = [...chartData].sort((a, b) => b.percentage - a.percentage);

  const getBarColor = (percentage: number) => {
    if (percentage >= 85) return '#4caf50'; // зеленый
    if (percentage >= 70) return '#ff9800'; // оранжевый
    return '#f44336'; // красный
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataItem = payload[0].payload;
      return (
        <div className="custom-tooltip" style={{
          backgroundColor: 'white',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}>
          <p style={{ margin: 0 }}><strong>{dataItem.name}</strong></p>
          <p style={{ margin: '5px 0 0 0' }}>
            Посещаемость: <strong>{dataItem.percentage}%</strong>
          </p>
          <p style={{ margin: '5px 0 0 0' }}>
            Занятий: {dataItem.attended}/{dataItem.total}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <h3>Индивидуальная посещаемость студентов</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={sortedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
          />
          <YAxis 
            label={{ value: 'Посещаемость %', angle: -90, position: 'insideLeft' }}
            domain={[0, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="percentage" 
            name="Посещаемость"
            radius={[4, 4, 0, 0]}
          >
            {sortedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.percentage)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div style={{ marginTop: 10, fontSize: 12, color: '#666' }}>
        <span style={{ color: '#4caf50' }}>■ Высокая (≥85%)</span>
        <span style={{ color: '#ff9800', marginLeft: 20 }}>■ Средняя (70-84%)</span>
        <span style={{ color: '#f44336', marginLeft: 20 }}>■ Низкая (&lt;70%)</span>
        {threshold && (
          <span style={{ marginLeft: 20 }}>
            Порог: <strong>{threshold}%</strong>
          </span>
        )}
      </div>
    </div>
  );
};