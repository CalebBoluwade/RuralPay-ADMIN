import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface APIResponse<T> {
  message: string,
    success: boolean,
    details: T
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

export type TenantConfig = {
  id: string;
  name: string;
  domain: string;
  appName: string;
  slug: string;
  bundleIdentifier: string;
  theme: {
    primary: string;
    secondary: string;
    radius: string;
    mode: "light" | "dark";
  };
  logo: string;
  splashImage: string;
  features: { transfers: boolean; offlineMode: boolean; crypto: boolean };
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
    baseUrl: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1`,
    prepareHeaders: (headers) => {
      headers.set("accept", "application/json");
      headers.set("Authorization", `Bearer ${AUTH_TOKEN}`);
      return headers;
    },
  }),
  tagTypes: ["ApiKeys", "Merchants", "Tenants"],
  endpoints: (builder) => ({
    // Generate Merchant Checkout API Key
    generateApiKey: builder.mutation<APIResponse<ApiKeyResponse>, { label: string }>({
      query: ({ label }) => ({
        url: `/checkout/api-key?label=${encodeURIComponent(label)}`,
        method: "POST",
      }),
      invalidatesTags: ["ApiKeys"],
    }),

    // List API Keys (keys are masked server-side)
    getApiKeys: builder.query<APIResponse<ApiKeyListItem[]>, void>({
      query: () => "/checkout/api-key",
      providesTags: ["ApiKeys"],
    }),

    // Revoke API Key
    revokeApiKey: builder.mutation<void, number>({
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
    uploadMerchantDocument: builder.mutation<void, { merchantId: string; file: FormData }>({
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
    getBanks: builder.query<APIResponse<{ bankCode: string; cbnCode: string; name: string; logoData: string; uptimePrediction: number }[]>, void>({
      query: () => "/banks",
    }),

    // Tenant Config
    getTenants: builder.query<TenantConfig[], void>({
      query: () => "/tenants",
      providesTags: ["Tenants"],
    }),
    updateTenant: builder.mutation<TenantConfig, { id: string; body: Partial<TenantConfig> }>({
      query: ({ id, body }) => ({ url: `/tenants/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Tenants"],
    }),
    deployTenant: builder.mutation<DeployResponse, string>({
      query: (id) => ({ url: `/tenants/${id}/deploy`, method: "POST" }),
    }),
  }),
});

export const {
  useGenerateApiKeyMutation,
  useGetApiKeysQuery,
  useRevokeApiKeyMutation,
  useGetMerchantsQuery,
  useCreateMerchantMutation,
  useDeleteMerchantMutation,
  useUploadMerchantDocumentMutation,
  useApproveMerchantMutation,
  useDeclineMerchantMutation,
  useGetBanksQuery,
  useGetTenantsQuery,
  useUpdateTenantMutation,
  useDeployTenantMutation,
} = api;
