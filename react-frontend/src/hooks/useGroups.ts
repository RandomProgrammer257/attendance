import { useEffect, useState } from "react";
import { GroupDTO } from "../models";
import { subjectApi } from "../api";

export function useGroups(subjectId: number | null) {
  const [groups, setGroups] = useState<GroupDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (subjectId === null) return; 
    setLoading(true);

    subjectApi
      .getGroups(subjectId)
      .then((data) => setGroups(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("Ошибка при загрузке групп:", err);
        setError("Ошибка при загрузке групп");
      })
      .finally(() => setLoading(false));
  }, [subjectId]);

  return { groups, loading, error };
}
