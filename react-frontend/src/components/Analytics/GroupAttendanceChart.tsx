import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { GroupAttendanceDTO, ChartDataInput } from '../../models';

interface Props {
  data: GroupAttendanceDTO[];
  chartType?: 'pie' | 'bar';
}

export const GroupAttendanceChart: React.FC<Props> = ({ data, chartType = 'pie' }) => {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  // Конвертируем данные в формат для Recharts
  const pieChartData: ChartDataInput[] = data.map(item => ({
    name: item.subjectName,
    value: item.averageAttendancePercentage
  }));

  const barChartData: ChartDataInput[] = data.map(item => ({
    name: item.subjectName,
    value: item.averageAttendancePercentage,
    students: item.totalStudents,
    lessons: item.totalLessons
  }));

  const sortedData = [...data].sort((a, b) => b.averageAttendancePercentage - a.averageAttendancePercentage);

  // Кастомная легенда для PieChart
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
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
          <p style={{ margin: '5px 0 0 0' }}>Посещаемость: <strong>{dataItem.value}%</strong></p>
        </div>
      );
    }
    return null;
  };

  if (chartType === 'pie') {
    return (
      <div>
        <h3>Посещаемость по дисциплинам</h3>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={pieChartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={150}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
            >
              {pieChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div>
      <h3>Сравнение дисциплин по посещаемости</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={barChartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            label={{ value: 'Посещаемость %', angle: -90, position: 'insideLeft' }}
            domain={[0, 100]}
          />
          <Tooltip 
            formatter={(value: any) => [`${value}%`, 'Посещаемость']}
            labelFormatter={(label: any) => label}
          />
          <Legend />
          <Bar 
            dataKey="value" 
            name="Средняя посещаемость"
            fill="#8884d8"
            radius={[4, 4, 0, 0]}
          >
            {barChartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};