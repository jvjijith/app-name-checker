"use client";

import { useState } from "react";
import { Search, Loader2, CheckCircle, XCircle, AlertCircle, AppWindow, CodeXml } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type StoreResult = {
  status: "available" | "taken" | "similar";
  results: Array<{ name: string; developer: string; icon: string; url: string }>;
};

type NameAvailabilityResponse = {
  apple: StoreResult;
  google: StoreResult;
};

type BundleAvailabilityResponse = {
  apple: { available: boolean };
  google: { available: boolean };
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<"name" | "bundle">("name");
  
  const [appName, setAppName] = useState("");
  const [bundleId, setBundleId] = useState("");
  
  const [loadingName, setLoadingName] = useState(false);
  const [nameResults, setNameResults] = useState<NameAvailabilityResponse | null>(null);
  
  const [loadingBundle, setLoadingBundle] = useState(false);
  const [bundleResults, setBundleResults] = useState<BundleAvailabilityResponse | null>(null);
  
  const [error, setError] = useState<string | null>(null);

  const checkNameAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName) return;
    
    setLoadingName(true);
    setNameResults(null);
    setError(null);

    try {
      const res = await fetch(`/api/check-name?name=${encodeURIComponent(appName)}`);
      if (!res.ok) throw new Error("Failed to check name availability");
      
      const data = await res.json();
      setNameResults(data);
    } catch (err) {
      setError("An error occurred while checking name availability.");
    } finally {
      setLoadingName(false);
    }
  };

  const checkBundleAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bundleId) return;
    
    setLoadingBundle(true);
    setBundleResults(null);
    setError(null);

    try {
      const res = await fetch(`/api/check-bundle?bundleId=${encodeURIComponent(bundleId)}`);
      if (!res.ok) throw new Error("Failed to check bundle ID availability");
      
      const data = await res.json();
      setBundleResults(data);
    } catch (err) {
      setError("An error occurred while checking bundle ID availability.");
    } finally {
      setLoadingBundle(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const renderStoreCard = (title: string, store: StoreResult, iconUrl: string) => {
    const isTaken = store.status === "taken";
    const isSimilar = store.status === "similar";
    const isAvailable = store.status === "available";

    return (
      <Card className="w-full bg-zinc-950/40 border-zinc-800 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <img src={iconUrl} alt={title} className="w-6 h-6 object-contain" />
            <CardTitle className="text-xl font-bold">{title}</CardTitle>
          </div>
          {isAvailable && <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-4 h-4 mr-1" /> Available</Badge>}
          {isTaken && <Badge variant="destructive"><XCircle className="w-4 h-4 mr-1" /> Taken</Badge>}
          {isSimilar && <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black"><AlertCircle className="w-4 h-4 mr-1" /> Similar</Badge>}
        </CardHeader>
        <CardContent>
          {(isTaken || isSimilar) && store.results.length > 0 && (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-muted-foreground">Top matches:</p>
              {store.results.map((app, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                  <img src={app.icon} alt={app.name} className="w-10 h-10 rounded-xl" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate text-sm">{app.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{app.developer}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {isAvailable && (
            <div className="mt-4 py-8 flex flex-col items-center justify-center text-muted-foreground">
              <CheckCircle className="w-12 h-12 text-green-500/20 mb-2" />
              <p>Name is clear!</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <main className="min-h-screen p-4 md:p-8 selection:bg-blue-200">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4 pt-12 pb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            App <span className="text-blue-600">Checker</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Check app name and bundle ID availability across the App Store and Google Play.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex justify-center mb-8">
          <div className="flex p-1 space-x-1 bg-slate-200/50 dark:bg-slate-800/50 rounded-xl">
            <button
              onClick={() => { setActiveTab("name"); setError(null); }}
              className={`flex items-center px-6 py-2.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === "name" 
                  ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800"
              }`}
            >
              <AppWindow className="w-4 h-4 mr-2" /> App Name Checker
            </button>
            <button
              onClick={() => { setActiveTab("bundle"); setError(null); }}
              className={`flex items-center px-6 py-2.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === "bundle" 
                  ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800"
              }`}
            >
              <CodeXml className="w-4 h-4 mr-2" /> Bundle ID Checker
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* App Name Checker View */}
        {activeTab === "name" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-zinc-800 bg-zinc-950/40 shadow-sm backdrop-blur-sm">
              <CardContent className="pt-6">
                <form onSubmit={checkNameAvailability} className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 space-y-2">
                    <label className="text-sm font-medium">App Name</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                      <Input 
                        placeholder="e.g. Instagram" 
                        className="pl-10 h-12 text-lg bg-zinc-900/50 border-zinc-800 focus-visible:ring-zinc-700"
                        value={appName}
                        onChange={(e) => setAppName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" disabled={!appName || loadingName} className="h-12 px-8 text-lg w-full md:w-auto">
                      {loadingName ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                      {loadingName ? "Checking..." : "Check Name"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {loadingName && (
              <div className="grid md:grid-cols-2 gap-6">
                <Skeleton className="h-[300px] w-full rounded-xl" />
                <Skeleton className="h-[300px] w-full rounded-xl" />
              </div>
            )}

            {nameResults && !loadingName && (
              <div className="grid md:grid-cols-2 gap-6 animate-in fade-in duration-500">
                {renderStoreCard("App Store", nameResults.apple, "https://upload.wikimedia.org/wikipedia/commons/6/67/App_Store_%28iOS%29.svg")}
                {renderStoreCard("Google Play", nameResults.google, "https://upload.wikimedia.org/wikipedia/commons/d/d0/Google_Play_Arrow_logo.svg")}
              </div>
            )}
          </div>
        )}

        {/* Bundle ID Checker View */}
        {activeTab === "bundle" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-zinc-800 bg-zinc-950/40 shadow-sm backdrop-blur-sm">
              <CardContent className="pt-6">
                <form onSubmit={checkBundleAvailability} className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 space-y-2">
                    <label className="text-sm font-medium">Bundle ID</label>
                    <div className="relative">
                      <CodeXml className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                      <Input 
                        placeholder="e.g. com.church.appname" 
                        className="pl-10 h-12 text-lg font-mono bg-zinc-900/50 border-zinc-800 focus-visible:ring-zinc-700"
                        value={bundleId}
                        onChange={(e) => setBundleId(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" disabled={!bundleId || loadingBundle} className="h-12 px-8 text-lg w-full md:w-auto">
                      {loadingBundle ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                      {loadingBundle ? "Checking..." : "Check Bundle"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {loadingBundle && (
              <div className="grid md:grid-cols-2 gap-6">
                <Skeleton className="h-[150px] w-full rounded-xl" />
                <Skeleton className="h-[150px] w-full rounded-xl" />
              </div>
            )}

            {bundleResults && !loadingBundle && (
              <div className="grid md:grid-cols-2 gap-6 animate-in fade-in duration-500">
                <Card className="w-full bg-zinc-950/40 border-zinc-800 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="flex items-center gap-2">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/6/67/App_Store_%28iOS%29.svg" alt="App Store" className="w-6 h-6 object-contain" />
                      <CardTitle className="text-xl font-bold">App Store</CardTitle>
                    </div>
                    {bundleResults.apple.available ? (
                      <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-4 h-4 mr-1" /> Available</Badge>
                    ) : (
                      <Badge variant="destructive"><XCircle className="w-4 h-4 mr-1" /> Taken</Badge>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="mt-4 flex flex-col items-center justify-center text-muted-foreground">
                      {bundleResults.apple.available ? (
                        <>
                          <CheckCircle className="w-10 h-10 text-green-500/20 mb-2" />
                          <p>Bundle ID is clear!</p>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-10 h-10 text-red-500/20 mb-2" />
                          <p>Bundle ID is registered.</p>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="w-full bg-zinc-950/40 border-zinc-800 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="flex items-center gap-2">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/Google_Play_Arrow_logo.svg" alt="Google Play" className="w-6 h-6 object-contain" />
                      <CardTitle className="text-xl font-bold">Google Play</CardTitle>
                    </div>
                    {bundleResults.google.available ? (
                      <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-4 h-4 mr-1" /> Available</Badge>
                    ) : (
                      <Badge variant="destructive"><XCircle className="w-4 h-4 mr-1" /> Taken</Badge>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="mt-4 flex flex-col items-center justify-center text-muted-foreground">
                      {bundleResults.google.available ? (
                        <>
                          <CheckCircle className="w-10 h-10 text-green-500/20 mb-2" />
                          <p>Bundle ID is clear!</p>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-10 h-10 text-red-500/20 mb-2" />
                          <p>Bundle ID is registered.</p>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
