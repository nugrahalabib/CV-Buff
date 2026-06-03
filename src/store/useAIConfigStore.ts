import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  type ProviderDefinition,
  type ProviderProtocol,
  isProviderConfigured,
} from "@/config/ai/types";
import { BUILTIN_PROVIDERS, DEFAULT_PROVIDER_ID, cloneBuiltins } from "@/config/ai/builtin";
import { generateUUID } from "@/utils/uuid";

interface AIConfigState {
  /** All providers — built-in + user-defined custom */
  providers: ProviderDefinition[];
  /** Currently selected provider id */
  activeProviderId: string;

  setActive: (id: string) => void;
  getActive: () => ProviderDefinition | undefined;
  getProvider: (id: string) => ProviderDefinition | undefined;

  updateProvider: (id: string, patch: Partial<ProviderDefinition>) => void;
  addCustomProvider: (
    init: Partial<Omit<ProviderDefinition, "id" | "builtIn">> & { name: string; protocol: ProviderProtocol }
  ) => string;
  removeProvider: (id: string) => void;
  resetProvider: (id: string) => void;

  isConfigured: () => boolean;
}

const seedProviders = (): ProviderDefinition[] => cloneBuiltins();

const ensureBuiltins = (providers: ProviderDefinition[] | undefined): ProviderDefinition[] => {
  const list = providers && providers.length > 0 ? [...providers] : seedProviders();
  // Make sure every built-in is present (even if persisted state is older)
  for (const builtin of BUILTIN_PROVIDERS) {
    if (!list.some((p) => p.id === builtin.id)) {
      list.unshift({ ...builtin, customHeaders: builtin.customHeaders ? { ...builtin.customHeaders } : undefined, models: [...builtin.models] });
    }
  }
  return list;
};

export const useAIConfigStore = create<AIConfigState>()(
  persist(
    (set, get) => ({
      providers: seedProviders(),
      activeProviderId: DEFAULT_PROVIDER_ID,

      setActive: (id: string) => set({ activeProviderId: id }),

      getActive: () => {
        const { providers, activeProviderId } = get();
        return providers.find((p) => p.id === activeProviderId);
      },

      getProvider: (id: string) => get().providers.find((p) => p.id === id),

      updateProvider: (id, patch) => {
        set((state) => ({
          providers: state.providers.map((p) =>
            p.id === id ? { ...p, ...patch } : p
          ),
        }));
      },

      addCustomProvider: (init) => {
        const id = `custom-${generateUUID().slice(0, 8)}`;
        const provider: ProviderDefinition = {
          id,
          name: init.name,
          protocol: init.protocol,
          builtIn: false,
          endpoint: init.endpoint || "",
          models: init.models || [],
          defaultModel: init.defaultModel,
          authHeader:
            init.authHeader ||
            (init.protocol === "anthropic"
              ? "x-api-key"
              : init.protocol === "gemini"
                ? "x-goog-api-key"
                : "bearer"),
          customHeaders: init.customHeaders,
          apiKey: init.apiKey || "",
          selectedModel: init.selectedModel,
          apiKeyHelpUrl: init.apiKeyHelpUrl,
        };
        set((state) => ({ providers: [...state.providers, provider] }));
        return id;
      },

      removeProvider: (id: string) => {
        set((state) => {
          const target = state.providers.find((p) => p.id === id);
          if (!target || target.builtIn) return state;
          const remaining = state.providers.filter((p) => p.id !== id);
          const nextActive =
            state.activeProviderId === id ? DEFAULT_PROVIDER_ID : state.activeProviderId;
          return { providers: remaining, activeProviderId: nextActive };
        });
      },

      resetProvider: (id: string) => {
        const builtin = BUILTIN_PROVIDERS.find((p) => p.id === id);
        if (!builtin) return;
        set((state) => ({
          providers: state.providers.map((p) =>
            p.id === id
              ? {
                  ...builtin,
                  apiKey: p.apiKey,
                  selectedModel: p.selectedModel,
                  customHeaders: builtin.customHeaders ? { ...builtin.customHeaders } : undefined,
                  models: [...builtin.models],
                }
              : p
          ),
        }));
      },

      isConfigured: () => {
        const active = get().getActive();
        return isProviderConfigured(active);
      },
    }),
    {
      name: "cv-buff-ai-config",
      version: 2,
      migrate: (persistedState: any) => {
        // Always re-seed if older shape detected
        if (!persistedState || !Array.isArray(persistedState.providers)) {
          return {
            providers: seedProviders(),
            activeProviderId: DEFAULT_PROVIDER_ID,
          };
        }
        return {
          ...persistedState,
          providers: ensureBuiltins(persistedState.providers),
        };
      },
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<AIConfigState>;
        const providers = ensureBuiltins(persisted.providers);
        const activeProviderId =
          persisted.activeProviderId &&
          providers.some((p) => p.id === persisted.activeProviderId)
            ? persisted.activeProviderId
            : DEFAULT_PROVIDER_ID;
        return {
          ...currentState,
          providers,
          activeProviderId,
        };
      },
    }
  )
);
