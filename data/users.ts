import type { User } from "./types";

export const users: User[] = [
  { id: "u-admin", name: "Admin", role: "admin" },

  { id: "u-loyilo", name: "Sis. Loyilo", role: "leader", groupId: "womens-cg" },
  { id: "u-nzano", name: "Sis. Nzano Kikon", role: "asst-leader", groupId: "womens-cg" },
  { id: "u-boholi", name: "Sis. Boholi", role: "asst-leader", groupId: "womens-cg" },

  { id: "u-robin", name: "Bro. Robin", role: "leader", groupId: "mens-cg" },
  { id: "u-beizo", name: "Dr. Beizo", role: "asst-leader", groupId: "mens-cg" },
  { id: "u-bishwajit", name: "Bro. Bishwajit", role: "asst-leader", groupId: "mens-cg" },

  { id: "u-tuhovi", name: "Mr. Tuhovi", role: "leader", groupId: "the-gathering" },
  {
    id: "u-luxmi",
    name: "Mrs. Luxmi Yepthomi",
    role: "leader",
    groupId: "the-gathering",
  },

  {
    id: "u-tianoba",
    name: "Bro. Tianoba Amer",
    role: "leader",
    groupId: "business-cg",
  },
  { id: "u-toito", name: "Bro. Toito", role: "asst-leader", groupId: "business-cg" },
  { id: "u-nubuzo", name: "Bro. Nubuzo", role: "asst-leader", groupId: "business-cg" },
  { id: "u-noken", name: "Bro. Noken", role: "asst-leader", groupId: "business-cg" },
  { id: "u-jenti", name: "Sis. Jenti", role: "asst-leader", groupId: "business-cg" },
  { id: "u-kaidin", name: "Bro. Kaidin", role: "asst-leader", groupId: "business-cg" },

  { id: "u-moa", name: "Bro. Moa", role: "leader", groupId: "arts-cg" },
  { id: "u-rebekah", name: "Sis. Rebekah", role: "asst-leader", groupId: "arts-cg" },
  { id: "u-naro", name: "Sis. Naro", role: "asst-leader", groupId: "arts-cg" },

  { id: "u-niesakho", name: "Bro. Niesakho", role: "leader", groupId: "sportz-cg" },
  { id: "u-ivika", name: "Dr. Ivika", role: "leader", groupId: "sportz-cg" },
  { id: "u-vir", name: "Bro. Vir", role: "asst-leader", groupId: "sportz-cg" },
  { id: "u-pete", name: "Sis. Pete", role: "asst-leader", groupId: "sportz-cg" },

  { id: "u-shanti", name: "Sis. Shanti", role: "leader", groupId: "foodies-cg" },
  { id: "u-reshmi", name: "Sis. Reshmi", role: "asst-leader", groupId: "foodies-cg" },
  { id: "u-nzanbeni", name: "Sis. Nzanbeni", role: "asst-leader", groupId: "foodies-cg" },

  {
    id: "u-arthur",
    name: "Bro. Arthur",
    role: "leader",
    groupId: "kings-messengers",
  },
  { id: "u-ibomcha", name: "Bro. Ibomcha", role: "asst-leader", groupId: "kings-messengers" },

  { id: "u-solomon", name: "Bro. Solomon", role: "leader", groupId: "the-collective-sound" },
  { id: "u-tipu", name: "Bro. Tipu", role: "asst-leader", groupId: "the-collective-sound" },
  { id: "u-samuel", name: "Bro. Samuel", role: "asst-leader", groupId: "the-collective-sound" },

  { id: "u-atomi", name: "Bro. Atomi", role: "leader", groupId: "connect-and-play" },
  { id: "u-jethro", name: "Bro. Jethro", role: "asst-leader", groupId: "connect-and-play" },
  { id: "u-laithoi", name: "Bro. Laithoi", role: "asst-leader", groupId: "connect-and-play" },
];
