import { ResumeTemplate } from "@/types/template";

export const modernConfig: ResumeTemplate = {
  id: "modern",
  name: "Dua Kolom",
  description: "Tata letak dua kolom klasik, menonjolkan karakteristik personal",
  thumbnail: "modern",
  layout: "modern",
  colorScheme: {
    primary: "#000000",
    secondary: "#6b7280",
    background: "#ffffff",
    text: "#212529",
  },
  spacing: {
    sectionGap: 8,
    itemGap: 4,
    contentPadding: 0,
  },
  basic: {
    layout: "center",
  },
  availableSections: ["skills", "experience", "projects", "education", "selfEvaluation", "certificates"],
};
