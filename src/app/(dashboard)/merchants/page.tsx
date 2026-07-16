"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Store, Upload, Eye, Trash2, Plus, FileText, X, CheckCircle, XCircle } from "lucide-react";
import Image from "next/image";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useGetMerchantsQuery,
  useCreateMerchantMutation,
  useDeleteMerchantMutation,
  useUploadMerchantDocumentMutation,
  useApproveMerchantMutation,
  useDeclineMerchantMutation,
  useGetBanksQuery,
} from "@/lib/store/api";
import type { Merchant } from "@/lib/store/api";

const merchantSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  ownerName: z.string().min(2, "Owner name is required"),
  email: z.email("Valid email required"),
  phone: z.string().regex(/^(0[789][01]\d{8}|\+234[789][01]\d{8})$/, "Enter a valid Nigerian phone number"),
  address: z.string().min(5, "Address is required"),
  businessType: z.enum(["sole_proprietor", "partnership", "llc", "corporation"], {
    message: "Select a business type",
  }),
  taxId: z.string().min(5, "Tax ID / TIN is required"),
  bankAccountNumber: z.string().length(10, "Account number must be exactly 10 digits").regex(/^\d{10}$/, "Account number must be 10 digits"),
  bankName: z.string().min(2, "Bank name is required"),
});

type MerchantFormData = z.infer<typeof merchantSchema>;

type UploadedDoc = {
  name: string;
  url: string;
  type: string;
};

