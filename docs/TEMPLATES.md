# TEMPLATES.md — Cara Bikin Template CV Baru

> Panduan step-by-step menambah template CV ke gallery CV-Buff. Estimasi waktu: 30-60 menit per template.

---

## 🎨 8 Template yang Sudah Ada

| ID | Nama | Layout | Karakter | File |
|---|---|---|---|---|
| `classic` | Klasik | Single column | Traditional minimalis | `templates/classic/` |
| `modern` | Dua Kolom | Two column | Sidebar + main | `templates/modern/` |
| `left-right` | Latar Judul Bagian | Single | Section header bg | `templates/left-right/` |
| `timeline` | Linimasa | Single + vertical line | Chronological emphasis | `templates/timeline/` |
| `minimalist` | Minimalis | Single | Banyak whitespace | `templates/minimalist/` |
| `elegant` | Elegan | Centered | Divider mewah | `templates/elegant/` |
| `creative` | Kreatif | Asymmetric | Visual contrast | `templates/creative/` |
| `editorial` | Editorial | Mixed serif+sans | Magazine-style | `templates/editorial/` |

---

## 🏗️ Struktur Folder Template

Setiap template mengikuti pola:

```
src/components/templates/<template-id>/
├── config.ts                 ← ResumeTemplate object (metadata + styling defaults)
├── index.tsx                  ← Main component (entry point)
└── sections/
    ├── BaseInfo.tsx           ← Header: nama, kontak, foto
    ├── ExperienceSection.tsx  ← Pengalaman kerja
    ├── EducationSection.tsx   ← Pendidikan
    ├── ProjectSection.tsx     ← Proyek
    ├── SkillSection.tsx       ← Keahlian (rich text)
    ├── SelfEvaluationSection.tsx ← Evaluasi diri (rich text)
    ├── CustomSection.tsx      ← Section custom (user-defined)
    └── SectionTitle.tsx       ← Reusable section title component
```

Sections umum (Certificates, dll.) bisa pakai komponen dari `templates/shared/`.

---

## 🛠️ Step-by-Step: Bikin Template Baru

### Goal: Bikin template `bold` dengan header tebal + warna accent

### Step 1: Copy Template yang Ada Sebagai Template Awal

```bash
cd src/components/templates
cp -r minimalist bold
```

Edit folder `bold/` selanjutnya.

### Step 2: Edit `bold/config.ts`

```ts
import { ResumeTemplate } from "@/types/template";

export const boldConfig: ResumeTemplate = {
  id: "bold",                                          // unik, kebab-case
  name: "Bold",                                        // display name
  description: "Header tebal dengan aksen warna terang, cocok untuk personal branding",
  thumbnail: "bold",                                   // sama dengan id
  layout: "bold",                                      // identifier untuk component
  colorScheme: {
    primary: "#FF6B35",                                // warna utama (orange terang)
    secondary: "#4D4D4D",
    background: "#FFFFFF",
    text: "#1A1A1A",
  },
  spacing: {
    sectionGap: 20,
    itemGap: 12,
    contentPadding: 32,
  },
  basic: {
    layout: "left",                                    // "left" | "center" | "right"
  },
  availableSections: [
    "skills", "experience", "projects",
    "education", "selfEvaluation", "certificates"
  ],
};
```

### Step 3: Edit `bold/index.tsx`

```tsx
import React from "react";
import { ResumeData } from "@/types/resume";
import { ResumeTemplate } from "@/types/template";
import BaseInfo from "./sections/BaseInfo";
import ExperienceSection from "./sections/ExperienceSection";
import EducationSection from "./sections/EducationSection";
import ProjectSection from "./sections/ProjectSection";
import SkillSection from "./sections/SkillSection";
import SelfEvaluationSection from "./sections/SelfEvaluationSection";
import CustomSection from "./sections/CustomSection";
import SectionTitle from "./sections/SectionTitle";
import SectionWrapper from "../shared/SectionWrapper";
import CertificatesSection from "../shared/CertificatesSection";

interface BoldTemplateProps {
  data: ResumeData;
  template: ResumeTemplate;
}

const BoldTemplate: React.FC<BoldTemplateProps> = ({ data, template }) => {
  const { colorScheme } = template;
  const enabledSections = data.menuSections
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case "basic":
        return <BaseInfo basic={data.basic} globalSettings={data.globalSettings} template={template} />;
      case "experience":
        return <ExperienceSection experiences={data.experience} globalSettings={data.globalSettings} />;
      case "education":
        return <EducationSection education={data.education} globalSettings={data.globalSettings} />;
      case "skills":
        return <SkillSection skill={data.skillContent} globalSettings={data.globalSettings} />;
      case "projects":
        return <ProjectSection projects={data.projects} globalSettings={data.globalSettings} />;
      case "certificates":
        return (
          <SectionWrapper sectionId="certificates" style={{ marginTop: `${data.globalSettings?.sectionSpacing || 24}px` }}>
            <SectionTitle type="certificates" globalSettings={data.globalSettings} />
            <CertificatesSection certificates={data.certificates} />
          </SectionWrapper>
        );
      case "selfEvaluation":
        return <SelfEvaluationSection content={data.selfEvaluationContent} globalSettings={data.globalSettings} />;
      default:
        if (sectionId in data.customData) {
          const sectionTitle = data.menuSections.find((s) => s.id === sectionId)?.title || sectionId;
          return <CustomSection title={sectionTitle} sectionId={sectionId} items={data.customData[sectionId]} globalSettings={data.globalSettings} />;
        }
        return null;
    }
  };

  return (
    <div
      className="flex flex-col w-full min-h-screen"
      style={{ backgroundColor: colorScheme.background, color: colorScheme.text }}
    >
      {enabledSections.map((section) => (
        <div key={section.id}>{renderSection(section.id)}</div>
      ))}
    </div>
  );
};

export default BoldTemplate;
```

