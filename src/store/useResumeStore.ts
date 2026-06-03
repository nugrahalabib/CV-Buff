import { create } from "zustand";
import {
  BasicInfo,
  Education,
  Experience,
  GlobalSettings,
  Project,
  CustomItem,
  ResumeData,
  MenuSection,
  Certificate,
} from "../types/resume";
import { DEFAULT_TEMPLATES } from "@/config";
import {
  initialResumeState,
  initialResumeStateEn,
  blankResumeState,
  blankResumeStateEn,
} from "@/config/initialResumeData";
import { generateUUID } from "@/utils/uuid";

/**
 * Resumes live on the SERVER (per-user, /api/resumes), NOT on the device.
 * - loadResumes() pulls the user's CVs after login.
 * - Content edits are auto-saved to the server (debounced PUT) via the subscribe below.
 * - create/duplicate/add → immediate POST; delete → DELETE. No LocalStorage, no folder-sync.
 * CV only reaches the device on download/export.
 */
interface ResumeStore {
  resumes: Record<string, ResumeData>;
  activeResumeId: string | null;
  activeResume: ResumeData | null;
  isLoading: boolean;
  isSaving: boolean;
  saveError: boolean;

  loadResumes: () => Promise<void>;
  ensureResumeLoaded: (id: string) => Promise<ResumeData | null>;
  reset: () => void;

  createResume: (templateId: string | null, isBlank?: boolean) => string;
  deleteResume: (resume: ResumeData) => void;
  duplicateResume: (resumeId: string) => string;
  updateResume: (resumeId: string, data: Partial<ResumeData>) => void;
  setActiveResume: (resumeId: string) => void;

  updateResumeTitle: (title: string) => void;
  updateBasicInfo: (data: Partial<BasicInfo>) => void;
  updateEducation: (data: Education) => void;
  updateEducationBatch: (educations: Education[]) => void;
  deleteEducation: (id: string) => void;
  updateExperience: (data: Experience) => void;
  updateExperienceBatch: (experiences: Experience[]) => void;
  deleteExperience: (id: string) => void;
  updateProjects: (project: Project) => void;
  updateProjectsBatch: (projects: Project[]) => void;
  deleteProject: (id: string) => void;
  setDraggingProjectId: (id: string | null) => void;
  updateSkillContent: (skillContent: string) => void;
  updateSelfEvaluationContent: (content: string) => void;
  reorderSections: (newOrder: ResumeData["menuSections"]) => void;
  toggleSectionVisibility: (sectionId: string) => void;
  setActiveSection: (sectionId: string) => void;
  updateMenuSections: (sections: ResumeData["menuSections"]) => void;
  addCustomData: (sectionId: string) => void;
  updateCustomData: (sectionId: string, items: CustomItem[]) => void;
  removeCustomData: (sectionId: string) => void;
  addCustomItem: (sectionId: string) => void;
  updateCustomItem: (
    sectionId: string,
    itemId: string,
    updates: Partial<CustomItem>
  ) => void;
  removeCustomItem: (sectionId: string, itemId: string) => void;
  updateGlobalSettings: (settings: Partial<GlobalSettings>) => void;
  setThemeColor: (color: string) => void;
  setTemplate: (templateId: string) => void;
  addResume: (resume: ResumeData) => string;
  addCertificate: (certificate: Certificate) => void;
  updateCertificate: (id: string, updates: Partial<Certificate>) => void;
  updateCertificatesBatch: (certificates: Certificate[]) => void;
  removeCertificate: (id: string) => void;
}

// ── Server persistence helpers ────────────────────────────────────────────────
const API_BASE = "/api/resumes";
// Suppress the autosave subscribe while we apply data fetched FROM the server.
let suppressSave = false;
const saveTimers = new Map<string, ReturnType<typeof setTimeout>>();

function cancelSave(id: string) {
  const t = saveTimers.get(id);
  if (t) {
    clearTimeout(t);
    saveTimers.delete(id);
  }
}

