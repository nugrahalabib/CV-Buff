import { useEffect, useMemo, useState } from "react";
import { Check, ExternalLink, Plus, Trash2, Sparkles, Cpu } from "lucide-react";
import { useTranslations } from "@/i18n/compat/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import IconOpenAi from "@/components/ai/icon/IconOpenAi";
import IconClaude from "@/components/ai/icon/IconClaude";
import IconGemini from "@/components/ai/icon/IconGemini";
import { useAIConfigStore } from "@/store/useAIConfigStore";
import {
  type ProviderDefinition,
  type ProviderProtocol,
  isProviderConfigured,
} from "@/config/ai/types";
import { cn } from "@/lib/utils";

type IconLike = React.FC<{ size?: number; className?: string }>;

const PROVIDER_ICONS: Record<string, IconLike> = {
  openai: IconOpenAi as IconLike,
  claude: IconClaude as IconLike,
  gemini: IconGemini as IconLike,
};

const FALLBACK_ICON: IconLike = (props) => <Cpu {...props} />;

const PROVIDER_COLOR: Record<string, string> = {
  openai: "text-emerald-600",
  claude: "text-amber-700",
  gemini: "text-sky-600",
};

const AISettingsPage = () => {
  const t = useTranslations();
  const providers = useAIConfigStore((s) => s.providers);
  const activeProviderId = useAIConfigStore((s) => s.activeProviderId);
  const setActive = useAIConfigStore((s) => s.setActive);
  const updateProvider = useAIConfigStore((s) => s.updateProvider);
  const addCustomProvider = useAIConfigStore((s) => s.addCustomProvider);
  const removeProvider = useAIConfigStore((s) => s.removeProvider);

  const [viewingId, setViewingId] = useState<string>(activeProviderId);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (!providers.some((p) => p.id === viewingId)) {
      setViewingId(activeProviderId);
    }
  }, [providers, activeProviderId, viewingId]);

  const viewing = useMemo(
    () => providers.find((p) => p.id === viewingId),
    [providers, viewingId]
  );

  const handleAddCustom = () => {
    const id = addCustomProvider({
      name: "Provider Custom",
      protocol: "openai-compatible",
      endpoint: "",
      models: [],
      authHeader: "bearer",
    });
    setViewingId(id);
    setShowAdvanced(true);
  };

  const handleRemove = (id: string) => {
    removeProvider(id);
    setViewingId(activeProviderId);
  };

  const renderProviderIcon = (p: ProviderDefinition) => {
    const Icon = PROVIDER_ICONS[p.id] || FALLBACK_ICON;
    return <Icon className="h-5 w-5" />;
  };

  return (
    <div className="mx-auto py-4 px-4">
      <div className="flex gap-8">
        <div className="w-72 space-y-2">
          <h2 className="px-2 mb-2 text-sm font-medium text-muted-foreground">
            {t("dashboard.settings.ai.selectModel")}
          </h2>
          <div className="flex flex-col gap-1">
            {providers.map((p) => {
              const isActive = activeProviderId === p.id;
              const isViewing = viewingId === p.id;
              const configured = isProviderConfigured(p);
              return (
                <div
                  key={p.id}
                  onClick={() => setViewingId(p.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left border",
                    "transition-all duration-200 cursor-pointer",
                    "hover:bg-primary/10 hover:border-primary/30",
                    isViewing
                      ? "bg-primary/10 border-primary/40"
                      : "border-transparent"
                  )}
                >
                  <div
                    className={cn(
                      "shrink-0",
                      isViewing ? "text-primary" : PROVIDER_COLOR[p.id] || "text-muted-foreground"
                    )}
                  >
                    {renderProviderIcon(p)}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col items-start">
                    <span className={cn("font-medium text-sm truncate", isViewing && "text-primary")}>
                      {p.name}
                    </span>
                    <span className="text-xs text-muted-foreground truncate w-full">
                      {configured ? t("common.configured") : t("common.notConfigured")}
                    </span>
                  </div>
                  <button
                    type="button"
                    aria-label={`Set ${p.name} as active`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActive(p.id);
                    }}
                    className={cn(
                      "h-6 w-6 rounded-md flex items-center justify-center border transition-all shrink-0",
                      isActive
                        ? "bg-primary border-primary text-primary-foreground"
                        : "bg-transparent border-muted-foreground/40 text-transparent hover:border-primary/40"
                    )}
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleAddCustom}
            className="w-full mt-3 justify-start gap-2 border-dashed"
          >
            <Plus className="h-4 w-4" />
            {t("dashboard.settings.ai.addCustomProvider")}
          </Button>
        </div>

        <div className="flex-1 max-w-2xl">
          {viewing && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <span className={cn("shrink-0", PROVIDER_COLOR[viewing.id] || "text-muted-foreground")}>
                    {renderProviderIcon(viewing)}
                  </span>
                  {viewing.name}
                  {!viewing.builtIn && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemove(viewing.id)}
                      title={t("dashboard.settings.ai.removeProvider")}
                      className="ml-2 h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </h2>
                <p className="mt-2 text-muted-foreground text-sm">
                  {viewing.builtIn && viewing.id === "openai"
                    ? t("dashboard.settings.ai.openai.description")
                    : viewing.builtIn && viewing.id === "claude"
                      ? t("dashboard.settings.ai.claude.description")
                      : viewing.builtIn && viewing.id === "gemini"
                        ? t("dashboard.settings.ai.gemini.description")
                        : t("dashboard.settings.ai.custom.description")}
                </p>
              </div>

              <div className="space-y-6">
                {!viewing.builtIn && (
                  <div className="space-y-3">
                    <Label className="text-base font-medium">
                      {t("dashboard.settings.ai.fields.name")}
                    </Label>
                    <Input
                      value={viewing.name}
                      onChange={(e) =>
                        updateProvider(viewing.id, { name: e.target.value })
                      }
                      placeholder={t("dashboard.settings.ai.custom.namePlaceholder")}
                      className="h-11"
                    />
                  </div>
                )}

                {!viewing.builtIn && (
                  <div className="space-y-3">
                    <Label className="text-base font-medium">
                      {t("dashboard.settings.ai.fields.protocol")}
                    </Label>
                    <Select
                      value={viewing.protocol}
                      onValueChange={(value) =>
                        updateProvider(viewing.id, {
                          protocol: value as ProviderProtocol,
                          authHeader:
                            value === "anthropic"
                              ? "x-api-key"
                              : value === "gemini"
                                ? "x-goog-api-key"
                                : "bearer",
                          customHeaders:
                            value === "anthropic"
                              ? { "anthropic-version": "2023-06-01" }
                              : undefined,
                        })
                      }
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai-compatible">
                          {t("dashboard.settings.ai.protocols.openai-compatible")}
                        </SelectItem>
                        <SelectItem value="anthropic">
                          {t("dashboard.settings.ai.protocols.anthropic")}
                        </SelectItem>
                        <SelectItem value="gemini">
                          {t("dashboard.settings.ai.protocols.gemini")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">
                      {t("dashboard.settings.ai.fields.apiKey")}
                    </Label>
                    {viewing.apiKeyHelpUrl && (
                      <a
                        href={viewing.apiKeyHelpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                      >
                        {t("dashboard.settings.ai.getApiKey")}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <Input
                    value={viewing.apiKey || ""}
                    onChange={(e) =>
                      updateProvider(viewing.id, { apiKey: e.target.value })
                    }
                    type="password"
                    placeholder={t("dashboard.settings.ai.fields.apiKey")}
                    className="h-11"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    {t("dashboard.settings.ai.fields.modelId")}
                  </Label>
                  {viewing.models && viewing.models.length > 0 ? (
                    <div className="space-y-2">
                      <Select
                        value={viewing.selectedModel || viewing.defaultModel || ""}
                        onValueChange={(value) =>
                          updateProvider(viewing.id, { selectedModel: value })
                        }
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder={t("dashboard.settings.ai.fields.modelId")} />
                        </SelectTrigger>
                        <SelectContent>
                          {viewing.models.map((m) => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={viewing.selectedModel || ""}
                        onChange={(e) =>
                          updateProvider(viewing.id, { selectedModel: e.target.value })
                        }
                        placeholder={`Custom model (override): ${viewing.defaultModel || ""}`}
                        className="h-11 text-sm"
                      />
                    </div>
                  ) : (
                    <Input
                      value={viewing.selectedModel || ""}
                      onChange={(e) =>
                        updateProvider(viewing.id, { selectedModel: e.target.value })
                      }
                      placeholder={t("dashboard.settings.ai.fields.modelId")}
                      className="h-11"
                    />
                  )}
                </div>

                {(showAdvanced || !viewing.builtIn) && (
                  <div className="space-y-3">
                    <Label className="text-base font-medium">
                      {t("dashboard.settings.ai.fields.endpoint")}
                    </Label>
                    <Input
                      value={viewing.endpoint}
                      onChange={(e) =>
                        updateProvider(viewing.id, { endpoint: e.target.value })
                      }
                      placeholder={t("dashboard.settings.ai.custom.endpointPlaceholder")}
                      className="h-11 font-mono text-sm"
                    />
                  </div>
                )}

                {(showAdvanced || !viewing.builtIn) && (
                  <div className="space-y-3">
                    <Label className="text-base font-medium">
                      {t("dashboard.settings.ai.fields.customHeaders")}
                    </Label>
                    <Input
                      value={
                        viewing.customHeaders
                          ? JSON.stringify(viewing.customHeaders)
                          : ""
                      }
                      onChange={(e) => {
                        const raw = e.target.value.trim();
                        if (!raw) {
                          updateProvider(viewing.id, { customHeaders: undefined });
                          return;
                        }
                        try {
                          const parsed = JSON.parse(raw);
                          if (parsed && typeof parsed === "object") {
                            updateProvider(viewing.id, { customHeaders: parsed });
                          }
                        } catch {
                          // ignore parse errors during typing
                        }
                      }}
                      placeholder='{"x-custom-header":"value"}'
                      className="h-11 font-mono text-sm"
                    />
                  </div>
                )}

                {viewing.builtIn && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvanced((v) => !v)}
                    className="text-muted-foreground"
                  >
                    {showAdvanced ? "−" : "+"} {t("dashboard.settings.ai.advancedToggle")}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export const runtime = "edge";

export default AISettingsPage;
