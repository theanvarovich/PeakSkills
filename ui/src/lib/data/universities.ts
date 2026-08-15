import { University } from "@/types";

export const universities: University[] = [
  { id: "u1",  name: "Westminster International University in Tashkent", city: "Tashkent", country: "Uzbekistan", tier: 1, type: "international" },
  { id: "u2",  name: "Turin Polytechnic University in Tashkent", city: "Tashkent", country: "Uzbekistan", tier: 1, type: "international" },
  { id: "u3",  name: "Inha University in Tashkent", city: "Tashkent", country: "Uzbekistan", tier: 1, type: "international" },
  { id: "u4",  name: "Management Development Institute of Singapore in Tashkent", city: "Tashkent", country: "Uzbekistan", tier: 1, type: "international" },
  { id: "u5",  name: "Tashkent University of Information Technologies", city: "Tashkent", country: "Uzbekistan", tier: 2, type: "national" },
  { id: "u6",  name: "National University of Uzbekistan", city: "Tashkent", country: "Uzbekistan", tier: 2, type: "national" },
  { id: "u7",  name: "Tashkent State Technical University", city: "Tashkent", country: "Uzbekistan", tier: 2, type: "national" },
  { id: "u8",  name: "University of World Economy and Diplomacy", city: "Tashkent", country: "Uzbekistan", tier: 2, type: "national" },
  { id: "u9",  name: "Tashkent Institute of Finance", city: "Tashkent", country: "Uzbekistan", tier: 2, type: "national" },
  { id: "u10", name: "Samarkand State University", city: "Samarkand", country: "Uzbekistan", tier: 3, type: "regional" },
  { id: "u11", name: "Fergana State University", city: "Fergana", country: "Uzbekistan", tier: 3, type: "regional" },
  { id: "u12", name: "Namangan Engineering and Technology Institute", city: "Namangan", country: "Uzbekistan", tier: 3, type: "regional" },
];

export const universityTierMap: Record<string, 1 | 2 | 3> = Object.fromEntries(
  universities.map(u => [u.name, u.tier])
);
