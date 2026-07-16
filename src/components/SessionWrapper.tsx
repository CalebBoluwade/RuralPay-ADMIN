"use client";

import React from "react";
import dynamic from "next/dynamic";
// import LoadingSession from "./LoadingSession";
import { MFAGate } from "@nibssplc/cams-sdk-react";

const msalConfig = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_MSAL_REDIRECT_CLIENT ?? "",
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_MSAL_REDIRECT_TENANT}`,
    redirectUri: process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== "undefined" ? window.location.origin : ""),
  },
  system: {
    loadFrameTimeout: Number(process.env.AUTH_MAX_TIMEOUT!) || 60000, // Timeout in milliseconds (6 seconds) for silent token acquisition
    allowNativeBroker: true, // Disables WAM Broker
  },
};

const UnifiedCAMSProvider = dynamic(
  () =>
    import("@nibssplc/cams-sdk-react").then((mod) => ({
      default: mod.UnifiedCAMSProvider,
    })),
  { ssr: false }
);

const SessionWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <UnifiedCAMSProvider
      mode="MSAL"
      appCode={process.env.NEXT_PUBLIC_CAMS_APP_ID!}
      ValidateUserEndpoint={`${process.env.NEXT_PUBLIC_CAMS_SDK_BASE_URL}/api/Auth/AuthenticateUserMFA`}
      msalConfig={msalConfig}
      onAuthError={(err) => {
        console.log("onAuthError >>>", err);
      }}
    >
      <MFAGate
        // usePassKey
        useADLogin
        CredentialsAuthEndpoint={`${process.env.NEXT_PUBLIC_CAMS_SDK_BASE_URL}/api/Auth/AuthenticateUserCredentials`}
        MFAEndpoints={{
          ValidateUserMFA: `${process.env.NEXT_PUBLIC_CAMS_SDK_BASE_URL}/api/Auth/ValidateMFAStandalone`,
          RetrieveAuthChallenge: `${process.env.NEXT_PUBLIC_CAMS_SDK_BASE_URL}/api/WebAuthN/auth-Challenge`,
          AuthChallengeVerify: `${process.env.NEXT_PUBLIC_CAMS_SDK_BASE_URL}/api/WebAuthN/auth-verify`,
        }}
      >
        {children}
      </MFAGate>
    </UnifiedCAMSProvider>
  );
};

export default SessionWrapper;