/** Debounced PUT of a single resume (1.2s window, coalesces rapid edits). */
function scheduleSave(id: string) {
  cancelSave(id);
  saveTimers.set(
    id,
    setTimeout(() => {
      saveTimers.delete(id);
      const r = useResumeStore.getState().resumes[id];
      if (!r) return;
      useResumeStore.setState({ isSaving: true, saveError: false });
      fetch(`${API_BASE}/${r.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(r),
      })
        .then((res) => {
          if (!res.ok) useResumeStore.setState({ saveError: true });
        })
        .catch(() => useResumeStore.setState({ saveError: true }))
        .finally(() => useResumeStore.setState({ isSaving: false }));
    }, 1200)
  );
}

function postResume(resume: ResumeData) {
  fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(resume),
  }).catch(() => useResumeStore.setState({ saveError: true }));
}

function deleteResumeOnServer(id: string) {
  fetch(`${API_BASE}/${id}`, { method: "DELETE" }).catch(() => {});
}

export const useResumeStore = create<ResumeStore>((set, get) => ({
  resumes: {},
  activeResumeId: null,
  activeResume: null,
  isLoading: false,
  isSaving: false,
  saveError: false,

  loadResumes: async () => {
    set({ isLoading: true, saveError: false });
    try {
      // Discard any stale on-device CV cache so it can NEVER bleed into an account.
      // CV data now lives only on the server, scoped to the logged-in user — every
      // user starts from their own (empty) server list, fully isolated.
      try {
        localStorage.removeItem("cv-buff-resume-storage");
      } catch {
        /* ignore */
      }

      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error(String(res.status));
      const { resumes } = (await res.json()) as { resumes: ResumeData[] };
      const map: Record<string, ResumeData> = {};
      for (const r of resumes) map[r.id] = r;

      suppressSave = true;
      set((s) => ({
        resumes: map,
        activeResume: s.activeResumeId ? map[s.activeResumeId] ?? null : null,
      }));
      suppressSave = false;
    } catch {
      set({ saveError: true });
    } finally {
      set({ isLoading: false });
    }
  },

  ensureResumeLoaded: async (id) => {
    const local = get().resumes[id];
    if (local) return local;
    try {
      const res = await fetch(`${API_BASE}/${id}`);
      if (!res.ok) return null;
      const { resume } = (await res.json()) as { resume: ResumeData };
      suppressSave = true;
      set((s) => ({ resumes: { ...s.resumes, [resume.id]: resume } }));
      suppressSave = false;
      return resume;
    } catch {
      return null;
    }
  },

  reset: () =>
    set({
      resumes: {},
      activeResumeId: null,
      activeResume: null,
      isLoading: false,
      isSaving: false,
      saveError: false,
    }),

  createResume: (templateId = null, isBlank = false) => {
    const locale =
      typeof document !== "undefined"
        ? document.cookie
            .split("; ")
            .find((row) => row.startsWith("NEXT_LOCALE="))
            ?.split("=")[1] || "id"
        : "id";

    let initialResumeData: any;
    if (isBlank) {
      initialResumeData =
        locale === "en" ? blankResumeStateEn : blankResumeState;
    } else {
      initialResumeData =
        locale === "en" ? initialResumeStateEn : initialResumeState;
    }

    const id = generateUUID();
    const template = templateId
      ? DEFAULT_TEMPLATES.find((t) => t.id === templateId)
      : DEFAULT_TEMPLATES[0];

    const newResume: ResumeData = {
      ...initialResumeData,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      templateId: template?.id,
      title: `${locale === "en" ? "New Resume" : "CV Baru"} ${id.slice(0, 6)}`,
    };

    set((state) => ({
      resumes: {
        ...state.resumes,
        [id]: newResume,
      },
      activeResumeId: id,
      activeResume: newResume,
    }));

    postResume(newResume);

    return id;
  },

  updateResume: (resumeId, data) => {
    set((state) => {
      const resume = state.resumes[resumeId];
      if (!resume) return state;

      const updatedResume = {
        ...resume,
        ...data,
        updatedAt: new Date().toISOString(),
      };

      return {
        resumes: {
          ...state.resumes,
          [resumeId]: updatedResume,
        },
        activeResume:
          state.activeResumeId === resumeId
            ? updatedResume
            : state.activeResume,
      };
    });
    // server save handled by the subscribe (resumes identity changed)
  },

  updateResumeTitle: (title) => {
    const { activeResumeId } = get();
    if (activeResumeId) {
      get().updateResume(activeResumeId, { title });
    }
  },

  deleteResume: (resume) => {
    const resumeId = resume.id;
    cancelSave(resumeId);
    set((state) => {
      const { [resumeId]: _omit, ...rest } = state.resumes;
      return {
        resumes: rest,
        activeResumeId: null,
        activeResume: null,
      };
    });
    deleteResumeOnServer(resumeId);
  },

  duplicateResume: (resumeId) => {
    const newId = generateUUID();
    const originalResume = get().resumes[resumeId];

    const locale =
      typeof document !== "undefined"
        ? document.cookie
            .split("; ")
            .find((row) => row.startsWith("NEXT_LOCALE="))
            ?.split("=")[1] || "id"
        : "id";

    const duplicatedResume = {
      ...originalResume,
      id: newId,
      title: `${originalResume.title} (${
        locale === "en" ? "Copy" : "Salinan"
      })`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      resumes: {
        ...state.resumes,
        [newId]: duplicatedResume,
      },
      activeResumeId: newId,
      activeResume: duplicatedResume,
    }));

    postResume(duplicatedResume);

    return newId;
  },

  setActiveResume: (resumeId) => {
    const resume = get().resumes[resumeId];
    set({ activeResume: resume ?? null, activeResumeId: resumeId });
  },

  updateBasicInfo: (data) => {
    set((state) => {
      if (!state.activeResume) return state;

      const updatedResume = {
        ...state.activeResume,
        updatedAt: new Date().toISOString(),
        basic: {
          ...state.activeResume.basic,
          ...data,
        },
      };

      return {
        resumes: {
          ...state.resumes,
          [state.activeResume.id]: updatedResume,
        },
        activeResume: updatedResume,
      };
    });
    // server save handled by the subscribe
  },

  updateEducation: (education) => {
    const { activeResumeId, resumes } = get();
    if (!activeResumeId) return;

    const currentResume = resumes[activeResumeId];
    const newEducation = currentResume.education.some(
      (e) => e.id === education.id
    )
      ? currentResume.education.map((e) =>
          e.id === education.id ? education : e
        )
      : [...currentResume.education, education];

    get().updateResume(activeResumeId, { education: newEducation });
  },

  updateEducationBatch: (educations) => {
    const { activeResumeId } = get();
    if (activeResumeId) {
      get().updateResume(activeResumeId, { education: educations });
    }
  },

  deleteEducation: (id) => {
    const { activeResumeId } = get();
    if (activeResumeId) {
      const resume = get().resumes[activeResumeId];
      const updatedEducation = resume.education.filter((e) => e.id !== id);
      get().updateResume(activeResumeId, { education: updatedEducation });
    }
  },

  updateExperience: (experience) => {
    const { activeResumeId, resumes } = get();
    if (!activeResumeId) return;

    const currentResume = resumes[activeResumeId];
    const newExperience = currentResume.experience.find(
      (e) => e.id === experience.id
    )
      ? currentResume.experience.map((e) =>
          e.id === experience.id ? experience : e
        )
      : [...currentResume.experience, experience];

    get().updateResume(activeResumeId, { experience: newExperience });
  },

  updateExperienceBatch: (experiences: Experience[]) => {
    const { activeResumeId } = get();
    if (activeResumeId) {
      const updateData = { experience: experiences };
      get().updateResume(activeResumeId, updateData);
    }
  },
  deleteExperience: (id) => {
    const { activeResumeId, resumes } = get();
    if (!activeResumeId) return;

    const currentResume = resumes[activeResumeId];
    const updatedExperience = currentResume.experience.filter(
      (e) => e.id !== id
    );

    get().updateResume(activeResumeId, { experience: updatedExperience });
  },

  updateProjects: (project) => {
    const { activeResumeId, resumes } = get();
    if (!activeResumeId) return;
    const currentResume = resumes[activeResumeId];
    const newProjects = currentResume.projects.some((p) => p.id === project.id)
      ? currentResume.projects.map((p) => (p.id === project.id ? project : p))
      : [...currentResume.projects, project];

    get().updateResume(activeResumeId, { projects: newProjects });
  },

  updateProjectsBatch: (projects: Project[]) => {
    const { activeResumeId } = get();
    if (activeResumeId) {
      const updateData = { projects };
      get().updateResume(activeResumeId, updateData);
    }
  },

  deleteProject: (id) => {
    const { activeResumeId } = get();
    if (!activeResumeId) return;
    const currentResume = get().resumes[activeResumeId];
    const updatedProjects = currentResume.projects.filter((p) => p.id !== id);
    get().updateResume(activeResumeId, { projects: updatedProjects });
  },

  setDraggingProjectId: (id: string | null) => {
    const { activeResumeId } = get();
    if (activeResumeId) {
      get().updateResume(activeResumeId, { draggingProjectId: id });
    }
  },

  updateSkillContent: (skillContent) => {
    const { activeResumeId } = get();
    if (activeResumeId) {
      get().updateResume(activeResumeId, { skillContent });
    }
  },

  updateSelfEvaluationContent: (selfEvaluationContent) => {
    const { activeResumeId } = get();
    if (activeResumeId) {
      get().updateResume(activeResumeId, { selfEvaluationContent });
    }
  },

  reorderSections: (newOrder) => {
    const { activeResumeId, resumes } = get();
    if (activeResumeId) {
      const currentResume = resumes[activeResumeId];
      const basicInfoSection = currentResume.menuSections.find(
        (section) => section.id === "basic"
      );
      const reorderedSections = [
        basicInfoSection,
        ...newOrder.filter((section) => section.id !== "basic"),
      ].map((section, index) => ({
        ...section,
        order: index,
      }));
      get().updateResume(activeResumeId, {
        menuSections: reorderedSections as MenuSection[],
      });
    }
  },

  toggleSectionVisibility: (sectionId) => {
    const { activeResumeId, resumes } = get();
    if (activeResumeId) {
      const currentResume = resumes[activeResumeId];
      const updatedSections = currentResume.menuSections.map((section) =>
        section.id === sectionId
          ? { ...section, enabled: !section.enabled }
          : section
      );
      get().updateResume(activeResumeId, { menuSections: updatedSections });
    }
  },

  setActiveSection: (sectionId) => {
    const { activeResumeId } = get();
    if (activeResumeId) {
      get().updateResume(activeResumeId, { activeSection: sectionId });
    }
  },

  updateMenuSections: (sections) => {
    const { activeResumeId } = get();
    if (activeResumeId) {
      get().updateResume(activeResumeId, { menuSections: sections });
    }
  },

  addCustomData: (sectionId) => {
    const { activeResumeId } = get();
    if (activeResumeId) {
      const currentResume = get().resumes[activeResumeId];
      const updatedCustomData = {
        ...currentResume.customData,
        [sectionId]: [
          {
            id: generateUUID(),
            title: "Modul tanpa nama",
            subtitle: "",
            dateRange: "",
            description: "",
            visible: true,
          },
        ],
      };
      get().updateResume(activeResumeId, { customData: updatedCustomData });
    }
  },

  updateCustomData: (sectionId, items) => {
    const { activeResumeId } = get();
    if (activeResumeId) {
      const currentResume = get().resumes[activeResumeId];
      const updatedCustomData = {
        ...currentResume.customData,
        [sectionId]: items,
      };
      get().updateResume(activeResumeId, { customData: updatedCustomData });
    }
  },

  removeCustomData: (sectionId) => {
    const { activeResumeId } = get();
    if (activeResumeId) {
      const currentResume = get().resumes[activeResumeId];
      const { [sectionId]: _omit, ...rest } = currentResume.customData;
      get().updateResume(activeResumeId, { customData: rest });
    }
  },

  addCustomItem: (sectionId) => {
    const { activeResumeId } = get();
    if (activeResumeId) {
      const currentResume = get().resumes[activeResumeId];
      const updatedCustomData = {
        ...currentResume.customData,
        [sectionId]: [
          ...(currentResume.customData[sectionId] || []),
          {
            id: generateUUID(),
            title: "Modul tanpa nama",
            subtitle: "",
            dateRange: "",
            description: "",
            visible: true,
          },
        ],
      };
      get().updateResume(activeResumeId, { customData: updatedCustomData });
    }
  },

  updateCustomItem: (sectionId, itemId, updates) => {
    const { activeResumeId } = get();
    if (activeResumeId) {
      const currentResume = get().resumes[activeResumeId];
      const updatedCustomData = {
        ...currentResume.customData,
        [sectionId]: currentResume.customData[sectionId].map((item) =>
          item.id === itemId ? { ...item, ...updates } : item
        ),
      };
      get().updateResume(activeResumeId, { customData: updatedCustomData });
    }
  },

  removeCustomItem: (sectionId, itemId) => {
    const { activeResumeId } = get();
    if (activeResumeId) {
      const currentResume = get().resumes[activeResumeId];
      const updatedCustomData = {
        ...currentResume.customData,
        [sectionId]: currentResume.customData[sectionId].filter(
          (item) => item.id !== itemId
        ),
      };
      get().updateResume(activeResumeId, { customData: updatedCustomData });
    }
  },

  addCertificate: (certificate) => {
    const { activeResumeId, resumes } = get();
    if (!activeResumeId) return;

    const currentResume = resumes[activeResumeId];
    const newCertificates = currentResume.certificates.some(
      (c) => c.id === certificate.id
    )
      ? currentResume.certificates.map((c) =>
          c.id === certificate.id ? certificate : c
        )
      : [...currentResume.certificates, certificate];

    get().updateResume(activeResumeId, { certificates: newCertificates });
  },

  updateCertificate: (id, updates) => {
    const { activeResumeId, resumes } = get();
    if (!activeResumeId) return;

    const currentResume = resumes[activeResumeId];
    const newCertificates = currentResume.certificates.map((c) =>
      c.id === id ? { ...c, ...updates } : c
    );

    get().updateResume(activeResumeId, { certificates: newCertificates });
  },

  updateCertificatesBatch: (certificates) => {
    const { activeResumeId } = get();
    if (activeResumeId) {
      get().updateResume(activeResumeId, { certificates });
    }
  },

  removeCertificate: (id) => {
    const { activeResumeId, resumes } = get();
    if (!activeResumeId) return;

    const currentResume = resumes[activeResumeId];
    const updatedCertificates = currentResume.certificates.filter(
      (c) => c.id !== id
    );

    get().updateResume(activeResumeId, { certificates: updatedCertificates });
  },

  updateGlobalSettings: (settings: Partial<GlobalSettings>) => {
    const { activeResumeId, updateResume, activeResume } = get();
    if (activeResumeId) {
      updateResume(activeResumeId, {
        globalSettings: {
          ...activeResume?.globalSettings,
          ...settings,
        },
      });
    }
  },

  setThemeColor: (color) => {
    const { activeResumeId, updateResume } = get();
    if (activeResumeId) {
      updateResume(activeResumeId, {
        globalSettings: {
          ...get().activeResume?.globalSettings,
          themeColor: color,
        },
      });
    }
  },

  setTemplate: (templateId) => {
    const { activeResumeId, resumes } = get();
    if (!activeResumeId) return;

    const template = DEFAULT_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;

    const updatedResume = {
      ...resumes[activeResumeId],
      updatedAt: new Date().toISOString(),
      templateId,
      globalSettings: {
        ...resumes[activeResumeId].globalSettings,
        themeColor: template.colorScheme.primary,
        sectionSpacing: template.spacing.sectionGap,
        paragraphSpacing: template.spacing.itemGap,
        pagePadding: template.spacing.contentPadding,
      },
      basic: {
        ...resumes[activeResumeId].basic,
        layout: template.basic.layout,
      },
    };

    set({
      resumes: {
        ...resumes,
        [activeResumeId]: updatedResume,
      },
      activeResume: updatedResume,
    });
    // server save handled by the subscribe
  },
  addResume: (resume: ResumeData) => {
    set((state) => ({
      resumes: {
        ...state.resumes,
        [resume.id]: resume,
      },
      activeResumeId: resume.id,
      activeResume: resume,
    }));

    postResume(resume);
    return resume.id;
  },
}));

// Autosave: any change to an existing/new resume's content schedules a debounced PUT.
// Skipped while applying server data (suppressSave) and for delete (handled explicitly).
useResumeStore.subscribe((state, prev) => {
  if (suppressSave) return;
  if (state.resumes === prev.resumes) return;
  for (const id in state.resumes) {
    if (prev.resumes[id] !== state.resumes[id]) scheduleSave(id);
  }
});