### Step 4: Customize Sections

Edit setiap file di `bold/sections/` untuk styling-mu. Section umumnya pakai:

- `data` (ResumeData fields)
- `globalSettings` (themeColor, fontFamily, dll.)
- `template` (config defaults)

Contoh `sections/SectionTitle.tsx` dengan style bold:

```tsx
import React from "react";
import { GlobalSettings } from "@/types/resume";
import { useTranslations } from "@/i18n/compat/client";

interface Props {
  type: "experience" | "education" | "skills" | "projects" | "certificates" | "selfEvaluation";
  globalSettings?: GlobalSettings;
}

const SectionTitle: React.FC<Props> = ({ type, globalSettings = {} }) => {
  const t = useTranslations("workbench.sidePanel.layout.standardSections");
  const titleText = t(type);

  return (
    <h2
      style={{
        fontSize: `${globalSettings.headerSize || 22}px`,
        fontWeight: 900,                              // BOLD!
        color: globalSettings.themeColor || "#FF6B35",
        textTransform: "uppercase",                   // Bold style
        letterSpacing: "0.05em",
        borderBottom: `3px solid ${globalSettings.themeColor || "#FF6B35"}`,
        paddingBottom: "4px",
        marginBottom: "12px",
      }}
    >
      {titleText}
    </h2>
  );
};

export default SectionTitle;
```

### Step 5: Register di `templates/registry.ts`

```ts
import { boldConfig } from "./bold/config";
import BoldTemplate from "./bold";

export const TEMPLATE_REGISTRY: TemplateRegistryEntry[] = [
  { config: classicConfig, Component: ClassicTemplate },
  { config: modernConfig, Component: ModernTemplate },
  { config: leftRightConfig, Component: LeftRightTemplate },
  { config: timelineConfig, Component: TimelineTemplate },
  { config: minimalistConfig, Component: MinimalistTemplate },
  { config: elegantConfig, Component: ElegantTemplate },
  { config: creativeConfig, Component: CreativeTemplate },
  { config: editorialConfig, Component: EditorialTemplate },
  { config: boldConfig, Component: BoldTemplate },     // NEW
];
```

Template otomatis muncul di gallery!

### Step 6: Add i18n Labels

`src/i18n/locales/id.json`:

```json
{
  "dashboard": {
    "templates": {
      "bold": {
        "name": "Bold",
        "description": "Header tebal dengan aksen warna terang"
      }
    }
  }
}
```

Sama untuk `en.json`.

### Step 7: Test

```bash
pnpm dev
# Buka http://localhost:1713/app/dashboard/templates
# Klik template "Bold"
# Bikin CV baru pakai template ini
# Test edit + preview
```

### Step 8: Generate Thumbnail (Optional)

```bash
pnpm install:playwright       # sekali saja
pnpm generate:template-snapshots
```

Script akan render template Bold ke `public/template-snapshots/{id,en}/bold.png` dan update manifest.

### Step 9: Commit

```bash
git add -A
git commit -m "feat(templates): add Bold template with vibrant accent"
```

---

## 🎨 Design Tips untuk Template Baru

### Konsistensi dengan Sistem

- Gunakan `globalSettings.themeColor` untuk warna primer (bukan hardcoded)
- Gunakan `globalSettings.fontFamily` untuk font (bukan hardcoded)
- Respect `globalSettings.lineHeight`, `paragraphSpacing`, dll.
- Section spacing dari `globalSettings.sectionSpacing`

### Layout Best Practices

