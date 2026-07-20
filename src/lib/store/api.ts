import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface APIResponse<T> {
  message: string;
  success: boolean;
  details: T;
}

export type ApiKeyResponse = {
  id: number;
  apiKey: string;
  label: string;
  createdAt: string;
  keyPrefix: string;
  [key: string]: unknown;
};

export type ApiKeyListItem = {
  id: number;
  label: string;
  keyPrefix: string;
  createdAt: string;
  lastUsed: string | null;
  isActive: boolean;
};

export type CreateTenantConfig = {
  tenantId: string;
  appName: string;
};

export type TenantConfig = {
  appName?: string;
  currency?: string;
  currencyCode?: string;
  bundleIdentifier: string;
  // slug: string;
  colors?: {
    primary?: string;
    primaryDark?: string;
    accent?: string;
    accentDark?: string;
  };
  features?: {
    nfc?: boolean;
    bluetooth?: boolean;
    ussd?: boolean;
    voiceBanking?: boolean;
    liveness?: boolean;
    qrPayments?: boolean;
    billPayments?: boolean;
    consumerRole?: boolean;
    merchantRole?: boolean;
  };
  legal?: {
    privacyEmail?: string;
    supportEmail?: string;
    regulatoryBody?: string;
    complianceNote?: string;
    privacyPolicyUrl?: string;
    consentVersion?: string;
  };
  copy?: {
    tagline?: string;
  };
  assets?: {
    splashScreen?: string;
    appLogo?: string;
    appIcon?: string;
  };
};

export type DeployResponse = {
  deployId: string;
  status: "queued" | "building" | "deployed" | "failed";
  url?: string;
};

export type Merchant = {
  merchantId: string;
  terminalId: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  businessType: "sole_proprietor" | "partnership" | "llc" | "corporation";
  taxId: string;
  bankAccountNumber: string;
  bankName: string;
  documents: { name: string; url: string; type: string }[];
  status: "ACTIVE" | "PENDING" | "SUSPENDED";
  createdAt: string;
  settlementCycle: "instant" | "T+1" | "T+2" | "weekly";
  transactionVolume: number;
  mcc: string;
  posTerminals: number;
  chargebackRate: number;
  kycVerified: boolean;
  lastTransaction: string;
};

const AUTH_TOKEN = "<access_token>";

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NODE_ENV === "development" ? process.env.NEXT_PUBLIC_API_BASE_URL : "https://ruralpay.zegiftedtechnologies.com"}/api/v1`,
    prepareHeaders: (headers) => {
      headers.set("accept", "application/json");
      headers.set("Authorization", `Bearer ${AUTH_TOKEN}`);
      return headers;
    },
  }),
  tagTypes: ["ApiKeys", "Merchants", "Tenants"],
  endpoints: (builder) => ({
    // Generate Merchant Checkout API Key
    generateCheckoutApiKey: builder.mutation<
      APIResponse<ApiKeyResponse>,
      { label: string }
    >({
      query: ({ label }) => ({
        url: `/checkout/api-key?label=${encodeURIComponent(label)}`,
        method: "POST",
      }),
      invalidatesTags: ["ApiKeys"],
    }),

    // List API Keys (keys are masked server-side)
    getCheckoutApiKeys: builder.query<APIResponse<ApiKeyListItem[]>, void>({
      query: () => "/checkout/api-key",
      providesTags: ["ApiKeys"],
    }),

    // Revoke API Key
    revokeCheckoutApiKey: builder.mutation<void, number>({
      query: (id) => ({ url: `/checkout/api-key/${id}`, method: "DELETE" }),
      invalidatesTags: ["ApiKeys"],
    }),

    // Merchants
    getMerchants: builder.query<APIResponse<Merchant[]>, void>({
      query: () => "/merchant",
      providesTags: ["Merchants"],
    }),
    createMerchant: builder.mutation<Merchant, Partial<Merchant>>({
      query: (body) => ({ url: "/merchant", method: "POST", body }),
      invalidatesTags: ["Merchants"],
    }),
    deleteMerchant: builder.mutation<void, string>({
      query: (id) => ({ url: `/merchant/${id}`, method: "DELETE" }),
      invalidatesTags: ["Merchants"],
    }),
    uploadMerchantDocument: builder.mutation<
      void,
      { merchantId: string; file: FormData }
    >({
      query: ({ merchantId, file }) => ({
        url: `/merchant/${merchantId}/documents`,
        method: "POST",
        body: file,
      }),
      invalidatesTags: ["Merchants"],
    }),
    approveMerchant: builder.mutation<void, string>({
      query: (id) => ({ url: `/merchant/${id}/approve`, method: "PATCH" }),
      invalidatesTags: ["Merchants"],
    }),
    declineMerchant: builder.mutation<void, string>({
      query: (id) => ({ url: `/merchant/${id}/decline`, method: "PATCH" }),
      invalidatesTags: ["Merchants"],
    }),

    // Banks
    getBanks: builder.query<
      APIResponse<
        {
          bankCode: string;
          cbnCode: string;
          name: string;
          logoData: string;
          uptimePrediction: number;
        }[]
      >,
      void
    >({
      query: () => "/banks",
    }),

    // Tenant Config
    getTenants: builder.query<
      APIResponse<
        {
          tenantId: string;
          appName: string;
          bundleIdentifier: string;
        }[]
      >,
      void
    >({
      query: () => `/admin/tenant`,
      providesTags: ["Tenants"],
    }),
    getTenantById: builder.query<
      APIResponse<TenantConfig>,
      { tenantId: string }
    >({
      query: ({ tenantId }) => `/admin/tenant/${tenantId}/config`,
      providesTags: ["Tenants"],
    }),
    createTenant: builder.mutation<
      APIResponse<CreateTenantConfig>,
      Partial<TenantConfig>
    >({
      query: (body) => ({ url: "/admin/tenant", method: "POST", body }),
      invalidatesTags: ["Tenants"],
    }),
    updateTenantConfig: builder.mutation<
      APIResponse<TenantConfig>,
      { tenantId: string; body: TenantConfig }
    >({
      query: ({ tenantId, body }) => ({
        url: `/admin/tenant/${tenantId}/config`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Tenants"],
    }),
    uploadTenantAssets: builder.mutation<
      APIResponse<unknown>,
      { tenantId: string; formData: FormData }
    >({
      query: ({ tenantId, formData }) => ({
        url: `/admin/tenant/${tenantId}/assets`,
        method: "PATCH",
        body: formData,
      }),
      invalidatesTags: ["Tenants"],
    }),
    deployTenantConfig: builder.mutation<APIResponse<DeployResponse>, string>({
      query: (id) => ({ url: `/admin/tenant/${id}/deploy`, method: "POST" }),
    }),
  }),
});

export const {
  useGenerateCheckoutApiKeyMutation,
  useGetCheckoutApiKeysQuery,
  useRevokeCheckoutApiKeyMutation,
  useGetMerchantsQuery,
  useCreateMerchantMutation,
  useDeleteMerchantMutation,
  useUploadMerchantDocumentMutation,
  useApproveMerchantMutation,
  useDeclineMerchantMutation,
  useGetBanksQuery,
  useGetTenantsQuery,
  useGetTenantByIdQuery,
  useCreateTenantMutation,
  useUpdateTenantConfigMutation,
  useUploadTenantAssetsMutation,
  useDeployTenantConfigMutation,
} = api;
