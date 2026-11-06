import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { WeeklyAttendanceDTO } from "../../models";

interface Props {
  data: WeeklyAttendanceDTO[];
}

export const WeeklyAttendanceChart: React.FC<Props> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <XAxis dataKey="week" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="present" name="Присутствовали" />
        <Bar dataKey="total" name="Всего занятий" />
      </BarChart>
    </ResponsiveContainer>
  );
};
