import { DEFAULT_FIELD_ORDER } from "./constants";
import { GlobalSettings, DEFAULT_CONFIG, ResumeData } from "../types/resume";
const initialGlobalSettings: GlobalSettings = {
  baseFontSize: 16,
  pagePadding: 32,
  paragraphSpacing: 12,
  lineHeight: 1.5,
  sectionSpacing: 10,
  headerSize: 18,
  subheaderSize: 16,
  useIconMode: true,
  themeColor: "#000000",
  centerSubtitle: true,
};

export const initialResumeState = {
  title: "CV Budi Santoso",
  basic: {
    name: "Budi Santoso",
    title: "Senior Software Engineer",
    employementStatus: "Sedang mencari peluang baru",
    email: "budi.santoso@example.com",
    phone: "+62 812 3456 7890",
    location: "Jakarta Selatan, DKI Jakarta",
    birthDate: "1995-08",
    fieldOrder: DEFAULT_FIELD_ORDER,
    icons: {
      email: "Mail",
      phone: "Phone",
      birthDate: "CalendarRange",
      employementStatus: "Briefcase",
      location: "MapPin",
    },
    photoConfig: DEFAULT_CONFIG,
    customFields: [
      {
        id: "personal",
        label: "Portofolio",
        value: "https://budisantoso.dev",
        icon: "Globe",
      },
    ],
    photo: "/avatar.png",
    githubKey: "",
    githubUseName: "",
    githubContributionsVisible: false,
  },
  education: [
    {
      id: "1",
      school: "Universitas Indonesia",
      major: "Ilmu Komputer",
      degree: "Sarjana Komputer (S.Kom)",
      startDate: "2013-08",
      endDate: "2017-07",
      visible: true,
      gpa: "3.78/4.00",
      description: `<ul>
        <li>IPK 3.78/4.00, lulus dengan predikat Cum Laude</li>
        <li>Mata kuliah inti: Algoritma & Struktur Data, Sistem Operasi, Basis Data, Rekayasa Perangkat Lunak</li>
        <li>Aktif di Himpunan Mahasiswa Ilmu Komputer (HMIK) sebagai Kepala Divisi Teknologi</li>
        <li>Kontributor open-source untuk proyek komunitas pengembang Indonesia</li>
      </ul>`,
    },
  ],
  skillContent: `<div class="skill-content">
  <ul>
    <li>Bahasa: TypeScript, JavaScript (ES6+), Go, Python</li>
    <li>Frontend: React, Next.js, TanStack, TailwindCSS, HTML5/CSS3</li>
    <li>Backend: Node.js, Go, PostgreSQL, Redis, Kafka</li>
    <li>Cloud & DevOps: AWS, GCP, Docker, Kubernetes, GitHub Actions</li>
    <li>Praktik: TDD, Code Review, Observability (Prometheus/Grafana), CI/CD</li>
    <li>Tools: Git, Webpack, Vite, ESLint, Jest, Cypress</li>
    <li>Bahasa asing: Inggris (TOEFL iBT 105)</li>
  </ul>
</div>`,
  selfEvaluationContent: "",
  experience: [
    {
      id: "1",
      company: "Tokopedia",
      position: "Senior Software Engineer",
      date: "2022.03 - Sekarang",
      visible: true,
      details: `<ul>
      <li>Memimpin pengembangan fitur Mitra Tokopedia (kasir digital UMKM) yang melayani 10 juta+ pengguna</li>
      <li>Mengoptimasi performa halaman home dari 4.2s ke 1.1s LCP melalui code splitting dan RUM monitoring</li>
      <li>Mentor 4 junior engineer dalam program Magang Tokopedia internal</li>
      <li>Mengintegrasikan sistem pembayaran QRIS dengan partner Bank Indonesia</li>
    </ul>`,
    },
    {
      id: "2",
      company: "Gojek",
      position: "Software Engineer",
      date: "2019.06 - 2022.02",
      visible: true,
      details: `<ul>
      <li>Mengembangkan microservice fitur GoFood Promo dengan Go + Kafka, throughput 50k req/s</li>
      <li>Implementasi A/B testing platform yang dipakai oleh 30+ tim produk</li>
      <li>Migrasi monolith Ruby ke microservices Go, menurunkan p99 latency sebesar 40%</li>
    </ul>`,
    },
    {
      id: "3",
      company: "Traveloka",
      position: "Junior Software Engineer",
      date: "2017.08 - 2019.05",
      visible: true,
      details: `<ul>
      <li>Membangun fitur pemesanan kereta api PT KAI di aplikasi Traveloka (React Native)</li>
      <li>Implementasi fitur Easy Reschedule yang meningkatkan NPS booking sebesar 18%</li>
      <li>Optimasi bundle size aplikasi mobile dari 28MB ke 19MB</li>
    </ul>`,
    },
  ],
  draggingProjectId: null,
  projects: [
    {
      id: "p1",
      name: "Mitra Tokopedia POS",
      role: "Tech Lead",
      date: "2023.04 - 2024.10",
      description: `<ul>
        <li>Super-app kasir digital untuk warung dan toko kelontong yang melayani jutaan UMKM Indonesia</li>
        <li>Stack: React, TypeScript, Go microservices, PostgreSQL, Redis</li>
        <li>Memimpin tim 6 engineer, end-to-end dari arsitektur sampai delivery</li>
        <li>Implementasi integrasi QRIS, e-wallet, dan pembayaran tunai</li>
        <li>Reduksi cold-start time aplikasi mobile sebesar 35% melalui lazy loading</li>
      </ul>`,
      visible: true,
    },
    {
      id: "p2",
      name: "GoFood Merchant Dashboard",
      role: "Frontend Engineer",
      date: "2020.09 - 2021.12",
      description: `<ul>
        <li>Dashboard analytics untuk restoran mitra GoFood dengan 200k+ daily active merchant</li>
        <li>Stack: Next.js, React Query, Recharts, TailwindCSS</li>
        <li>Implementasi real-time order tracking via WebSocket</li>
        <li>A/B testing fitur revenue insights yang meningkatkan engagement 22%</li>
      </ul>`,
      visible: true,
    },
    {
      id: "p3",
      name: "Pesan Kereta KAI di Traveloka",
      role: "Mobile Engineer",
      date: "2018.02 - 2019.04",
      description: `<ul>
        <li>Integrasi langsung dengan API PT KAI untuk pemesanan tiket kereta api</li>
        <li>Stack: React Native, Redux, Saga, native iOS/Android bridges</li>
        <li>Mendukung pemesanan multi-passenger dan seat selection</li>
        <li>Top-rated feature dengan NPS 78 setelah peluncuran</li>
      </ul>`,
      visible: true,
    },
  ],
  menuSections: [
    { id: "basic", title: "Informasi Dasar", icon: "👤", enabled: true, order: 0 },
    { id: "skills", title: "Keahlian", icon: "⚡", enabled: true, order: 1 },
    {
      id: "experience",
      title: "Pengalaman Kerja",
      icon: "💼",
      enabled: true,
      order: 2,
    },

    {
      id: "projects",
      title: "Proyek",
      icon: "🚀",
      enabled: true,
      order: 3,
    },
    {
      id: "education",
      title: "Pendidikan",
      icon: "🎓",
      enabled: true,
      order: 4,
    },
  ],
  certificates: [],
  customData: {},
  activeSection: "basic",
  globalSettings: initialGlobalSettings,
};

