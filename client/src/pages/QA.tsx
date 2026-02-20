import { useState } from "react";
import { Loader2, CheckCircle2, AlertTriangle, XCircle, Play, RefreshCw } from "lucide-react";
import type { RabbitHole } from "@shared/schema";

type TestStatus = "pending" | "running" | "pass" | "fail" | "warn";
type TestResult = { name: string; status: TestStatus; message: string; duration?: number };

export default function QA() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [summary, setSummary] = useState<{ total: number; pass: number; fail: number; warn: number } | null>(null);

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result]);
  };

  const runAllTests = async () => {
    setRunning(true);
    setResults([]);
    setSummary(null);
    const allResults: TestResult[] = [];

    const runTest = async (name: string, fn: () => Promise<{ status: TestStatus; message: string }>) => {
      const start = Date.now();
      try {
        const { status, message } = await fn();
        const result = { name, status, message, duration: Date.now() - start };
        allResults.push(result);
        addResult(result);
      } catch (err) {
        const result = { name, status: "fail" as TestStatus, message: (err as Error).message, duration: Date.now() - start };
        allResults.push(result);
        addResult(result);
      }
    };

    await runTest("API: List Published Holes", async () => {
      const res = await fetch("/api/holes");
      if (!res.ok) return { status: "fail", message: `HTTP ${res.status}` };
      const data = await res.json();
      if (!Array.isArray(data)) return { status: "fail", message: "Response is not an array" };
      const nonPublished = data.filter((h: any) => h.status !== "Published");
      if (nonPublished.length > 0) return { status: "fail", message: `${nonPublished.length} non-published holes returned to public API` };
      return { status: "pass", message: `${data.length} published holes returned` };
    });

    await runTest("API: Specialist Holes (Published only)", async () => {
      const res = await fetch("/api/holes/specialist");
      if (!res.ok) return { status: "fail", message: `HTTP ${res.status}` };
      const data = await res.json();
      const nonPublished = data.filter((h: any) => h.status !== "Published");
      if (nonPublished.length > 0) return { status: "fail", message: `${nonPublished.length} non-published specialist holes leaked` };
      return { status: "pass", message: `${data.length} specialist holes OK` };
    });

    await runTest("API: Community Holes (Published only)", async () => {
      const res = await fetch("/api/holes/community");
      if (!res.ok) return { status: "fail", message: `HTTP ${res.status}` };
      const data = await res.json();
      const nonPublished = data.filter((h: any) => h.status !== "Published");
      if (nonPublished.length > 0) return { status: "fail", message: `${nonPublished.length} non-published community holes leaked` };
      return { status: "pass", message: `${data.length} community holes OK` };
    });

    await runTest("API: Categories", async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) return { status: "fail", message: `HTTP ${res.status}` };
      const data = await res.json();
      if (!Array.isArray(data)) return { status: "fail", message: "Not an array" };
      if (data.length === 0) return { status: "warn", message: "No categories found" };
      return { status: "pass", message: `${data.length} categories` };
    });

    await runTest("API: Search", async () => {
      const res = await fetch("/api/search?q=test");
      if (!res.ok) return { status: "fail", message: `HTTP ${res.status}` };
      const data = await res.json();
      if (!data.holes || !data.sources || !data.claims) return { status: "fail", message: "Missing search result fields" };
      return { status: "pass", message: `Search returned ${data.holes.length} holes, ${data.sources.length} sources, ${data.claims.length} claims` };
    });

    await runTest("API: Sources List", async () => {
      const res = await fetch("/api/sources");
      if (!res.ok) return { status: "fail", message: `HTTP ${res.status}` };
      const data = await res.json();
      return { status: "pass", message: `${data.length} sources` };
    });

    const holesRes = await fetch("/api/holes");
    const publishedHoles: RabbitHole[] = await holesRes.json();

    for (const hole of publishedHoles.slice(0, 5)) {
      await runTest(`Hole Detail: ${hole.title}`, async () => {
        const res = await fetch(`/api/holes/${hole.slug}`);
        if (!res.ok) return { status: "fail", message: `HTTP ${res.status}` };
        const data = await res.json();
        if (data.slug !== hole.slug) return { status: "fail", message: "Slug mismatch" };
        return { status: "pass", message: `Loaded: ${data.title}` };
      });

      await runTest(`Depth Nodes: ${hole.title}`, async () => {
        const res = await fetch(`/api/holes/${hole.slug}/depth-nodes`);
        if (!res.ok) return { status: "fail", message: `HTTP ${res.status}` };
        const data = await res.json();
        if (data.length === 0) return { status: "warn", message: "No depth nodes (published hole)" };
        const sorted = data.every((n: any, i: number) => i === 0 || n.position >= data[i-1].position);
        if (!sorted) return { status: "warn", message: `${data.length} nodes but position order may be incorrect` };
        return { status: "pass", message: `${data.length} nodes in order` };
      });

      await runTest(`Claims: ${hole.title}`, async () => {
        const res = await fetch(`/api/holes/${hole.slug}/claims`);
        if (!res.ok) return { status: "fail", message: `HTTP ${res.status}` };
        const data = await res.json();
        const invalid = data.filter((c: any) => c.confidence < 0 || c.confidence > 100);
        if (invalid.length > 0) return { status: "warn", message: `${invalid.length} claims with out-of-range confidence` };
        return { status: "pass", message: `${data.length} claims` };
      });

      await runTest(`Sources: ${hole.title}`, async () => {
        const res = await fetch(`/api/holes/${hole.slug}/sources`);
        if (!res.ok) return { status: "fail", message: `HTTP ${res.status}` };
        const data = await res.json();
        const invalid = data.filter((s: any) => s.credibility < 0 || s.credibility > 100);
        if (invalid.length > 0) return { status: "warn", message: `${invalid.length} sources with out-of-range credibility` };
        return { status: "pass", message: `${data.length} sources` };
      });

      await runTest(`Comments: ${hole.title}`, async () => {
        const res = await fetch(`/api/holes/${hole.slug}/comments`);
        if (!res.ok) return { status: "fail", message: `HTTP ${res.status}` };
        const data = await res.json();
        return { status: "pass", message: `${data.length} comments` };
      });
    }

    await runTest("Admin: Unauthenticated Access Blocked", async () => {
      const res = await fetch("/api/admin/export");
      if (res.status === 401) return { status: "pass", message: "Admin route properly blocked (401)" };
      return { status: "fail", message: `Expected 401, got ${res.status}` };
    });

    await runTest("Connection Integrity", async () => {
      const allSlugs = new Set(publishedHoles.map(h => h.slug));
      let brokenCount = 0;
      for (const hole of publishedHoles) {
        const connected = (hole.connectedSlugs as string[]) || [];
        for (const cs of connected) {
          if (!allSlugs.has(cs)) brokenCount++;
        }
      }
      if (brokenCount > 0) return { status: "warn", message: `${brokenCount} broken connection reference(s)` };
      return { status: "pass", message: "All connection slugs are valid" };
    });

    const s = { total: allResults.length, pass: allResults.filter(r => r.status === "pass").length, fail: allResults.filter(r => r.status === "fail").length, warn: allResults.filter(r => r.status === "warn").length };
    setSummary(s);
    setRunning(false);
  };

  const statusIcon = (status: TestStatus) => {
    switch (status) {
      case "pass": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "fail": return <XCircle className="w-4 h-4 text-red-500" />;
      case "warn": return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "running": return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
      default: return <div className="w-4 h-4 border border-white/10 rounded-full" />;
    }
  };

  return (
    <div className="min-h-screen" data-testid="page-qa">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold uppercase tracking-wider">QA Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1 font-mono">Automated integrity checks for all public endpoints</p>
          </div>
          <button onClick={runAllTests} disabled={running} className="bg-primary/10 border border-primary/30 text-primary px-6 py-3 font-mono text-xs uppercase hover:bg-primary/20 transition-colors flex items-center gap-2 disabled:opacity-50" data-testid="button-run-tests">
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {running ? "RUNNING..." : "RUN ALL TESTS"}
          </button>
        </div>

        {summary && (
          <div className={`border p-4 mb-6 ${summary.fail > 0 ? "border-red-500/20 bg-red-500/5" : "border-green-500/20 bg-green-500/5"}`} data-testid="test-summary">
            <div className="flex items-center gap-6 font-mono text-sm">
              <span className="text-muted-foreground">TOTAL: {summary.total}</span>
              <span className="text-green-500">PASS: {summary.pass}</span>
              <span className="text-red-500">FAIL: {summary.fail}</span>
              <span className="text-yellow-500">WARN: {summary.warn}</span>
            </div>
          </div>
        )}

        {results.length === 0 && !running && (
          <div className="text-center py-20 border border-dashed border-white/10">
            <RefreshCw className="w-8 h-8 text-muted-foreground/20 mx-auto mb-4" />
            <p className="font-mono text-sm text-muted-foreground">Click "RUN ALL TESTS" to start the QA checks</p>
          </div>
        )}

        <div className="space-y-1">
          {results.map((result, i) => (
            <div key={i} className="flex items-center gap-3 border border-white/5 px-4 py-2.5 hover:border-white/10 transition-colors" data-testid={`test-result-${i}`}>
              {statusIcon(result.status)}
              <span className="font-mono text-xs flex-1 min-w-0 truncate">{result.name}</span>
              <span className={`font-mono text-[10px] flex-shrink-0 ${result.status === "pass" ? "text-green-500/60" : result.status === "fail" ? "text-red-500/60" : "text-yellow-500/60"}`}>{result.message}</span>
              {result.duration !== undefined && <span className="font-mono text-[10px] text-muted-foreground/30 flex-shrink-0 w-12 text-right">{result.duration}ms</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
