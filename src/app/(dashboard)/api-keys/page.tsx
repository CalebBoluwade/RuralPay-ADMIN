"use client";

import { useState } from "react";
import { Key, Plus, Copy, Trash2, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { useGenerateApiKeyMutation, useGetApiKeysQuery, useRevokeApiKeyMutation } from "@/lib/store/api";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export default function ApiKeysPage() {
  const { data, isLoading } = useGetApiKeysQuery();
  const keys = data?.details ?? [];
  const [generateApiKey, { isLoading: isGenerating }] = useGenerateApiKeyMutation();
  const [revokeApiKey] = useRevokeApiKeyMutation();

  const [createOpen, setCreateOpen] = useState(false);
  const [label, setLabel] = useState("");

  // Post-creation state
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  const handleGenerate = async () => {
    if (!label.trim()) return;
    try {
      const res = await generateApiKey({ label: label.trim() }).unwrap();
      setGeneratedKey(res.details.apiKey);
      setCopied(false);
      setAcknowledged(false);
    } catch {
      // handle error silently or show toast
    }
  };

  const handleCopy = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      setCopied(true);
    }
  };

  const handleDismiss = () => {
    setCreateOpen(false);
    setGeneratedKey(null);
    setLabel("");
    setCopied(false);
    setAcknowledged(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Key className="text-indigo-500" size={24} />
          <h1 className="text-2xl font-bold">API Keys</h1>
        </div>

        <Dialog open={createOpen} onOpenChange={(open) => {
          if (!open && generatedKey && !acknowledged) return; // prevent closing without ack
          if (!open) handleDismiss();
          else setCreateOpen(true);
        }}>
          <DialogTrigger render={<Button />}>
            <Plus size={16} className="mr-2" /> Generate Key
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {generatedKey ? "API Key Generated" : "Generate Checkout API Key"}
              </DialogTitle>
            </DialogHeader>

            {!generatedKey ? (
              <>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Label</Label>
                    <Input
                      placeholder="e.g. Production Checkout"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleGenerate} disabled={!label.trim() || isGenerating}>
                    {isGenerating ? "Generating..." : "Generate Key"}
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <div className="space-y-4 py-2">
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
                  <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-amber-800">
                    This key will only be shown once. Copy it now and store it securely. You will not be able to view it again.
                  </p>
                </div>

                <div className="relative">
                  <Label className="mb-1">Your API Key</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 block rounded-md border bg-slate-100 px-3 py-2 text-xs font-mono break-all select-all">
                      {generatedKey}
                    </code>
                    <Button
                      variant={copied ? "default" : "outline"}
                      size="sm"
                      onClick={handleCopy}
                      className="shrink-0"
                    >
                      {copied ? <Check size={14} className="mr-1" /> : <Copy size={14} className="mr-1" />}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </div>

                <label className="flex items-start gap-2 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={acknowledged}
                    onChange={(e) => setAcknowledged(e.target.checked)}
                    className="mt-0.5 rounded border-gray-300"
                  />
                  <span className="text-sm text-muted-foreground">
                    I have copied and securely saved this API key. I understand it cannot be retrieved later.
                  </span>
                </label>

                <DialogFooter>
                  <Button onClick={handleDismiss} disabled={!acknowledged}>
                    Done
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Checkout Integration Keys</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <p className="text-sm text-muted-foreground py-4">Loading keys...</p>
          )}
          {!isLoading && keys.length === 0 && (
            <p className="text-sm text-muted-foreground py-4">No API keys generated yet.</p>
          )}
          {!isLoading && keys.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Key Prefix</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((apiKey) => (
                  <TableRow key={apiKey.id} className="align-bottom">
                    <TableCell className="font-medium">{apiKey.label}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {apiKey.keyPrefix}••••••••
                    </TableCell>
                    <TableCell>{formatDate(apiKey.createdAt)}</TableCell>
                    <TableCell>{apiKey.lastUsed ? formatDate(apiKey.lastUsed) : "Never"}</TableCell>
                    <TableCell>
                      <Badge variant={apiKey.isActive ? "default" : "destructive"}>
                        {apiKey.isActive ? "ACTIVE" : "ACCESS REVOKED"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        {apiKey.isActive && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => revokeApiKey(apiKey.id)}
                            title="Revoke"
                          >
                            <Trash2 size={14} className="text-red-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
