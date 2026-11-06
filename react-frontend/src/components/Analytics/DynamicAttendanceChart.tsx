import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { DynamicAttendanceDTO } from '../../models';

interface Props {
  data: DynamicAttendanceDTO[];
  title?: string;
}

export const DynamicAttendanceChart: React.FC<Props> = ({ data, title = "Динамика посещаемости" }) => {
  const chartData = data.map(item => ({
    period: item.period,
    attendance: item.attendancePercentage,
    lessons: item.totalLessons,
    attended: item.attendedLessons
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{
          backgroundColor: 'white',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}>
          <p style={{ margin: 0 }}><strong>Период: {label}</strong></p>
          <p style={{ margin: '5px 0 0 0' }}>
            Посещаемость: <strong>{payload[0].value}%</strong>
          </p>
          <p style={{ margin: '5px 0 0 0' }}>
            Посетили: {payload[1]?.value || 0}/{payload[2]?.value || 0} занятий
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <h3>{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="period" 
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            label={{ value: 'Посещаемость %', angle: -90, position: 'insideLeft' }}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="attendance"
            name="Посещаемость"
            stroke="#8884d8"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="lessons"
            name="Всего занятий"
            stroke="#82ca9d"
            strokeWidth={1}
            strokeDasharray="5 5"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};