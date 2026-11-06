// components/SubjectList/SubjectList.tsx
import React from "react";
import { SubjectDTO } from "../../models";

interface SubjectListProps {
  subjects: SubjectDTO[];
  onSelect: (subject: SubjectDTO) => void;
}

export const SubjectList: React.FC<SubjectListProps> = ({ subjects, onSelect }) => {
  return (
    <ul>
      {subjects.map((subject) => (
        <li key={subject.id} onClick={() => onSelect(subject)} style={{ cursor: "pointer" }}>
          {subject.name} - {subject.teacherName || "Нет учителя"}
        </li>
      ))}
    </ul>
  );
};