
"use client";

import { useEffect, useRef, useState } from "react";
import { jsPDF } from "jspdf";

type Severity = "High" | "Medium" | "Low";

type Finding = {
  issue: string;
  severity: Severity;
  evidence: string;
  recommendation: string;
};

type TextResponse = {
  success?: boolean;
  summary?: string;
  findings?: Finding[];
  disclaimer?: string;
  error?: string;
};

type ImageResponse = {
  success?: boolean;
  summary?: string;
  findings?: Finding[];
  needsCorrection?: boolean;
  disclaimer?: string;
  error?: string;
};

type CorrectionResponse = {
  success?: boolean;
  correctedImage?: string;
  disclaimer?: string;
  error?: string;
};

type ReviewHistoryItem = {
  id: string;
  type: "Text Review" | "Image Review";
  createdAt: string;
  summary: string;
  findings: Finding[];
};

const HISTORY_KEY = "brandsentinel-review-history-v1";
const MAX_HISTORY_ITEMS = 50;

const defaultGuidelines =
  "Use accurate product information. Avoid unsupported claims. " +
  "Maintain a professional and trustworthy tone. " +
  "Do not make guarantees that cannot be substantiated.";

const exampleContent =
  "Our product is the best in India and guarantees 100% success " +
  "for every customer. Try it today and transform your results instantly.";

const severityStyles: Record<Severity, string> = {
  High: "border-red-400/25 bg-red-400/10 text-red-300",
  Medium: "border-amber-400/25 bg-amber-400/10 text-amber-300",
  Low: "border-sky-400/25 bg-sky-400/10 text-sky-300",
};

const panel =
  "rounded-2xl border border-white/[0.09] bg-[#10141d]/90";

const labelStyle =
  "text-[11px] font-semibold uppercase tracking-[0.19em] text-slate-400";

function getSeverityCounts(findings: Finding[]) {
  return {
    High: findings.filter((item) => item.severity === "High").length,
    Medium: findings.filter((item) => item.severity === "Medium").length,
    Low: findings.filter((item) => item.severity === "Low").length,
  };
}

function isHistoryItem(value: unknown): value is ReviewHistoryItem {
  if (!value || typeof value !== "object") return false;

  const item = value as Partial<ReviewHistoryItem>;

  return (
    typeof item.id === "string" &&
    (item.type === "Text Review" || item.type === "Image Review") &&
    typeof item.createdAt === "string" &&
    typeof item.summary === "string" &&
    Array.isArray(item.findings)
  );
}

