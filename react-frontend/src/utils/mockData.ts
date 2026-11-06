import { Subject } from '../types';

export const mockSubjects: Subject[] = [
  {
    id: 1,
    name: "Математика",
    type: "lecture",
    groups: [
      {
        id: 1,
        name: "Группа М-101",
        students: [
          { id: 1, firstName: "Иван", lastName: "Ivanov", groupId: 1 },
          { id: 2, firstName: "Петр", lastName: "Petrov", groupId: 1 },
          { id: 3, firstName: "Мария", lastName: "Sidorova", groupId: 1 }
        ]
      }
    ]
  },
  {
    id: 2,
    name: "Программирование",
    type: "practice",
    groups: [
      {
        id: 2,
        name: "Группа П-201",
        students: [
          { id: 4, firstName: "Анна", lastName: "Kuznetsova", groupId: 2 },
          { id: 5, firstName: "Дмитрий", lastName: "Smirnov", groupId: 2 }
        ]
      }
    ]
  }
];