export const initialResumeStateEn = {
  title: "Budi Santoso CV",
  basic: {
    name: "Budi Santoso",
    title: "Senior Software Engineer",
    employementStatus: "Open to opportunities",
    email: "budi.santoso@example.com",
    phone: "+62 812 3456 7890",
    location: "South Jakarta, Indonesia",
    birthDate: "1995-08",
    fieldOrder: DEFAULT_FIELD_ORDER,
    icons: {
      email: "Mail",
      phone: "Phone",
      birthDate: "CalendarRange",
      employementStatus: "Briefcase",
      location: "MapPin",
    },
    photoConfig: DEFAULT_CONFIG,
    customFields: [
      {
        id: "personal",
        label: "Portfolio",
        value: "https://budisantoso.dev",
        icon: "Globe",
      },
    ],
    photo: "/avatar.png",
    githubKey: "",
    githubUseName: "",
    githubContributionsVisible: false,
  },
  education: [
    {
      id: "1",
      school: "University of Indonesia",
      major: "Computer Science",
      degree: "Bachelor of Computer Science",
      startDate: "2013-08",
      endDate: "2017-07",
      visible: true,
      gpa: "3.78/4.00",
      description: `<ul>
        <li>GPA 3.78/4.00, graduated Cum Laude</li>
        <li>Core courses: Data Structures & Algorithms, Operating Systems, Database Systems, Software Engineering</li>
        <li>Active member of Computer Science Student Association (HMIK) as Head of Technology Division</li>
        <li>Open-source contributor for the Indonesian developer community</li>
      </ul>`,
    },
  ],
  skillContent: `<div class="skill-content">
  <ul>
    <li>Languages: TypeScript, JavaScript (ES6+), Go, Python</li>
    <li>Frontend: React, Next.js, TanStack, TailwindCSS, HTML5/CSS3</li>
    <li>Backend: Node.js, Go, PostgreSQL, Redis, Kafka</li>
    <li>Cloud & DevOps: AWS, GCP, Docker, Kubernetes, GitHub Actions</li>
    <li>Practices: TDD, Code Review, Observability (Prometheus/Grafana), CI/CD</li>
    <li>Tools: Git, Webpack, Vite, ESLint, Jest, Cypress</li>
    <li>Languages: English (TOEFL iBT 105)</li>
  </ul>
</div>`,
  selfEvaluationContent: "",
  experience: [
    {
      id: "1",
      company: "Tokopedia",
      position: "Senior Software Engineer",
      date: "2022.03 - Present",
      visible: true,
      details: `<ul>
      <li>Led development of Mitra Tokopedia (digital POS for SMEs) serving 10M+ users</li>
      <li>Optimized home page LCP from 4.2s to 1.1s via code splitting and RUM monitoring</li>
      <li>Mentored 4 junior engineers in the internal Tokopedia internship program</li>
      <li>Integrated QRIS payment system with Bank Indonesia partners</li>
    </ul>`,
    },
    {
      id: "2",
      company: "Gojek",
      position: "Software Engineer",
      date: "2019.06 - 2022.02",
      visible: true,
      details: `<ul>
      <li>Built GoFood Promo microservices with Go + Kafka, throughput 50k req/s</li>
      <li>Implemented A/B testing platform used by 30+ product teams</li>
      <li>Migrated Ruby monolith to Go microservices, reducing p99 latency by 40%</li>
    </ul>`,
    },
    {
      id: "3",
      company: "Traveloka",
      position: "Junior Software Engineer",
      date: "2017.08 - 2019.05",
      visible: true,
      details: `<ul>
      <li>Built train booking feature for PT KAI integration in Traveloka mobile app (React Native)</li>
      <li>Implemented Easy Reschedule feature, lifting booking NPS by 18%</li>
      <li>Reduced mobile bundle size from 28MB to 19MB</li>
    </ul>`,
    },
  ],
  draggingProjectId: null,
  projects: [
    {
      id: "p1",
      name: "Mitra Tokopedia POS",
      role: "Tech Lead",
      date: "2023.04 - 2024.10",
      description: `<ul>
        <li>Digital cashier super-app for Indonesian warung &amp; small retail, serving millions of SME merchants</li>
        <li>Stack: React, TypeScript, Go microservices, PostgreSQL, Redis</li>
        <li>Led a team of 6 engineers end-to-end from architecture to delivery</li>
        <li>Implemented QRIS, e-wallet, and cash payment integrations</li>
        <li>Reduced mobile cold-start by 35% via lazy loading</li>
      </ul>`,
      visible: true,
    },
    {
      id: "p2",
      name: "GoFood Merchant Dashboard",
      role: "Frontend Engineer",
      date: "2020.09 - 2021.12",
      description: `<ul>
        <li>Analytics dashboard for GoFood restaurant partners with 200k+ daily active merchants</li>
        <li>Stack: Next.js, React Query, Recharts, TailwindCSS</li>
        <li>Real-time order tracking via WebSocket</li>
        <li>A/B tested revenue insights, lifting engagement by 22%</li>
      </ul>`,
      visible: true,
    },
    {
      id: "p3",
      name: "PT KAI Train Booking on Traveloka",
      role: "Mobile Engineer",
      date: "2018.02 - 2019.04",
      description: `<ul>
        <li>Direct integration with PT KAI API for train ticket booking</li>
        <li>Stack: React Native, Redux, Saga, native iOS/Android bridges</li>
        <li>Multi-passenger and seat selection support</li>
        <li>Top-rated feature with NPS 78 after launch</li>
      </ul>`,
      visible: true,
    },
  ],
  menuSections: [
    {
      id: "basic",
      title: "Profile",
      icon: "👤",
      enabled: true,
      order: 0,
    },
    {
      id: "skills",
      title: "Skills",
      icon: "⚡",
      enabled: true,
      order: 1,
    },
    {
      id: "experience",
      title: "Experience",
      icon: "💼",
      enabled: true,
      order: 2,
    },
    {
      id: "projects",
      title: "Projects",
      icon: "🚀",
      enabled: true,
      order: 3,
    },
    {
      id: "education",
      title: "Education",
      icon: "🎓",
      enabled: true,
      order: 4,
    },
  ],
  certificates: [],
  customData: {},
  activeSection: "basic",
  globalSettings: initialGlobalSettings,
};

export const blankResumeState = {
  ...initialResumeState,
  title: "CV Baru",
  basic: {
    ...initialResumeState.basic,
    name: "",
    title: "",
    email: "",
    phone: "",
    location: "",
    birthDate: "",
    employementStatus: "",
    photo: "",
    customFields: [],
  },
  education: [],
  skillContent: "",
  selfEvaluationContent: "",
  experience: [],
  projects: [],
  certificates: [],
  menuSections: [initialResumeState.menuSections[0]],
};

export const blankResumeStateEn = {
  ...initialResumeStateEn,
  title: "New Resume",
  basic: {
    ...initialResumeStateEn.basic,
    name: "",
    title: "",
    email: "",
    phone: "",
    location: "",
    birthDate: "",
    employementStatus: "",
    photo: "",
    customFields: [],
  },
  education: [],
  skillContent: "",
  selfEvaluationContent: "",
  experience: [],
  projects: [],
  certificates: [],
  menuSections: [initialResumeStateEn.menuSections[0]],
};
