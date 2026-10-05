import type { User } from "./types";

export const users: User[] = [
  { id: "u-admin", name: "Admin", role: "admin" },

  { id: "u-bokali", name: "Sis. Bokali", role: "leader", groupId: "womens-cg" },
  {
    id: "u-womens-asst-demo",
    name: "Demo Asst. Leader",
    role: "asst-leader",
    groupId: "womens-cg",
    isDemo: true,
  },
  { id: "u-robin", name: "Bro. Robin", role: "leader", groupId: "mens-cg" },
  { id: "u-tuhovi", name: "Mr. Tuhovi", role: "leader", groupId: "the-gathering" },
  {
    id: "u-luxmi",
    name: "Mrs. Luxmi Yeptomi",
    role: "leader",
    groupId: "the-gathering",
  },
  {
    id: "u-tianoba",
    name: "Bro. Tianoba Amer",
    role: "leader",
    groupId: "business-cg",
  },
  { id: "u-moa", name: "Bro. Moa", role: "leader", groupId: "arts-cg" },
  { id: "u-niesakho", name: "Bro. Niesakho", role: "leader", groupId: "sportz-cg" },
  { id: "u-avika", name: "Dr. Avika", role: "leader", groupId: "sportz-cg" },
  { id: "u-shanti", name: "Sis. Shanti", role: "leader", groupId: "foodies-cg" },
  {
    id: "u-arthur",
    name: "Bro. Arthur",
    role: "leader",
    groupId: "kings-messengers",
  },
];
