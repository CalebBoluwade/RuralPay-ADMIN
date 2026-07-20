"use client"

import React, { useState, useRef, useCallback } from "react";
import NextImage from "next/image";
import {
  Smartphone,
  Palette,
  Save,
  Globe,
  Zap,
  Search,
  Bell,
  Layers,
  Upload,
  AppWindow,
  Image as ImageIcon,
  Settings,
  Sun,
  Moon,
  ArrowRight,
  CreditCard,
  Wifi,
  WifiOff,
  Rocket,
  SignalHigh,
  BatteryFull,
} from "lucide-react";
import { toast } from "sonner";
import { useCreateTenantMutation, useGetTenantsQuery, useGetTenantByIdQuery, useUpdateTenantConfigMutation, useUploadTenantAssetsMutation, useDeployTenantConfigMutation, type TenantConfig } from "@/lib/store/api";

type PreviewScreen = "Home" | "Transactions" | "Splash";

export default function ConfigPage() {
  const { data: tenantsResponse, isFetching: fetchingTenants } = useGetTenantsQuery();
  const [createTenant, { isLoading: creating }] = useCreateTenantMutation();

  const fetchedTenants = tenantsResponse?.details ?? [];

  const [selectedTenantId, setSelectedTenantId] = useState("");
  const activeTenantId = selectedTenantId || fetchedTenants[0]?.tenantId || "";
  const { data: tenantByIdResponse, isFetching: fetchingConfig } = useGetTenantByIdQuery(
    { tenantId: activeTenantId },
    { skip: !activeTenantId }
  );

  const tenantConfig = tenantByIdResponse?.details;

//   console.log(fetchedTenants, "cfsgsfs", tenantConfig, "fgds", tenantByIdResponse)

  const defaultTenant = {
    id: activeTenantId,
    appName: tenantConfig?.appName ?? "RuralPay",
    domain: tenantConfig?.bundleIdentifier,
    bundleIdentifier: tenantConfig?.bundleIdentifier ?? fetchedTenants.find(t => t.tenantId === activeTenantId)?.bundleIdentifier,
    currency: tenantConfig?.currency ?? "₦",
    currencyCode: tenantConfig?.currencyCode ?? "NGN",
    logo: tenantConfig?.assets?.appLogo ?? "",
    appIcon: tenantConfig?.assets?.appIcon ?? "",
    splashImage: tenantConfig?.assets?.splashScreen ?? "",
    theme: {
      primary: tenantConfig?.colors?.primary ?? "#4f46e5",
      secondary: tenantConfig?.colors?.accent ?? "#3730a3",
      mode: "light" as "light" | "dark",
      radius: "rounded-xl",
    },
    features: {
      transfers: true,
      offlineMode: tenantConfig?.features?.bluetooth ?? false,
      nfcPayment: tenantConfig?.features?.nfc ?? false,
      multiAccountLinking: false,
    },
  };

  const [localOverrides, setLocalOverrides] = useState<Record<string, Record<string, unknown>>>({});
  const [assetFiles, setAssetFiles] = useState<{ splash_screen?: File; app_logo?: File; app_icon?: File }>({});

  const tenantOverrides = localOverrides[activeTenantId] ?? {};
  const activeTenant = {
    ...defaultTenant,
    ...tenantOverrides,
    theme: { ...defaultTenant.theme, ...(tenantOverrides.theme as object ?? {}) },
    features: { ...defaultTenant.features, ...(tenantOverrides.features as object ?? {}) },
  } as typeof defaultTenant;

  const [isHoveringPhone, setIsHoveringPhone] = useState(false);
  const [previewScreen, setPreviewScreen] = useState<PreviewScreen>("Home");
  const [mouseRotation, setMouseRotation] = useState({ x: 0, y: 0 });
  const previewRef = useRef<HTMLDivElement>(null);

  const handleCreateTenant = async () => {
    const name = prompt("Enter new tenant app name:");
    if (!name) return;
    await createTenant({ appName: name });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const x = ((e.clientY - rect.top) / rect.height - 0.5) * 10;
    const y = ((e.clientX - rect.left) / rect.width - 0.5) * -15;
    setMouseRotation({ x, y });
  }, [setMouseRotation]);

  const updateActiveTenant = (updates: Record<string, unknown>) => {
    setLocalOverrides((prev) => ({
      ...prev,
      [activeTenantId]: { ...(prev[activeTenantId] ?? {}), ...updates },
    }));
  };

  const updateTheme = (themeUpdates: Record<string, unknown>) => {
    updateActiveTenant({ theme: { ...activeTenant.theme, ...themeUpdates } });
  };

  const updateFeatures = (featureKey: keyof typeof activeTenant.features) => {
    updateActiveTenant({
      features: {
        ...activeTenant.features,
        [featureKey]: !activeTenant.features[featureKey],
      },
    });
  };

  const [updateTenantConfig, { isLoading: saving }] = useUpdateTenantConfigMutation();
  const [uploadTenantAssets, { isLoading: uploadingAssets }] = useUploadTenantAssetsMutation();
  const [deployTenant, { isLoading: deploying }] = useDeployTenantConfigMutation();

  const isBusy = saving || uploadingAssets || deploying || creating || fetchingTenants || fetchingConfig;

  const handleSave = async () => {
    const payload: TenantConfig = {
      appName: activeTenant.appName,
      bundleIdentifier: activeTenant.bundleIdentifier!,
      colors: {
        primary: activeTenant.theme.primary,
        accent: activeTenant.theme.secondary,
      },
      features: {
        nfc: activeTenant.features.nfcPayment,
        bluetooth: activeTenant.features.offlineMode,
      },
    };
    await updateTenantConfig({ tenantId: activeTenant.id, body: payload });
  };

  const handleUploadAssets = async () => {
    const hasAssets = Object.values(assetFiles).some(Boolean);
    if (!hasAssets) {
      toast.error("No assets selected to upload.");
      return;
    }
    const formData = new FormData();
    if (assetFiles.splash_screen) formData.append("splash_screen", assetFiles.splash_screen);
    if (assetFiles.app_logo) formData.append("app_logo", assetFiles.app_logo);
    if (assetFiles.app_icon) formData.append("app_icon", assetFiles.app_icon);
    await uploadTenantAssets({ tenantId: activeTenant.id, formData });
    setAssetFiles({});
  };

  const handleDeploy = async () => {
    const missingAssets = !activeTenant.logo && !assetFiles.app_logo;
    const missingSplash = !activeTenant.splashImage && !assetFiles.splash_screen;
    if (missingAssets || missingSplash) {
      toast.error("App Logo and Splash Screen are required before deploying.");
      return;
    }
    await deployTenant(activeTenant.id);
  };

  return (
    <>
        {/* Loading overlay */}
        {isBusy && (
          <div className="fixed inset-0 z-50 bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-lime-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium text-slate-600">
                {fetchingTenants || fetchingConfig ? "Loading..." : saving || uploadingAssets ? "Saving..." : deploying ? "Deploying..." : "Processing..."}
              </span>
            </div>
          </div>
        )}

        {/* HEADER */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10 shrink-0">
          <h1 className="text-xl font-semibold text-slate-800 capitalize">
            Application Configuration
          </h1>
          <div className="flex items-center gap-4 text-slate-500">
            <Search
              size={20}
              className="cursor-pointer hover:text-slate-800 transition-colors"
            />
            <Bell
              size={20}
              className="cursor-pointer hover:text-slate-800 transition-colors"
            />
          </div>
        </header>

        {/* WORKSPACE & PREVIEW SPLIT */}
        <div className="flex-1 flex overflow-hidden">
          {/* CONFIGURATION PANEL */}
          <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
            <div className="space-y-8">
              {/* Tenant Selector */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Globe className="text-lime-500" size={20} /> Select Active Tenant
                </h2>
                <div className="grid grid-cols-3 gap-4">
                  {fetchedTenants.map((tenant) => (
                    <button
                      key={tenant.tenantId}
                      onClick={() => setSelectedTenantId(tenant.tenantId)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        activeTenantId === tenant.tenantId
                          ? "border-lime-500 bg-lime-50/50 shadow-md transform scale-[1.02]"
                          : "border-slate-100 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="font-semibold text-slate-800">
                        {tenant.appName}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 break-all">
                        {tenant.bundleIdentifier}
                      </div>
                    </button>
                  ))}
                  <button
                    onClick={handleCreateTenant}
                    disabled={creating}
                    className="p-4 rounded-xl border-2 border-dashed border-slate-300 text-left hover:border-lime-400 transition-all flex items-center justify-center text-sm text-slate-500 hover:text-lime-600 disabled:opacity-50"
                  >
                    {creating ? "Creating..." : "+ New Tenant"}
                  </button>
                </div>
              </div>

              {/* Theme Configuration */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all duration-500">
                <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <Palette className="text-pink-500" size={20} /> Whitelabel
                  Theme
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Primary Brand Color
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="color"
                        value={activeTenant.theme.primary}
                        onChange={(e) =>
                          updateTheme({ primary: e.target.value })
                        }
                        className="w-12 h-12 rounded cursor-pointer border-0 p-0"
                      />
                      <input
                        type="text"
                        value={activeTenant.theme.primary}
                        onChange={(e) =>
                          updateTheme({ primary: e.target.value })
                        }
                        className="flex-1 p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-lime-500 outline-none uppercase font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Secondary Brand Color
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="color"
                        value={activeTenant.theme.secondary}
                        onChange={(e) =>
                          updateTheme({ secondary: e.target.value })
                        }
                        className="w-12 h-12 rounded cursor-pointer border-0 p-0"
                      />
                      <input
                        type="text"
                        value={activeTenant.theme.secondary}
                        onChange={(e) =>
                          updateTheme({ secondary: e.target.value })
                        }
                        className="flex-1 p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-lime-500 outline-none uppercase font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      App Mode
                    </label>
                    <div className="flex gap-3">
                      {(["light", "dark"] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => updateTheme({ mode })}
                          className={`flex-1 py-2 text-sm font-medium border-2 rounded-lg flex items-center justify-center gap-2 ${
                            activeTenant.theme.mode === mode
                              ? "border-lime-500 text-lime-700 bg-lime-50"
                              : "border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          {mode === "light" ? <Sun size={14} /> : <Moon size={14} />}
                          {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      UI Border Radius
                    </label>
                    <div className="flex gap-3">
                      {[
                        "rounded-none",
                        "rounded-md",
                        "rounded-xl",
                        "rounded-3xl",
                      ].map((radius) => (
                        <button
                          key={radius}
                          onClick={() => updateTheme({ radius })}
                          className={`flex-1 py-2 text-sm font-medium border-2 ${
                            activeTenant.theme.radius === radius
                              ? "border-lime-500 text-lime-700 bg-lime-50"
                              : "border-slate-200 text-slate-600 hover:border-slate-300"
                          } ${radius}`}
                        >
                          {radius.split("-")[1] || "none"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Assets Upload */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <ImageIcon className="text-lime-500" size={20} /> App Assets
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Logo + Icon */}
                  <div className="flex flex-wrap gap-4 p-4 border border-slate-100 rounded-xl bg-slate-50/50">
                    {/* App Logo */}
                    <div className="flex items-center gap-4">
                      {activeTenant.logo ? (
                        <NextImage src={activeTenant.logo} alt="Tenant logo" width={120} height={120} className="w-32 h-32 object-contain rounded-lg border border-slate-200 shrink-0" />
                      ) : (
                        <div className="w-32 h-32 shrink-0 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                          <Upload size={22} />
                        </div>
                      )}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-sm font-medium text-slate-700">App Logo</span>
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer flex items-center gap-1.5 text-xs bg-lime-50 text-lime-700 px-3 py-1.5 rounded-lg hover:bg-lime-100 transition-colors font-medium">
                            <Upload size={12} />
                            {activeTenant.logo ? "Change" : "Upload"}
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setAssetFiles((prev) => ({ ...prev, app_logo: file }));
                                const reader = new FileReader();
                                reader.onloadend = () => updateActiveTenant({ logo: reader.result as string });
                                reader.readAsDataURL(file);
                              }
                            }} />
                          </label>
                          {activeTenant.logo && (
                            <button onClick={() => updateActiveTenant({ logo: "" })} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="border-l border-slate-100" />
                    {/* App Icon */}
                    <div className="flex items-center gap-4">
                      {activeTenant.appIcon ? (
                        <NextImage src={activeTenant.appIcon} alt="App icon" width={120} height={120} className="w-32 h-32 object-contain rounded-2xl border border-slate-200 shrink-0" />
                      ) : (
                        <div className="w-32 h-32 shrink-0 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                          <Upload size={22} />
                        </div>
                      )}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-sm font-medium text-slate-700">App Icon</span>
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer flex items-center gap-1.5 text-xs bg-lime-50 text-lime-700 px-3 py-1.5 rounded-lg hover:bg-lime-100 transition-colors font-medium">
                            <Upload size={12} />
                            {activeTenant.appIcon ? "Change" : "Upload"}
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setAssetFiles((prev) => ({ ...prev, app_icon: file }));
                                const reader = new FileReader();
                                reader.onloadend = () => updateActiveTenant({ appIcon: reader.result as string });
                                reader.readAsDataURL(file);
                              }
                            }} />
                          </label>
                          {activeTenant.appIcon && (
                            <button onClick={() => updateActiveTenant({ appIcon: "" })} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">Recommended: 1024×1024px</p>
                      </div>
                    </div>
                  </div>
                  {/* Splash Screen */}
                  <div className="flex flex-col items-center gap-3 p-4 border border-slate-100 rounded-xl bg-slate-50/50">
                    {activeTenant.splashImage ? (
                      <NextImage src={activeTenant.splashImage} alt="Splash screen" width={128} height={280} className="w-48 h-70 object-cover rounded-xl border border-slate-200" />
                    ) : (
                      <div className="w-48 h-70 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 gap-2">
                        <Upload size={20} />
                        <span className="text-xs">No Splash</span>
                      </div>
                    )}
                    <span className="text-sm font-medium text-slate-700">Splash Screen</span>
                    <label className="cursor-pointer flex items-center gap-2 text-sm bg-lime-50 text-lime-700 px-4 py-2 rounded-lg hover:bg-lime-100 transition-colors font-medium">
                      <Upload size={14} />
                      {activeTenant.splashImage ? "Change" : "Upload"}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setAssetFiles((prev) => ({ ...prev, splash_screen: file }));
                          const reader = new FileReader();
                          reader.onloadend = () => updateActiveTenant({ splashImage: reader.result as string });
                          reader.readAsDataURL(file);
                        }
                      }} />
                    </label>
                    {activeTenant.splashImage && (
                      <button onClick={() => updateActiveTenant({ splashImage: "" })} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                    )}
                    <p className="text-xs text-slate-400">Recommended: 1242×2688px</p>
                  </div>
                </div>
              </div>

              {/* App Identity */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <AppWindow className="text-lime-500" size={20} /> App Identity
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">App Name</label>
                    <input
                      type="text"
                      value={activeTenant.appName}
                      onChange={(e) => updateActiveTenant({ appName: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-lime-500 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Slug</label>
                    <input
                      type="text"
                      value={activeTenant.id}
                      onChange={(e) => updateActiveTenant({ slug: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-lime-500 outline-none text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Bundle Identifier</label>
                    <input
                      type="text"
                      value={activeTenant.bundleIdentifier}
                      onChange={(e) => updateActiveTenant({ bundleIdentifier: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-lime-500 outline-none text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Feature Flags */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <Layers className="text-yellow-500" size={20} /> Feature Toggles
                </h2>
                <div className="space-y-4">
                  {([
                    { key: "transfers", label: "P2P Transfers", description: "Allow users to send money to other users on the same tenant." },
                    { key: "offlineMode", label: "Offline Mesh Network", description: "Enable Bluetooth offline transaction queuing (RuralPay specific)." },
                    { key: "nfcPayment", label: "NFC Merchant Card Payment", description: "Enable NFC tap-to-pay for merchant card transactions." },
                    { key: "multiAccountLinking", label: "Multi-Account Linking", description: "Allow users to link and manage multiple accounts." },
                  ] as const).map((item) => (
                    <ToggleItem
                      key={item.key}
                      label={item.label}
                      description={item.description}
                      checked={activeTenant.features[item.key]}
                      onChange={() => updateFeatures(item.key)}
                    />
                  ))}
                </div>
              </div>

              {/* Save & Deploy */}
              <div className="flex gap-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 text-sm bg-slate-900 text-white px-4 py-3 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  <Save size={16} /> {saving ? "Saving..." : "Save Config"}
                </button>
                <button
                  onClick={handleUploadAssets}
                  disabled={uploadingAssets || !Object.values(assetFiles).some(Boolean)}
                  className="flex-1 flex items-center justify-center gap-2 text-sm bg-lime-600 text-white px-4 py-3 rounded-xl hover:bg-lime-500 transition-colors disabled:opacity-50"
                >
                  <Upload size={16} /> {uploadingAssets ? "Uploading..." : "Upload Assets"}
                </button>
                <button
                  onClick={handleDeploy}
                  disabled={deploying}
                  className="flex-1 flex items-center justify-center gap-2 text-sm bg-lime-600 text-white px-4 py-3 rounded-xl hover:bg-lime-500 transition-colors disabled:opacity-50"
                >
                  <Rocket size={16} /> {deploying ? "Deploying..." : "Deploy App"}
                </button>
              </div>
            </div>
          </div>

          {/* 3D LIVE PREVIEW PANEL */}
          <div
            ref={previewRef}
            className="w-112.5 bg-slate-200/50 border-l border-slate-200 flex flex-col items-center justify-center p-8 relative"
            style={{ perspective: "1200px" }}
            onMouseEnter={() => setIsHoveringPhone(true)}
            onMouseLeave={() => { setIsHoveringPhone(false); setMouseRotation({ x: 0, y: 0 }); }}
            onMouseMove={handleMouseMove}
          >
            {/* Screen Switcher */}
            <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
              <div className="flex gap-1 bg-white rounded-full p-1 shadow-sm">
                {(["Home", "Transactions", "Splash"] as const).map((screen) => (
                  <button
                    key={screen}
                    onClick={() => setPreviewScreen(screen)}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                      previewScreen === screen
                        ? "bg-lime-500 text-white"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {screen.charAt(0).toUpperCase() + screen.slice(1)}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-sm font-medium bg-white px-3 py-1.5 rounded-full shadow-sm">
                <Smartphone size={14} /> Preview
              </div>
            </div>

            {/* 3D Phone Container */}
            <div
              className="relative w-[320px] h-162.5 rounded-[3rem] shadow-2xl bg-slate-900 border-8 border-slate-900 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"
              style={{
                transform: isHoveringPhone
                  ? `rotateX(${mouseRotation.x}deg) rotateY(${mouseRotation.y}deg) scale(1.03)`
                  : "rotateY(-5deg) rotateX(2deg) scale(1)",
                boxShadow: isHoveringPhone
                  ? `${-mouseRotation.y * 1.5}px ${mouseRotation.x * 1.5}px 40px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1) inset`
                  : "-12px 12px 30px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1) inset",
              }}
            >
              {/* Screen reflection overlay */}
              <div
                className="absolute inset-0 z-30 pointer-events-none rounded-[2.4rem] overflow-hidden"
                style={{
                  background: `linear-gradient(${135 + mouseRotation.y * 2}deg, rgba(255,255,255,0.12) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.04) 100%)`,
                }}
              />

              <div
                className={`w-full h-full flex flex-col ${activeTenant.theme.mode === "dark" ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-900"} transition-colors duration-500 relative`}
              >
                {/* Dynamic Island */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 w-25 h-7 bg-black rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-slate-700 mr-4" />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                </div>
                {/* Splash Screen */}
                {previewScreen === "Splash" && (
                  <div className="w-full h-full flex flex-col items-center justify-center relative transition-all duration-500" style={{ background: `linear-gradient(to bottom, ${activeTenant.theme.primary}, ${activeTenant.theme.secondary})` }}>
                    {activeTenant.splashImage ? (
                      <NextImage src={activeTenant.splashImage} alt="Splash" fill className="object-cover" />
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-linear-to-b from-white/10 to-transparent" />
                        {activeTenant.logo ? (
                          <NextImage src={activeTenant.logo} alt="Logo" width={80} height={80} className="w-20 h-20 object-contain" />
                        ) : (
                          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white text-2xl font-bold">
                            {activeTenant.appName.charAt(0)}
                          </div>
                        )}
                        <p className="text-white font-bold text-lg mt-4">{activeTenant.appName}</p>
                        <p className="text-white/60 text-xs mt-1">Loading...</p>
                      </>
                    )}
                  </div>
                )}

                {/* Transactions Screen */}
                {previewScreen === "Transactions" && (
                  <>
                    <StatusBar />
                    <div className="flex-1 overflow-y-auto">
                      <div className="px-6 py-4">
                        <h3 className="text-lg font-bold">Transactions</h3>
                        <p className="text-xs opacity-60">Recent Activity</p>
                      </div>
                      <div className="px-6 space-y-3 pb-4">
                        {[
                          { name: "Market Purchase", amount: "-$45.00", type: "debit" },
                          { name: "Crop Sale", amount: "+$320.00", type: "credit" },
                          { name: "Seed Supply", amount: "-$89.50", type: "debit" },
                          { name: "P2P from Ada", amount: "+$50.00", type: "credit" },
                          { name: "Water Bill", amount: "-$12.00", type: "debit" },
                          { name: "Fertilizer Co-op", amount: "-$67.00", type: "debit" },
                          { name: "Harvest Payment", amount: "+$1,200.00", type: "credit" },
                          { name: "Transport Fee", amount: "-$25.00", type: "debit" },
                        ].map((tx, i) => (
                          <div key={i+1} className={`flex items-center gap-3 p-3 ${activeTenant.theme.mode === "dark" ? "bg-slate-800" : "bg-white"} shadow-sm ${activeTenant.theme.radius}`}>
                            <div className={`w-8 h-8 ${activeTenant.theme.radius} flex items-center justify-center ${tx.type === "credit" ? "bg-green-100" : "bg-red-100"}`}>
                              <ArrowRight size={14} className={tx.type === "credit" ? "text-green-600 -rotate-45" : "text-red-600 rotate-135"} />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-medium">{tx.name}</p>
                              <p className="text-[10px] opacity-50">Today</p>
                            </div>
                            <span className={`text-xs font-bold ${tx.type === "credit" ? "text-green-600" : "text-red-500"}`}>{tx.amount}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <PhoneTabBar theme={activeTenant.theme} activeTab="Transactions" onTabChange={setPreviewScreen} />
                  </>
                )}

                {/* Home Screen */}
                {previewScreen === "Home" && (
                  <>
                    <StatusBar />
                    <div className="flex-1 overflow-y-auto">
                      <div className="px-6 py-4 flex items-center justify-between">
                        <div>
                          <p className="text-xs opacity-60">Welcome back,</p>
                          <h3 className="text-lg font-bold">Farmer John</h3>
                        </div>
                        {activeTenant.logo ? (
                          <NextImage src={activeTenant.logo} alt="Logo" width={40} height={40} className="w-10 h-10 rounded-full object-contain shadow-lg" />
                        ) : (
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg transition-colors duration-500"
                            style={{ backgroundColor: activeTenant.theme.primary }}
                          >
                            {activeTenant.appName.charAt(0)}
                          </div>
                        )}
                      </div>

                      <div className="px-6 py-2">
                        <div
                          className={`w-full h-40 ${activeTenant.theme.radius} p-5 flex flex-col justify-between text-white shadow-xl transition-all duration-500 relative overflow-hidden`}
                          style={{ background: `linear-gradient(135deg, ${activeTenant.theme.primary}, ${activeTenant.theme.secondary})` }}
                        >
                          <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                          <div>
                            <p className="text-sm opacity-80 font-medium">Total Balance</p>
                            <h2 className="text-3xl font-bold tracking-tight mt-1">{activeTenant.currency}4,250,000.00</h2>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-xs opacity-90 font-mono">**** 4920</div>
                            {activeTenant.features.offlineMode && (
                              <div className="flex items-center gap-1 text-[10px] opacity-80">
                                <WifiOff size={10} /> Offline Ready
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="px-6 py-6 grid grid-cols-4 gap-4">
                        {[
                          { label: "Send", icon: ArrowRight },
                          { label: "Receive", icon: ArrowRight },
                          { label: "Scan", icon: Zap },
                          { label: "More", icon: Layers },
                        ].map((action, i) => (
                          <div key={i+1} className="flex flex-col items-center gap-2">
                            <div className={`w-12 h-12 flex items-center justify-center shadow-sm ${activeTenant.theme.mode === "dark" ? "bg-slate-800" : "bg-white"} ${activeTenant.theme.radius}`}>
                              <action.icon size={18} style={{ color: activeTenant.theme.primary }} />
                            </div>
                            <span className="text-[10px] font-medium opacity-70">{action.label}</span>
                          </div>
                        ))}
                      </div>

                      <div className="px-6 pb-4">
                        <h4 className="text-sm font-bold mb-4">Active Modules</h4>
                        <div className="space-y-3">
                          {activeTenant.features.transfers && (
                            <MockListItem title="P2P Transfers" radius={activeTenant.theme.radius} mode={activeTenant.theme.mode} />
                          )}
                          {activeTenant.features.offlineMode && (
                            <MockListItem title="Offline Sync Queue" radius={activeTenant.theme.radius} mode={activeTenant.theme.mode} />
                          )}
                          {activeTenant.features.nfcPayment && (
                            <MockListItem title="NFC Payments" radius={activeTenant.theme.radius} mode={activeTenant.theme.mode} />
                          )}
                          {activeTenant.features.multiAccountLinking && (
                            <MockListItem title="Multi-Account" radius={activeTenant.theme.radius} mode={activeTenant.theme.mode} />
                          )}
                        </div>
                      </div>
                    </div>

                    <PhoneTabBar theme={activeTenant.theme} activeTab="Home" onTabChange={setPreviewScreen} />
                  </>
                )}
              </div>
            </div>

            <div className="absolute bottom-8 text-center text-xs text-slate-400 max-w-62.5">
              Move your mouse over the device for interactive 3D parallax.
            </div>
          </div>
        </div>
    </>
  );
}

function StatusBar() {
  return (
    <div className="h-14 flex items-end justify-between px-8 pb-1 shrink-0">
      <span className="text-[11px] font-semibold">9:41</span>
      <div className="flex items-center gap-1.5">
        <SignalHigh size={12} className="opacity-80" />
        <Wifi size={12} className="opacity-80" />
        <BatteryFull size={14} className="opacity-80" />
      </div>
    </div>
  );
}

function PhoneTabBar({ theme, activeTab, onTabChange }: Readonly<{
  theme: { primary: string; secondary: string; mode: string };
  activeTab: PreviewScreen;
  onTabChange: (screen: PreviewScreen) => void;
}>) {
  return (
    <div className={`h-20 shrink-0 ${theme.mode === "dark" ? "bg-slate-800" : "bg-white"} border-t ${theme.mode === "dark" ? "border-slate-700" : "border-slate-200"} flex items-center justify-around px-6 pb-4 pt-2`}>
      <button onClick={() => onTabChange("Home")} className="w-6 h-6 transition-opacity" style={{ color: activeTab === "Home" ? theme.primary : undefined, opacity: activeTab === "Home" ? 1 : 0.4 }}>
        <Globe size={24} />
      </button>
      <button onClick={() => onTabChange("Transactions")} className="w-6 h-6 transition-opacity" style={{ color: activeTab === "Transactions" ? theme.primary : undefined, opacity: activeTab === "Transactions" ? 1 : 0.4 }}>
        <CreditCard size={24} />
      </button>
      <button className="w-6 h-6 opacity-40"><Bell size={24} /></button>
      <button className="w-6 h-6 opacity-40"><Settings size={24} /></button>
    </div>
  );
}

function ToggleItem({ label, description, checked, onChange }: Readonly<
    {
      label: string;
      description: string;
      checked: boolean;
      onChange: () => void;
    }>) {
  return (
    <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl bg-slate-50/50">
      <div className="pr-8">
        <div className="font-semibold text-sm text-slate-800">{label}</div>
        <div className="text-xs text-slate-500 mt-1">{description}</div>
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${checked ? "bg-lime-500" : "bg-slate-300"}`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
    </div>
  );
}

function MockListItem({ title, radius, mode }: Readonly<{
  title: string;
  radius: string;
  mode: string;
}>) {
  return (
    <div
      className={`flex items-center gap-3 p-3 ${mode === "dark" ? "bg-slate-800" : "bg-white"} shadow-sm ${radius}`}
    >
      <div className="w-8 h-8 rounded bg-slate-200/50 flex items-center justify-center">
        <Layers size={14} className="opacity-50" />
      </div>
      <div className="flex-1">
        <div className="h-3 w-24 bg-current opacity-20 rounded mb-2"></div>
        <div className="h-2 w-16 bg-current opacity-10 rounded"></div>
      </div>
      <div className="text-xs font-semibold">{title}</div>
    </div>
  );
}