
"use client";

import { useState } from "react";

type Finding = {
  issue: string;
  severity: "High" | "Medium" | "Low";
  evidence: string;
  recommendation: string;
};

type AnalysisResponse = {
  success?: boolean;
  mode?: string;
  summary?: string;
  findings?: Finding[];
  disclaimer?: string;
  error?: string;
};

const defaultGuidelines =
  "Use accurate product information. Avoid unsupported claims. Maintain a professional and trustworthy tone. Do not make guarantees that cannot be substantiated.";

const exampleContent =
  "Our product is the best in India and guarantees 100% success for every customer. Try it today and transform your results instantly.";

export default function Home() {
  const [brandRules, setBrandRules] = useState(defaultGuidelines);
  const [content, setContent] = useState("");
  const [findings, setFindings] = useState<Finding[]>([]);
  const [summary, setSummary] = useState("");
  const [disclaimer, setDisclaimer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  async function analyzeContent() {
    setError("");
    setSummary("");
    setFindings([]);
    setDisclaimer("");
    setAnalyzed(false);

    if (!brandRules.trim() || !content.trim()) {
      setError(
        "Please enter both brand guidelines and marketing content."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          guidelines: brandRules,
          content,
        }),
      });

      const data: AnalysisResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed. Please try again.");
      }

      if (
        typeof data.summary !== "string" ||
        !Array.isArray(data.findings)
      ) {
        throw new Error("The server returned an unexpected response.");
      }

      setSummary(data.summary);
      setFindings(data.findings);
      setDisclaimer(data.disclaimer || "");
      setAnalyzed(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to analyze content. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function loadExample() {
    setContent(exampleContent);
    setError("");
    setSummary("");
    setFindings([]);
    setDisclaimer("");
    setAnalyzed(false);
  }

  function resetAnalysis() {
    setContent("");
    setFindings([]);
    setSummary("");
    setDisclaimer("");
    setError("");
    setAnalyzed(false);
  }

  const highCount = findings.filter(
    (finding) => finding.severity === "High"
  ).length;

  const mediumCount = findings.filter(
    (finding) => finding.severity === "Medium"
  ).length;

  const lowCount = findings.filter(
    (finding) => finding.severity === "Low"
  ).length;

  return (
    <main className="min-h-screen bg-[#08090c] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-48 left-1/4 h-96 w-96 rounded-full bg-cyan-500/[0.07] blur-[120px]" />
        <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-blue-600/[0.06] blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 py-6 sm:px-8">
        <header className="flex flex-wrap items-center justify-between gap-5 border-b border-white/[0.08] pb-6">
          <a href="#home" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-400/[0.08]">
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6 text-cyan-300"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
              >
                <path d="M12 3 20 6v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3Z" />
                <path d="m8.5 12 2.2 2.2 4.8-5" />
              </svg>
            </div>

            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                BrandSentinel<span className="text-cyan-300"> AI</span>
              </h1>
              <p className="text-xs text-zinc-500">
                Brand governance platform
              </p>
            </div>
          </a>

          <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-2 text-xs text-emerald-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            Analysis system ready
          </div>
        </header>

        <section id="home" className="py-12 sm:py-16">
          <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-cyan-300">
            <span className="h-px w-7 bg-cyan-300" />
            AI-powered content governance
          </div>

          <h2 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
            Keep every message
            <span className="block text-zinc-500">
              on brand.
            </span>
          </h2>

          <p className="mt-5 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">
            Review marketing content against your brand guidelines.
            Identify risky claims, inconsistent messaging, and wording
            that needs human review before publication.
          </p>

          <div className="mt-7 flex flex-wrap gap-3 text-xs text-zinc-400">
            <span className="rounded-full border border-white/10 px-3 py-2">
              Guideline-based review
            </span>
            <span className="rounded-full border border-white/10 px-3 py-2">
              Risk classification
            </span>
            <span className="rounded-full border border-white/10 px-3 py-2">
              Actionable recommendations
            </span>
          </div>
        </section>

        <section
          id="analysis"
          className="grid items-start gap-6 lg:grid-cols-[1fr_0.9fr]"
        >
          <div className="rounded-2xl border border-white/[0.09] bg-[#101116]/90 p-5 sm:p-7">
            <div className="mb-7 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">
                  Workspace / 01
                </p>
                <h3 className="mt-2 text-xl font-semibold">
                  Content review
                </h3>
                <p className="mt-2 text-sm text-zinc-500">
                  Define your standards and submit copy for review.
                </p>
              </div>

              <div className="hidden rounded-lg border border-white/10 p-2 text-zinc-400 sm:block">
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
                  <path d="M14 3v5h5M9 13h6M9 17h6" />
                </svg>
              </div>
            </div>

            <label
              htmlFor="guidelines"
              className="mb-2 block text-sm font-medium text-zinc-200"
            >
              Brand guidelines
            </label>

            <textarea
              id="guidelines"
              value={brandRules}
              onChange={(event) => setBrandRules(event.target.value)}
              maxLength={5000}
              placeholder="Enter your brand rules, tone, restrictions and approved claims..."
              className="min-h-32 w-full resize-y rounded-xl border border-white/10 bg-[#090a0e] p-4 text-sm leading-6 text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-cyan-400/50"
            />

            <div className="mt-2 text-right text-xs text-zinc-600">
              {brandRules.length}/5000
            </div>

            <div className="mb-2 mt-6 flex items-center justify-between gap-3">
              <label
                htmlFor="content"
                className="text-sm font-medium text-zinc-200"
              >
                Marketing content
              </label>

              <button
                type="button"
                onClick={loadExample}
                className="text-xs text-cyan-300 transition hover:text-cyan-200"
              >
                Load example
              </button>
            </div>

            <textarea
              id="content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              maxLength={15000}
              placeholder="Paste an advertisement, campaign, product description, or social media post..."
              className="min-h-48 w-full resize-y rounded-xl border border-white/10 bg-[#090a0e] p-4 text-sm leading-6 text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-cyan-400/50"
            />

            <div className="mt-2 text-right text-xs text-zinc-600">
              {content.length}/15000
            </div>

            {error && (
              <div
                role="alert"
                className="mt-5 rounded-xl border border-red-400/20 bg-red-400/[0.06] p-4 text-sm leading-6 text-red-300"
              >
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={analyzeContent}
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-cyan-300 px-5 py-4 text-sm font-semibold text-[#071014] transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                  Analyzing content...
                </>
              ) : (
                <>
                  Analyze content
                  <span aria-hidden="true">→</span>
                </>
              )}
            </button>

            <p className="mt-3 text-center text-xs leading-5 text-zinc-600">
              AI-assisted preliminary review. Human approval remains
              essential.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.09] bg-[#101116]/90 p-5 sm:p-7">
            <div className="mb-7">
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">
                Report / 02
              </p>
              <h3 className="mt-2 text-xl font-semibold">
                Analysis results
              </h3>
              <p className="mt-2 text-sm text-zinc-500">
                Findings and suggested next steps.
              </p>
            </div>

            {!analyzed && !loading && (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.05] text-cyan-300">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-7 w-7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m16 16 4 4M11 8v6M8 11h6" />
                  </svg>
                </div>

                <h4 className="mt-5 font-medium text-zinc-200">
                  Ready for analysis
                </h4>
                <p className="mt-2 max-w-xs text-sm leading-6 text-zinc-500">
                  Submit your content to generate a guideline-based
                  review and risk findings.
                </p>
              </div>
            )}

            {loading && (
              <div
                role="status"
                className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-white/10"
              >
                <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/10 border-t-cyan-300" />
                <p className="mt-5 font-medium text-zinc-200">
                  Reviewing your content
                </p>
                <p className="mt-2 text-sm text-zinc-500">
                  Checking claims and brand guideline alignment...
                </p>
              </div>
            )}

            {analyzed && (
              <div className="space-y-5">
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-wider text-zinc-500">
                      Review summary
                    </p>
                    <span className="rounded-full border border-cyan-300/20 px-2 py-1 text-[10px] text-cyan-300">
                      AI-assisted
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-zinc-300">
                    {summary}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-red-400/15 bg-red-400/[0.04] p-3">
                    <p className="text-xs text-zinc-500">High</p>
                    <p className="mt-2 text-2xl font-semibold text-red-300">
                      {highCount}
                    </p>
                  </div>

                  <div className="rounded-xl border border-amber-300/15 bg-amber-300/[0.04] p-3">
                    <p className="text-xs text-zinc-500">Medium</p>
                    <p className="mt-2 text-2xl font-semibold text-amber-200">
                      {mediumCount}
                    </p>
                  </div>

                  <div className="rounded-xl border border-sky-300/15 bg-sky-300/[0.04] p-3">
                    <p className="text-xs text-zinc-500">Low</p>
                    <p className="mt-2 text-2xl font-semibold text-sky-200">
                      {lowCount}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-medium text-zinc-200">
                    Findings ({findings.length})
                  </h4>
                  <button
                    type="button"
                    onClick={resetAnalysis}
                    className="text-xs text-zinc-500 transition hover:text-white"
                  >
                    Clear report
                  </button>
                </div>

                {findings.length === 0 && (
                  <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.05] p-4">
                    <p className="font-medium text-emerald-300">
                      No significant issues identified
                    </p>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      The AI did not identify any significant issues
                      against the supplied guidelines. This does not
                      guarantee that the content is fully compliant.
                    </p>
                  </div>
                )}

                {findings.map((finding, index) => {
                  const severityStyles = {
                    High: "border-red-400/20 bg-red-400/[0.06] text-red-300",
                    Medium:
                      "border-amber-300/20 bg-amber-300/[0.06] text-amber-200",
                    Low: "border-sky-300/20 bg-sky-300/[0.06] text-sky-200",
                  };

                  return (
                    <article
                      key={`${finding.issue}-${index}`}
                      className="rounded-xl border border-white/10 bg-[#0b0c10] p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="text-xs text-zinc-600">
                          Finding {String(index + 1).padStart(2, "0")}
                        </span>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${severityStyles[finding.severity]}`}
                        >
                          {finding.severity} risk
                        </span>
                      </div>

                      <h5 className="mt-3 font-medium leading-6 text-zinc-100">
                        {finding.issue}
                      </h5>

                      <p className="mt-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
                        Evidence
                      </p>
                      <p className="mt-2 rounded-lg bg-white/[0.03] p-3 text-sm leading-6 text-zinc-400">
                        “{finding.evidence}”
                      </p>

                      <p className="mt-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
                        Recommendation
                      </p>
                      <p className="mt-2 text-sm leading-6 text-zinc-300">
                        {finding.recommendation}
                      </p>
                    </article>
                  );
                })}

                {disclaimer && (
                  <p className="border-t border-white/10 pt-4 text-xs leading-5 text-zinc-600">
                    {disclaimer}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        <footer className="mt-12 flex flex-col justify-between gap-3 border-t border-white/[0.08] py-6 text-xs text-zinc-600 sm:flex-row">
          <p>BrandSentinel AI · Brand governance and content review</p>
          <p>AI supports the reviewer. Final decisions remain human.</p>
        </footer>
      </div>
    </main>
  );
}
