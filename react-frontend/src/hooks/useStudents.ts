import { useEffect, useState } from "react";
import { StudentDTO } from "../models";
import { groupApi } from "../api";

export function useStudents(groupId: number | null) {
  const [students, setStudents] = useState<StudentDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    groupApi
      .getStudents(groupId)
      .then((data) => setStudents(data))
      .catch(() => setError("Ошибка при загрузке студентов"))
      .finally(() => setLoading(false));
  }, [groupId]);

  return { students, loading, error };
}
