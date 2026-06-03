import { ResumeTemplate } from "@/types/template";

export const editorialConfig: ResumeTemplate = {
  id: "editorial",
  name: "Editorial",
  description: "Template editorial mewah dengan perpaduan sempurna serif tebal dan sans-serif elegan, dilengkapi linimasa sisi yang berkelas.",
  thumbnail: "editorial",
  layout: "editorial",
  colorScheme: {
    primary: "#000000",
    secondary: "#666666",
    text: "#1a1a1a",
    background: "#FAF8F5",
  },
  spacing: {
    sectionGap: 32,
    itemGap: 16,
    contentPadding: 36,
  },
  basic: {
    layout: "left",
  },
  availableSections: ["basic", "experience", "education", "projects", "skills", "selfEvaluation", "certificates", "custom"],
};