- **A4 size**: 794px width × 1123px height (CSS pixels @ 96 DPI)
- **Print-safe**: gunakan `mm` atau `px` units, hindari `vh`/`vw`
- **No fixed heights**: biarkan content flow natural untuk multi-page
- **Page-break**: `break-inside: avoid` untuk section yang harus utuh

### ATS Compatibility

Untuk template yang ATS-friendly:
- Avoid kolom yang kompleks (sidebar bisa skip oleh ATS)
- Pakai semantic HTML (`<h1>`, `<h2>`, `<p>`)
- Avoid background images / icons untuk text
- Pakai font standar (system-ui, Arial, Times)

### Mobile Responsiveness

Template hanya rendered di workbench preview (desktop). Tidak perlu responsive — fokus ke A4 print.

---

## 🧰 Komponen Shared yang Bisa Dipakai

`src/components/templates/shared/`:

- `SectionWrapper.tsx` — wrapper konsisten dengan margin/padding
- `CertificatesSection.tsx` — render gambar sertifikat dengan flex layout

`src/components/templates/<each>/sections/`:

- `BaseInfo.tsx` — header dengan foto + nama + kontak (boleh customize per template)
- `SectionTitle.tsx` — judul section (heading style)

---

## 🔧 Advanced: Custom Section Rendering

Bila section perlu rendering khusus (misal Project dengan layout grid 2 kolom):

```tsx
// sections/ProjectSection.tsx
const ProjectSection: React.FC<Props> = ({ projects, globalSettings }) => {
  const visibleProjects = projects.filter((p) => p.visible);

  return (
    <SectionWrapper sectionId="projects">
      <SectionTitle type="projects" globalSettings={globalSettings} />
      <div className="grid grid-cols-2 gap-4">    {/* Custom: 2-col grid */}
        {visibleProjects.map((project) => (
          <div key={project.id} className="border-l-4 pl-3" style={{borderColor: globalSettings.themeColor}}>
            <h3 className="font-bold">{project.name}</h3>
            <p className="text-xs text-gray-600">{project.role} | {project.date}</p>
            <div className="mt-1 text-sm" dangerouslySetInnerHTML={{__html: project.description}} />
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
};
```

---

## 📋 Checklist Template Baru

- [ ] Folder `templates/<id>/` dibuat dengan struktur lengkap
- [ ] `config.ts` punya ID unik dan name/description
- [ ] `index.tsx` handle semua section types
- [ ] Setiap section di `sections/*.tsx` styled konsisten
- [ ] Registered di `registry.ts`
- [ ] i18n labels di-add (`id.json` + `en.json`)
- [ ] Test create CV dengan template baru — preview render benar
- [ ] Test switch ke template lain dan kembali — globalSettings reset benar
- [ ] Test export PDF — layout tetap intact
- [ ] (Opsional) Thumbnail di-generate
- [ ] Commit dengan message conventional

---

## 🚨 Common Pitfalls

### 1. ID Conflict

Bila `id` template baru sama dengan yang sudah ada, registry akan duplicate. Pakai ID unik.

### 2. Forget to Register

Template tidak muncul di gallery → cek `registry.ts`.

### 3. Hardcoded Colors

Bila warna hardcoded (e.g. `color: "#FF0000"`), user tidak bisa override via theme color. Pakai `globalSettings.themeColor`.

### 4. Layout Break di PDF Export

CSS yang work di browser bisa break di Puppeteer PDF render. Test selalu dengan **PDF export server** (bukan hanya screenshot).

### 5. Section Order Hardcoded

`enabledSections` di-sort by `order` field dari `menuSections`. JANGAN hardcode order di `index.tsx`.

### 6. Font Issue

Jika pakai font khusus (di luar 4 default: Plus Jakarta Sans, Inter, Poppins, Lora), pastikan font tersedia di `font.css` dan tidak ke-block oleh CSP.

---

## 🎯 Ideas untuk Template Baru

- **Academic CV** — long format, publications-heavy
- **Medical CV** — section khusus residensi, lisensi, publikasi
- **Designer Portfolio** — gambar-heavy, project showcase
- **Executive Summary** — single-page eksekutif, hierarki visual jelas
- **Tech Lead** — code samples, GitHub stats embed
- **Marketing CV** — metrics + case study format
- **Sales CV** — quota achievements, awards
- **Freelancer / Consultant** — testimonials, project catalog

---

## 🤝 Submit Template ke Repo

Bila bikin template bagus dan mau share ke komunitas:

1. Fork repo
2. Bikin branch `feat/template-<name>`
3. Implement (follow checklist di atas)
4. Generate thumbnail
5. PR ke `nugrahalabib/CV-Buff` dengan deskripsi:
   - Screenshot template
   - Target audience (industry/role)
   - Alasan template ini berbeda dari yang sudah ada

---

Selamat berkreasi! 🎨
