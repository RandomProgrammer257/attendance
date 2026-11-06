import React from "react";
import { GroupDTO } from "../../models";
import "./GroupList.css";

interface Props {
  groups: GroupDTO[];
  onSelect: (group: GroupDTO) => void;
}

export const GroupList: React.FC<Props> = ({ groups, onSelect }) => {
  return (
    <div className="group-list">
      {groups.map((g) => (
        <button key={g.id} className="group-item" onClick={() => onSelect(g)}>
          {g.groupNumber}
        </button>
      ))}
    </div>
  );
};