export default function MerchantsPage() {
  const { data, isLoading } = useGetMerchantsQuery();
  const merchants = data?.details ?? [];
  const { data: banksData } = useGetBanksQuery();
  const banks = banksData?.details ?? [];
  const [createMerchant] = useCreateMerchantMutation();
  const [deleteMerchant] = useDeleteMerchantMutation();
  const [uploadDocument, { isLoading: isUploading }] = useUploadMerchantDocumentMutation();
  const [approveMerchant] = useApproveMerchantMutation();
  const [declineMerchant] = useDeclineMerchantMutation();

  const [selectedBankName, setSelectedBankName] = useState("");
  const [documents, setDocuments] = useState<UploadedDoc[]>([]);
  const [viewing, setViewing] = useState<Merchant | null>(null);
  const [uploadTarget, setUploadTarget] = useState<Merchant | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MerchantFormData>({
    resolver: zodResolver(merchantSchema),
  });

  const onSubmit = async (data: MerchantFormData) => {
    await createMerchant({ ...data, documents } as Partial<Merchant>);
    setDocuments([]);
    reset();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setDocuments((prev) => [
            ...prev,
            { name: file.name, url: reader.result as string, type: file.type },
          ]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!uploadTarget || !e.target.files?.length) return;
    const formData = new FormData();
    Array.from(e.target.files).forEach((file) => {
      formData.append("documents", file);
    });
    await uploadDocument({ merchantId: uploadTarget.merchantId, file: formData });
    setUploadTarget(null);
  };

  const statusBadge = (status: Merchant["status"]) => {
    switch (status.toLowerCase()) {
      case "active": return { className: "bg-emerald-100 text-emerald-700 border-emerald-200" };
      case "pending": return { className: "bg-amber-100 text-amber-700 border-amber-200" };
      case "suspended": return { className: "bg-red-100 text-red-700 border-red-200" };
      default: return { className: "" };
    }
  };

  const kycBadge = (verified: boolean) => {
    return verified
      ? { className: "bg-emerald-100 text-emerald-700 border-emerald-200" }
      : { className: "bg-orange-100 text-orange-700 border-orange-200" };
  };

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="flex items-center gap-3 mb-6">
        <Store className="text-indigo-500" size={24} />
        <h1 className="text-2xl font-bold">Merchants</h1>
      </div>

      <Tabs defaultValue="manage">
        <TabsList>
          <TabsTrigger value="manage">Manage Merchants</TabsTrigger>
          <TabsTrigger value="create">
            <Plus size={14} /> New Merchant
          </TabsTrigger>
        </TabsList>

        {/* MANAGE TAB */}
        <TabsContent value="manage">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">All Merchants ({merchants.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground py-4">Loading Merchants...</p>
              ) : merchants.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No Merchant(s) Found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business</TableHead>
                      <TableHead>Merchant ID</TableHead>
                      <TableHead>KYC</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {merchants.map((m) => (
                      <TableRow key={m.merchantId}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{m.businessName}</p>
                            <p className="text-xs text-muted-foreground">{m.ownerName}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{m.merchantId}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={kycBadge(m.kycVerified).className}>
                            {m.kycVerified ? "Verified" : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusBadge(m.status).className}>{m.status}</Badge>
                        </TableCell>
                        <TableCell>{m.createdAt}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {m.status === "PENDING" && (
                              <>
                                <Button variant="ghost" size="icon-sm" onClick={() => approveMerchant(m.merchantId)} title="Approve">
                                  <CheckCircle size={16} className="text-emerald-600" />
                                </Button>
                                <Button variant="ghost" size="icon-sm" onClick={() => declineMerchant(m.merchantId)} title="Decline">
                                  <XCircle size={16} className="text-red-600" />
                                </Button>
                              </>
                            )}
                            <Button variant="ghost" size="icon-sm" onClick={() => setViewing(m)}>
                              <Eye size={16} />
                            </Button>
                            <Button variant="ghost" size="icon-sm" onClick={() => setUploadTarget(m)} title="Upload Documents">
                              <Upload size={16} />
                            </Button>
                            <Button variant="ghost" size="icon-sm" onClick={() => deleteMerchant(m.merchantId)}>
                              <Trash2 size={16} className="text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CREATE TAB */}
        <TabsContent value="create">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Business Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Field label="Business Name" error={errors.businessName?.message}>
                    <Input {...register("businessName")} />
                  </Field>
                  <Field label="Owner Full Name" error={errors.ownerName?.message}>
                    <Input {...register("ownerName")} />
                  </Field>
                  <Field label="Business Type" error={errors.businessType?.message}>
                    <select {...register("businessType")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <option value="">Select type...</option>
                      <option value="sole_proprietor">Sole Proprietor</option>
                      <option value="partnership">Partnership</option>
                      <option value="llc">LLC</option>
                      <option value="corporation">Corporation</option>
                    </select>
                  </Field>
                  <Field label="Tax ID / TIN" error={errors.taxId?.message}>
                    <Input {...register("taxId")} />
                  </Field>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Contact Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Field label="Email" error={errors.email?.message}>
                    <Input type="email" {...register("email")} />
                  </Field>
                  <Field label="Phone" error={errors.phone?.message}>
                    <Input type="tel" {...register("phone")} />
                  </Field>
                  <Field label="Address" error={errors.address?.message}>
                    <Input {...register("address")} />
                  </Field>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle className="text-base">Settlement Bank Details</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Field label="Select Bank" error={errors.bankName?.message}>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      {...register("bankName", {
                        onChange: (e) => setSelectedBankName(e.target.value),
                      })}
                    >
                      <option value="">Select Bank...</option>
                      {banks.map((bank) => (
                        <option key={bank.bankCode} value={bank.name}>{bank.name}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Bank Name">
                    <Input value={selectedBankName} disabled />
                  </Field>
                  <Field label="Account Number" error={errors.bankAccountNumber?.message}>
                    <Input {...register("bankAccountNumber")} maxLength={10} inputMode="numeric" />
                  </Field>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Required Documents</CardTitle></CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">
                  Upload CAC certificate, valid ID, utility bill, or other KYC documents.
                </p>
                <label className="cursor-pointer inline-flex">
                  <Button type="button" variant="outline" size="sm" className="pointer-events-none">
                    <Upload size={14} /> Upload Documents
                  </Button>
                  <input type="file" multiple accept="image/*,.pdf" className="hidden" onChange={handleFileUpload} />
                </label>
                {documents.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {documents.map((doc, i) => (
                      <div key={i} className="relative group rounded-lg border overflow-hidden">
                        {doc.type.startsWith("image/") ? (
                          <Image src={doc.url} alt={doc.name} width={200} height={96} className="w-full h-24 object-cover" />
                        ) : (
                          <div className="w-full h-24 flex flex-col items-center justify-center bg-muted gap-1">
                            <FileText size={24} className="text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">PDF</span>
                          </div>
                        )}
                        <div className="p-1.5">
                          <p className="text-xs truncate">{doc.name}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDocument(i)}
                          className="absolute top-1 right-1 bg-background/80 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} className="text-destructive" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Button type="submit" className="w-full" size="lg">
              Create Merchant & Generate IDs
            </Button>
          </form>
        </TabsContent>
      </Tabs>

      {/* Upload Documents Dialog */}
      <Dialog open={!!uploadTarget} onOpenChange={(open) => !open && setUploadTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Documents — {uploadTarget?.businessName}</DialogTitle>
            <DialogDescription>
              Add KYC documents (CAC certificate, valid ID, utility bill, etc.) for this merchant.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="cursor-pointer">
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-indigo-400 transition-colors">
                <Upload size={32} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {isUploading ? "Uploading..." : "Click to select files or drag & drop"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG accepted</p>
              </div>
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleDocumentUpload}
                disabled={isUploading}
              />
            </label>
          </div>
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>

      {/* View Merchant Dialog */}
      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewing?.businessName}</DialogTitle>
            <DialogDescription>Merchant Details, Terminal Info & POS Configuration</DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4 text-sm">
              {/* IDs & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Merchant ID</p>
                  <p className="font-mono font-medium">{viewing.merchantId}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Terminal ID</p>
                  <p className="font-mono font-medium">{viewing.terminalId}</p>
                </div>
              </div>

              <Separator />

              {/* POS & Settlement */}
              <h4 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">POS & Settlement</h4>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                <InfoRow label="Settlement Cycle" value={viewing.settlementCycle} />
                <InfoRow label="MCC Code" value={viewing.mcc} />
                <InfoRow label="POS Terminals" value={String(viewing.posTerminals)} />
                <InfoRow label="Transaction Volume" value={`₦${(viewing.transactionVolume ?? 0).toLocaleString()}`} />
                <InfoRow label="Chargeback Rate" value={`${viewing.chargebackRate}%`} />
                <InfoRow label="Last Transaction" value={viewing.lastTransaction} />
              </div>

              <Separator />

              {/* KYC & Compliance */}
              <h4 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">KYC & Compliance</h4>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">KYC Verified</span>
                  <Badge variant="outline" className={kycBadge(viewing.kycVerified).className}>
                    {viewing.kycVerified ? "Verified" : "Pending"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="outline" className={statusBadge(viewing.status).className}>{viewing.status}</Badge>
                </div>
                <InfoRow label="Tax ID" value={viewing.taxId} />
                <InfoRow label="Business Type" value={viewing.businessType.replace("_", " ")} />
              </div>

              <Separator />

              {/* Contact & Banking */}
              <h4 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">Contact & Banking</h4>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                <InfoRow label="Owner" value={viewing.ownerName} />
                <InfoRow label="Email" value={viewing.email} />
                <InfoRow label="Phone" value={viewing.phone} />
                <InfoRow label="Address" value={viewing.address} />
                <InfoRow label="Bank" value={viewing.bankName} />
                <InfoRow label="Account" value={viewing.bankAccountNumber} />
              </div>

              <Separator />

              {/* Documents */}
              <h4 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">Documents</h4>
              {viewing.documents.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {viewing.documents.map((doc, i) => (
                    <div key={i} className="rounded-lg border overflow-hidden">
                      {doc.type?.startsWith("image/") && doc.url ? (
                        <Image src={doc.url} alt={doc.name} width={200} height={80} className="w-full h-20 object-cover" />
                      ) : (
                        <div className="w-full h-20 flex flex-col items-center justify-center bg-muted gap-1">
                          <FileText size={20} className="text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground uppercase">
                            {doc.name.split(".").pop()}
                          </span>
                        </div>
                      )}
                      <div className="p-1.5">
                        <p className="text-xs truncate">{doc.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <p className="text-muted-foreground text-sm">No Documents Uploaded</p>
                  <Button variant="outline" size="sm" onClick={() => { setUploadTarget(viewing); }}>
                    <Upload size={14} /> Upload
                  </Button>
                </div>
              )}
            </div>
          )}
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
