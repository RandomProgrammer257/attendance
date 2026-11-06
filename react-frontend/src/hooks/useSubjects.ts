import { useEffect, useState } from "react";
import { SubjectDTO } from "../models";
import { subjectApi } from "../api";

export const useSubjects = () => {
  const [subjects, setSubjects] = useState<SubjectDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const data = await subjectApi.getSubjects();
        setSubjects(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Ошибка при загрузке предметов");
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  return { subjects, loading, error };
};