export default function Home() {
  const [brandRules, setBrandRules] = useState(defaultGuidelines);
  const [content, setContent] = useState(exampleContent);

  const [textLoading, setTextLoading] = useState(false);
  const [textError, setTextError] = useState("");
  const [textSummary, setTextSummary] = useState("");
  const [textFindings, setTextFindings] = useState<Finding[]>([]);
  const [textDisclaimer, setTextDisclaimer] = useState("");

  const [adImage, setAdImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageReviewLoading, setImageReviewLoading] = useState(false);
  const [imageReviewError, setImageReviewError] = useState("");
  const [imageReview, setImageReview] = useState<ImageResponse | null>(null);

  const [correctedImage, setCorrectedImage] = useState("");
  const [correctionLoading, setCorrectionLoading] = useState(false);
  const [correctionError, setCorrectionError] = useState("");
  const [correctionDisclaimer, setCorrectionDisclaimer] = useState("");

  const [history, setHistory] = useState<ReviewHistoryItem[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history once when the page opens.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(HISTORY_KEY);

      if (saved) {
        const parsed: unknown = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setHistory(
            parsed
              .filter(isHistoryItem)
              .slice(0, MAX_HISTORY_ITEMS)
          );
        }
      }
    } catch {
      console.warn("Could not load saved review history.");
    } finally {
      setHistoryLoaded(true);
    }
  }, []);

  // Persist history after it has been loaded.
  useEffect(() => {
    if (!historyLoaded) return;

    try {
      window.localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(history)
      );
    } catch {
      console.warn("Could not save review history.");
    }
  }, [history, historyLoaded]);

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  function saveHistory(
    type: ReviewHistoryItem["type"],
    summary: string,
    findings: Finding[]
  ) {
    const item: ReviewHistoryItem = {
      id: crypto.randomUUID(),
      type,
      createdAt: new Date().toISOString(),
      summary,
      findings: findings.map((finding) => ({
        issue: finding.issue,
        severity: finding.severity,
        evidence: finding.evidence,
        recommendation: finding.recommendation,
      })),
    };

    setHistory((previous) =>
      [item, ...previous].slice(0, MAX_HISTORY_ITEMS)
    );
  }

  function deleteHistoryItem(id: string) {
    setHistory((previous) =>
      previous.filter((item) => item.id !== id)
    );
  }

  function clearHistory() {
    if (history.length === 0) return;

    if (window.confirm("Delete all saved review history?")) {
      setHistory([]);
    }
  }

  async function analyzeContent() {
    setTextLoading(true);
    setTextError("");
    setTextSummary("");
    setTextFindings([]);
    setTextDisclaimer("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guidelines: brandRules,
          content,
        }),
      });

      const data: TextResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Content analysis failed.");
      }

      const summary = data.summary || "Analysis completed.";
      const findings = data.findings || [];

      setTextSummary(summary);
      setTextFindings(findings);
      setTextDisclaimer(data.disclaimer || "");

      saveHistory("Text Review", summary, findings);
    } catch (error) {
      setTextError(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setTextLoading(false);
    }
  }

  function loadExample() {
    setContent(exampleContent);
    setBrandRules(defaultGuidelines);
    setTextError("");
    setTextSummary("");
    setTextFindings([]);
    setTextDisclaimer("");
  }

  function resetTextReport() {
    setTextError("");
    setTextSummary("");
    setTextFindings([]);
    setTextDisclaimer("");
  }

  function selectImage(file?: File) {
    if (!file) return;

    setImageReviewError("");
    setImageReview(null);
    setCorrectedImage("");
    setCorrectionError("");
    setCorrectionDisclaimer("");

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setImageReviewError("Please select a PNG, JPG, or WEBP image.");
      return;
    }

    if (file.size === 0 || file.size > 5 * 1024 * 1024) {
      setImageReviewError("The image must be smaller than 5 MB.");
      return;
    }

    setAdImage(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function reviewAdvertisement() {
    if (!adImage) {
      setImageReviewError("Upload an advertisement image first.");
      return;
    }

    if (!brandRules.trim()) {
      setImageReviewError("Enter your brand guidelines first.");
      return;
    }

    setImageReviewLoading(true);
    setImageReviewError("");
    setImageReview(null);
    setCorrectedImage("");
    setCorrectionError("");
    setCorrectionDisclaimer("");

    try {
      const formData = new FormData();
      formData.append("image", adImage);
      formData.append("guidelines", brandRules);

      const response = await fetch("/api/review-image", {
        method: "POST",
        body: formData,
      });

      const data: ImageResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Advertisement review failed.");
      }

      setImageReview(data);

      saveHistory(
        "Image Review",
        data.summary || "Advertisement review completed.",
        data.findings || []
      );
    } catch (error) {
      setImageReviewError(
        error instanceof Error ? error.message : "Image review failed."
      );
    } finally {
      setImageReviewLoading(false);
    }
  }

  async function generateCorrection() {
    if (!adImage || !imageReview) {
      setCorrectionError("Review an advertisement before correcting it.");
      return;
    }

    const findings = imageReview.findings || [];

    if (findings.length === 0) {
      setCorrectionError(
        "No issues were identified. The original image remains unchanged."
      );
      return;
    }

    setCorrectionLoading(true);
    setCorrectionError("");
    setCorrectedImage("");
    setCorrectionDisclaimer("");

    try {
      const formData = new FormData();
      formData.append("image", adImage);
      formData.append("guidelines", brandRules);
      formData.append("findings", JSON.stringify(findings));

      const response = await fetch("/api/correct-image", {
        method: "POST",
        body: formData,
      });

      const data: CorrectionResponse = await response.json();

      if (!response.ok || !data.success || !data.correctedImage) {
        throw new Error(data.error || "Image correction failed.");
      }

      setCorrectedImage(data.correctedImage);
      setCorrectionDisclaimer(data.disclaimer || "");
    } catch (error) {
      setCorrectionError(
        error instanceof Error
          ? error.message
          : "Unable to generate the corrected image."
      );
    } finally {
      setCorrectionLoading(false);
    }
  }

  function downloadCorrectedImage() {
    if (!correctedImage) return;

    const link = document.createElement("a");
    link.href = correctedImage;
    link.download = "brandsentinel-corrected-ad.png";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function downloadAnalysisReport() {
    if (!textSummary && !imageReview) return;

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 18;
    const contentWidth = pageWidth - margin * 2;
    let y = 20;

    function ensureSpace(height: number) {
      if (y + height > pageHeight - 18) {
        pdf.addPage();
        y = 20;
      }
    }

    function addHeading(title: string) {
      ensureSpace(12);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text(title, margin, y);
      y += 9;
    }

    function addParagraph(label: string, value: string) {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);

      const labelLines = pdf.splitTextToSize(label, contentWidth);
      ensureSpace(labelLines.length * 5 + 2);
      pdf.text(labelLines, margin, y);
      y += labelLines.length * 5 + 1;

      pdf.setFont("helvetica", "normal");
      const lines = pdf.splitTextToSize(
        value || "Not provided",
        contentWidth
      );

      for (const line of lines) {
        ensureSpace(6);
        pdf.text(line, margin, y);
        y += 5;
      }

      y += 3;
    }

    function addFindings(title: string, findings: Finding[]) {
      addHeading(title);

      if (findings.length === 0) {
        addParagraph(
          "Result",
          "No meaningful issues were identified by this review."
        );
        return;
      }

      findings.forEach((finding, index) => {
        addParagraph(
          `${index + 1}. ${finding.issue} [${finding.severity}]`,
          `Evidence: ${finding.evidence}\nRecommendation: ${finding.recommendation}`
        );
      });
    }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(21);
    pdf.text("BrandSentinel AI", margin, y);
    y += 9;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text("Brand Governance Analysis Report", margin, y);
    y += 7;

    pdf.setFontSize(9);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
    y += 10;

    pdf.setDrawColor(180);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 9;

    addHeading("Brand Guidelines");
    addParagraph("Guidelines used", brandRules);

    if (textSummary || textFindings.length > 0) {
      addHeading("Text Analysis");
      addParagraph("Marketing content", content);
      addParagraph("Summary", textSummary);
      addFindings("Text Findings", textFindings);

      if (textDisclaimer) {
        addParagraph("Text review disclaimer", textDisclaimer);
      }
    }

    if (imageReview) {
      addHeading("Advertisement Review");
      addParagraph("Summary", imageReview.summary || "");
      addFindings("Visual Findings", imageReview.findings || []);

      if (imageReview.disclaimer) {
        addParagraph("Image review disclaimer", imageReview.disclaimer);
      }
    }

    if (correctedImage) {
      addParagraph(
        "Correction status",
        "An AI-generated corrected creative was produced during this session. The image itself is not embedded in this report."
      );
    }

    addParagraph(
      "Important Disclaimer",
      "This report contains AI-assisted preliminary findings. It does not guarantee legal, factual, or brand compliance. Human verification is required before publication."
    );

    const pageCount = pdf.getNumberOfPages();

    for (let page = 1; page <= pageCount; page++) {
      pdf.setPage(page);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.text(
        `BrandSentinel AI | Page ${page} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: "center" }
      );
    }

    pdf.save("brandsentinel-analysis-report.pdf");
  }

  const textCounts = getSeverityCounts(textFindings);
  const imageFindings = imageReview?.findings || [];
  const imageCounts = getSeverityCounts(imageFindings);

  const totalIssues = textFindings.length + imageFindings.length;
  const hasReport = Boolean(textSummary || imageReview);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#080b11] text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-48 top-0 h-[420px] w-[420px] rounded-full bg-cyan-500/[0.07] blur-[130px]" />
        <div className="absolute -right-48 top-[380px] h-[480px] w-[480px] rounded-full bg-blue-600/[0.08] blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-[1450px] px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex flex-wrap items-center justify-between gap-5 border-b border-white/[0.08] pb-6">
          <a href="#" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-200">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-6 w-6"
                stroke="currentColor"
                strokeWidth="1.7"
              >
                <path d="M12 3 20 6v5c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V6l8-3Z" />
                <path d="m8.5 12 2.2 2.2 4.8-5" />
              </svg>
            </div>

            <div>
              <div className="text-sm font-bold tracking-wide">
                BrandSentinel <span className="text-cyan-300">AI</span>
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                Brand governance workspace
              </div>
            </div>
          </a>

          <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-2 text-xs text-emerald-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            Analysis system ready
          </div>
        </header>

        <section className="grid gap-8 py-12 md:grid-cols-[1fr_auto] md:items-end md:py-16">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.06] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-200">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
              Content integrity intelligence
            </div>

            <h1 className="max-w-3xl text-4xl font-semibold leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl">
              Keep every message
              <span className="block bg-gradient-to-r from-cyan-200 via-sky-300 to-blue-400 bg-clip-text text-transparent">
                on brand.
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
              Review marketing copy and advertisements against your brand
              guidelines. Find potential issues and generate a corrected
              creative for human review.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:min-w-[270px]">
            <div className={`${panel} p-4`}>
              <div className={labelStyle}>Findings</div>
              <div className="mt-3 text-3xl font-semibold tabular-nums">
                {totalIssues}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Current session
              </div>
            </div>

            <div className={`${panel} p-4`}>
              <div className={labelStyle}>Modules</div>
              <div className="mt-3 text-3xl font-semibold">02</div>
              <div className="mt-1 text-xs text-slate-500">
                Text + visual
              </div>
            </div>
          </div>
        </section>

        {hasReport && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-300/15 bg-cyan-300/[0.04] p-4">
            <div>
              <div className="text-sm font-medium text-slate-100">
                Analysis report ready
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Export the findings and recommendations from this session.
              </p>
            </div>

            <button
              type="button"
              onClick={downloadAnalysisReport}
              className="rounded-xl border border-cyan-300/25 bg-cyan-300/[0.08] px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/[0.15]"
            >
              ↓ Download PDF Report
            </button>
          </div>
        )}

        {/* Review History */}
        <section className={`${panel} mb-5 p-5 sm:p-7`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className={labelStyle}>Workspace / 03</div>
              <h2 className="mt-2 text-xl font-semibold">Review History</h2>
              <p className="mt-2 text-sm text-slate-400">
                Revisit previously completed text and advertisement reviews.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-400">
                {history.length} / {MAX_HISTORY_ITEMS} saved
              </span>

              {history.length > 0 && (
                <button
                  type="button"
                  onClick={clearHistory}
                  className="rounded-lg border border-red-400/20 px-3 py-2 text-xs text-red-300 hover:bg-red-400/10"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          <p className="mt-3 text-xs leading-5 text-slate-500">
            History is stored locally in this browser. It is not synced across
            devices. Review summaries and findings are saved; image files and
            base64 image data are not stored in history.
          </p>

          {!historyLoaded ? (
            <p className="mt-6 text-sm text-slate-400">
              Loading history...
            </p>
          ) : history.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-white/10 p-8 text-center">
              <p className="text-sm font-medium text-slate-300">
                No saved reviews yet
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Complete a text analysis or advertisement review to see it here.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {history.map((item) => (
                <details
                  key={item.id}
                  className="group rounded-xl border border-white/[0.08] bg-[#0b0f17] p-4"
                >
                  <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-slate-200">
                          {item.type}
                        </span>
                        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-slate-400">
                          {item.findings.length} findings
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-slate-500">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>

                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">
                        {item.summary}
                      </p>
                    </div>

                    <span className="text-xs text-cyan-200 group-open:hidden">
                      View details ↓
                    </span>
                    <span className="hidden text-xs text-cyan-200 group-open:inline">
                      Hide details ↑
                    </span>
                  </summary>

                  <div className="mt-5 border-t border-white/[0.08] pt-4">
                    <SeverityCounts
                      counts={getSeverityCounts(item.findings)}
                    />

                    <div className="mt-4 space-y-3">
                      {item.findings.length > 0 ? (
                        item.findings.map((finding, index) => (
                          <FindingCard
                            key={`${item.id}-${index}`}
                            finding={finding}
                          />
                        ))
                      ) : (
                        <p className="text-sm text-emerald-200">
                          No findings were recorded for this review.
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteHistoryItem(item.id)}
                      className="mt-4 rounded-lg border border-red-400/20 px-3 py-2 text-xs text-red-300 hover:bg-red-400/10"
                    >
                      Delete this review
                    </button>
                  </div>
                </details>
              ))}
            </div>
          )}
        </section>

        <div className="grid gap-5 xl:grid-cols-2">
          {/* Text analysis */}
          <section className={`${panel} p-5 sm:p-7`}>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className={labelStyle}>Workspace / 01</div>
                <h2 className="mt-2 text-xl font-semibold">
                  Content intelligence
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  Check marketing copy against your brand rules.
                </p>
              </div>
              <span className="rounded-lg border border-white/10 px-2.5 py-1 text-[10px] text-slate-400">
                TEXT
              </span>
            </div>

            <label htmlFor="brand-guidelines" className="mb-2 block text-sm font-medium">
              Brand guidelines
            </label>

            <textarea
              id="brand-guidelines"
              value={brandRules}
              onChange={(event) => setBrandRules(event.target.value)}
              maxLength={5000}
              rows={4}
              placeholder="Enter your brand voice, approved claims, and restrictions..."
              className="w-full resize-y rounded-xl border border-white/10 bg-[#090d14] px-4 py-3 text-sm leading-6 text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50"
            />

            <div className="mb-6 mt-2 text-right text-[10px] text-slate-500">
              {brandRules.length}/5000 characters
            </div>

            <label htmlFor="marketing-content" className="mb-2 block text-sm font-medium">
              Marketing content
            </label>

            <textarea
              id="marketing-content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              maxLength={15000}
              rows={5}
              placeholder="Paste your advertisement copy, product description, or campaign..."
              className="w-full resize-y rounded-xl border border-white/10 bg-[#090d14] px-4 py-3 text-sm leading-6 text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50"
            />

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={loadExample}
                className="text-xs text-slate-400 transition hover:text-cyan-200"
              >
                Load example
              </button>

              <button
                type="button"
                onClick={analyzeContent}
                disabled={textLoading || !content.trim() || !brandRules.trim()}
                className="rounded-xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {textLoading ? "Analyzing content..." : "Analyze content →"}
              </button>
            </div>

            {textError && <ErrorMessage message={textError} />}

            {(textSummary || textFindings.length > 0) && (
              <div className="mt-7 border-t border-white/[0.08] pt-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-semibold">Analysis report</h3>
                  <SeverityCounts counts={textCounts} />
                </div>

                {textSummary && (
                  <p className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-sm leading-6 text-slate-300">
                    {textSummary}
                  </p>
                )}

                <div className="mt-4 space-y-3">
                  {textFindings.map((finding, index) => (
                    <FindingCard key={`text-${index}`} finding={finding} />
                  ))}

                  {textFindings.length === 0 && (
                    <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.05] p-4 text-sm text-emerald-200">
                      No meaningful issues were identified by this review.
                    </div>
                  )}
                </div>

                {textDisclaimer && (
                  <p className="mt-4 text-xs leading-5 text-slate-500">
                    {textDisclaimer}
                  </p>
                )}

                <button
                  type="button"
                  onClick={resetTextReport}
                  className="mt-4 text-xs text-slate-400 hover:text-white"
                >
                  Clear report
                </button>
              </div>
            )}
          </section>

          {/* Image analysis */}
          <section className={`${panel} p-5 sm:p-7`}>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className={labelStyle}>Visual intelligence / 02</div>
                <h2 className="mt-2 text-xl font-semibold">
                  Advertisement review
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  Inspect a creative and address the detected issues.
                </p>
              </div>
              <span className="rounded-lg border border-white/10 px-2.5 py-1 text-[10px] text-slate-400">
                IMAGE
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(event) => {
                selectImage(event.target.files?.[0]);
                event.currentTarget.value = "";
              }}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group flex min-h-[160px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-[#090d14] p-6 text-center transition hover:border-cyan-300/40 hover:bg-cyan-300/[0.025]"
            >
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/[0.07] text-cyan-200">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-5 w-5"
                >
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
              </div>

              <span className="text-sm font-medium">
                {adImage ? adImage.name : "Upload advertisement creative"}
              </span>

              <span className="mt-2 text-xs text-slate-500">
                PNG, JPG or WEBP · Maximum 5 MB
              </span>

              <span className="mt-3 text-xs text-cyan-200">
                {adImage ? "Choose another image" : "Browse files"}
              </span>
            </button>

            {imageReviewError && <ErrorMessage message={imageReviewError} />}

            <button
              type="button"
              onClick={reviewAdvertisement}
              disabled={imageReviewLoading || !adImage || !brandRules.trim()}
              className="mt-4 w-full rounded-xl border border-cyan-300/25 bg-cyan-300/[0.08] px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/[0.14] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {imageReviewLoading
                ? "Reviewing advertisement..."
                : "Review advertisement →"}
            </button>

            {imageReviewLoading && (
              <LoadingMessage message="Checking visible text, brand consistency, and potential claims..." />
            )}

            {imagePreview && (
              <div className="mt-6">
                <div className={labelStyle}>Original creative</div>
                <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-[#090d14]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Original advertisement"
                    className="mx-auto max-h-[360px] w-full object-contain"
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Original upload is preserved and not overwritten.
                </p>
              </div>
            )}

            {imageReview && (
              <div className="mt-7 border-t border-white/[0.08] pt-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-semibold">Visual findings</h3>
                  <SeverityCounts counts={imageCounts} />
                </div>

                {imageReview.summary && (
                  <p className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-sm leading-6 text-slate-300">
                    {imageReview.summary}
                  </p>
                )}

                <div className="mt-4 space-y-3">
                  {imageFindings.map((finding, index) => (
                    <FindingCard key={`image-${index}`} finding={finding} />
                  ))}
                </div>

                {imageFindings.length === 0 ? (
                  <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.05] p-4">
                    <div className="text-sm font-medium text-emerald-200">
                      No meaningful issues identified
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-400">
                      The original advertisement remains unchanged. This
                      preliminary AI review is not a guarantee of compliance.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/[0.04] p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-amber-200">
                      <span className="h-2 w-2 rounded-full bg-amber-300" />
                      Correction recommended
                    </div>

                    <p className="mt-2 text-xs leading-5 text-slate-400">
                      Generate a revised creative using the findings and your
                      brand guidelines. Review the result before publishing.
                    </p>

                    <button
                      type="button"
                      onClick={generateCorrection}
                      disabled={correctionLoading}
                      className="mt-4 w-full rounded-xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {correctionLoading
                        ? "Generating corrected creative..."
                        : "✦ Generate correction"}
                    </button>

                    {correctionLoading && (
                      <LoadingMessage message="The image model is generating a revised creative. This may take a little while." />
                    )}

                    {correctionError && (
                      <ErrorMessage message={correctionError} />
                    )}

                    {correctedImage && (
                      <div className="mt-6">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className={labelStyle}>
                              Generated creative
                            </div>
                            <h4 className="mt-2 font-semibold text-emerald-200">
                              Correction generated
                            </h4>
                          </div>

                          <button
                            type="button"
                            onClick={downloadCorrectedImage}
                            className="rounded-lg border border-cyan-300/25 px-3 py-2 text-xs font-medium text-cyan-100 hover:bg-cyan-300/10"
                          >
                            ↓ Download image
                          </button>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="min-w-0">
                            <div className="mb-2 text-xs font-medium text-slate-400">
                              Original
                            </div>
                            <div className="overflow-hidden rounded-xl border border-white/10 bg-[#090d14]">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={imagePreview}
                                alt="Original advertisement"
                                className="w-full object-contain"
                              />
                            </div>
                          </div>

                          <div className="min-w-0">
                            <div className="mb-2 text-xs font-medium text-cyan-200">
                              AI-corrected version
                            </div>
                            <div className="overflow-hidden rounded-xl border border-cyan-300/20 bg-[#090d14]">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={correctedImage}
                                alt="AI-generated corrected advertisement"
                                className="w-full object-contain"
                              />
                            </div>
                          </div>
                        </div>

                        {correctionDisclaimer && (
                          <p className="mt-4 text-xs leading-5 text-slate-400">
                            {correctionDisclaimer}
                          </p>
                        )}

                        <p className="mt-3 text-xs leading-5 text-amber-200/80">
                          Before publication, manually verify all text,
                          spelling, logos, product details, and claims.
                          Generated images may alter these elements.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {imageReview.disclaimer && (
                  <p className="mt-4 text-xs leading-5 text-slate-500">
                    {imageReview.disclaimer}
                  </p>
                )}
              </div>
            )}
          </section>
        </div>

        <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] py-6 text-xs text-slate-500">
          <span>BrandSentinel AI · Content integrity workspace</span>
          <span>AI-assisted review · Human verification required</span>
        </footer>
      </div>
    </main>
  );
}

function FindingCard({ finding }: { finding: Finding }) {
  return (
    <article className="rounded-xl border border-white/[0.08] bg-[#0b0f17] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h4 className="text-sm font-medium leading-6 text-slate-200">
          {finding.issue}
        </h4>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
            severityStyles[finding.severity]
          }`}
        >
          {finding.severity}
        </span>
      </div>

      <div className="mt-4">
        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Evidence
        </div>
        <p className="mt-1 text-sm leading-6 text-slate-400">
          {finding.evidence}
        </p>
      </div>

      <div className="mt-4 rounded-lg border border-cyan-300/10 bg-cyan-300/[0.035] p-3">
        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-200">
          Recommendation
        </div>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          {finding.recommendation}
        </p>
      </div>
    </article>
  );
}

function SeverityCounts({
  counts,
}: {
  counts: Record<Severity, number>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {(["High", "Medium", "Low"] as Severity[]).map((severity) => (
        <span
          key={severity}
          className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${
            severityStyles[severity]
          }`}
        >
          {severity} {counts[severity]}
        </span>
      ))}
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="mt-4 rounded-xl border border-red-400/20 bg-red-400/[0.06] p-3 text-sm leading-6 text-red-200"
    >
      {message}
    </div>
  );
}

function LoadingMessage({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="mt-4 flex items-start gap-3 rounded-xl border border-cyan-300/15 bg-cyan-300/[0.04] p-3 text-xs leading-5 text-slate-300"
    >
      <span className="mt-1 h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-cyan-200/30 border-t-cyan-200" />
      {message}
    </div>
  );
}
