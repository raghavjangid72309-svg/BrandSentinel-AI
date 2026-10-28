
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
const BRAND_PROFILES_KEY = "brandsentinel-brand-profiles-v1";

type BrandProfile = {
  id: string;
  name: string;
  approvedClaims: string;
  restrictedTerms: string;
  toneRules: string;
  guidelines: string;
};

function isBrandProfile(value: unknown): value is BrandProfile {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<BrandProfile>;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.approvedClaims === "string" &&
    typeof item.restrictedTerms === "string" &&
    typeof item.toneRules === "string" &&
    typeof item.guidelines === "string"
  );
}

const defaultGuidelines =
  "Use accurate product information. Avoid unsupported claims. " +
  "Maintain a professional and trustworthy tone. " +
  "Do not make guarantees that cannot be substantiated.";

const guidelinePresets = [
  {
    name: "Trust-first",
    description: "Credible, careful, evidence-led",
    rules:
      "Use accurate product information and claims supported by evidence. " +
      "Maintain a professional, transparent, trustworthy tone. " +
      "Never promise guaranteed outcomes or use misleading urgency. " +
      "Clearly qualify limitations and avoid unsupported superlatives.",
  },
  {
    name: "Bold & energetic",
    description: "Confident, lively, action-oriented",
    rules:
      "Use confident, energetic language and clear calls to action. " +
      "Keep every product claim accurate and supportable. " +
      "Avoid exaggerated guarantees, misleading comparisons, and pressure tactics. " +
      "Sound ambitious without sacrificing trust.",
  },
  {
    name: "Minimal & premium",
    description: "Refined, concise, considered",
    rules:
      "Use concise, polished language with a calm, premium tone. " +
      "Avoid slang, excessive punctuation, hype, and cluttered messaging. " +
      "Use only verified product facts and substantiated claims. " +
      "Prioritize clarity, precision, and understated confidence.",
  },
  {
    name: "Friendly & accessible",
    description: "Warm, clear, human",
    rules:
      "Use warm, helpful, inclusive language that is easy to understand. " +
      "Explain benefits clearly without jargon or pressure. " +
      "Keep all product information accurate and avoid unsupported promises. " +
      "Be approachable while remaining respectful and professional.",
  },
];

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

  const [brandProfiles, setBrandProfiles] = useState<BrandProfile[]>([]);
  const [profilesLoaded, setProfilesLoaded] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [profileName, setProfileName] = useState("");
  const [approvedClaims, setApprovedClaims] = useState("");
  const [restrictedTerms, setRestrictedTerms] = useState("");
  const [toneRules, setToneRules] = useState("");
  const [profileMessage, setProfileMessage] = useState("");

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

  // Load saved brand profiles from this browser.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(BRAND_PROFILES_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setBrandProfiles(parsed.filter(isBrandProfile));
        }
      }
    } catch {
      console.warn("Could not load saved brand profiles.");
    } finally {
      setProfilesLoaded(true);
    }
  }, []);

  // Persist profiles after the initial load, avoiding overwriting storage on startup.
  useEffect(() => {
    if (!profilesLoaded) return;
    try {
      window.localStorage.setItem(BRAND_PROFILES_KEY, JSON.stringify(brandProfiles));
    } catch {
      setProfileMessage("Could not save profiles. Browser storage may be full.");
    }
  }, [brandProfiles, profilesLoaded]);

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  function applyBrandProfile(profile: BrandProfile) {
    setSelectedProfileId(profile.id);
    setProfileName(profile.name);
    setApprovedClaims(profile.approvedClaims);
    setRestrictedTerms(profile.restrictedTerms);
    setToneRules(profile.toneRules);
    setBrandRules(profile.guidelines);
    const additions = [
      profile.approvedClaims.trim() ? `Approved claims and facts:\n${profile.approvedClaims.trim()}` : "",
      profile.restrictedTerms.trim() ? `Restricted words and phrases:\n${profile.restrictedTerms.trim()}` : "",
      profile.toneRules.trim() ? `Tone of voice rules:\n${profile.toneRules.trim()}` : "",
    ].filter(Boolean);
    if (additions.length) {
      setBrandRules([profile.guidelines.trim(), ...additions].filter(Boolean).join("\n\n"));
    }
    setProfileMessage(`Loaded profile: ${profile.name}`);
  }

  function saveBrandProfile() {
    if (!profileName.trim()) {
      setProfileMessage("Enter a profile name before saving.");
      return;
    }
    if (!brandRules.trim()) {
      setProfileMessage("Enter brand guidelines before saving.");
      return;
    }

    const profile: BrandProfile = {
      id: selectedProfileId || crypto.randomUUID(),
      name: profileName.trim(),
      approvedClaims: approvedClaims.trim(),
      restrictedTerms: restrictedTerms.trim(),
      toneRules: toneRules.trim(),
      guidelines: brandRules.trim(),
    };

    setBrandProfiles((previous) => {
      const exists = previous.some((item) => item.id === profile.id);
      return exists
        ? previous.map((item) => item.id === profile.id ? profile : item)
        : [profile, ...previous];
    });
    setSelectedProfileId(profile.id);
    setProfileMessage(`Saved "${profile.name}" in this browser.`);
  }

  function createNewBrandProfile() {
    setSelectedProfileId("");
    setProfileName("");
    setApprovedClaims("");
    setRestrictedTerms("");
    setToneRules("");
    setBrandRules(defaultGuidelines);
    setProfileMessage("Ready to create a new brand profile.");
  }

  function deleteBrandProfile() {
    if (!selectedProfileId) return;
    const profile = brandProfiles.find((item) => item.id === selectedProfileId);
    if (!profile) return;
    if (!window.confirm(`Delete the "${profile.name}" profile?`)) return;

    setBrandProfiles((previous) => previous.filter((item) => item.id !== selectedProfileId));
    createNewBrandProfile();
    setProfileMessage(`Deleted "${profile.name}".`);
  }

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
    <main className="brandsentinel-page min-h-screen overflow-x-hidden bg-[#070910] text-slate-100">
      <style jsx global>{`
        @keyframes bs-fade-up {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bs-drift {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(18px, -20px, 0) scale(1.06); }
        }
        @keyframes bs-shimmer {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        .bs-enter { animation: bs-fade-up .7s cubic-bezier(.2,.7,.2,1) both; }
        .bs-delay-1 { animation-delay: .08s; }
        .bs-delay-2 { animation-delay: .16s; }
        .bs-delay-3 { animation-delay: .24s; }
        .bs-orb { animation: bs-drift 11s ease-in-out infinite; }
        .bs-glass { background: linear-gradient(145deg, rgba(17,24,39,.88), rgba(9,13,23,.88)); box-shadow: 0 24px 80px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.035); backdrop-filter: blur(16px); }
        .bs-gradient-text { background-size: 200% auto; animation: bs-shimmer 7s linear infinite; }
        .bs-control { transition: border-color .2s ease, background .2s ease, box-shadow .2s ease, transform .2s ease; }
        .bs-control:focus { box-shadow: 0 0 0 4px rgba(103,232,249,.07); }
        .bs-lift { transition: transform .25s ease, border-color .25s ease, box-shadow .25s ease; }
        .bs-lift:hover { transform: translateY(-3px); border-color: rgba(103,232,249,.2); box-shadow: 0 18px 50px rgba(0,0,0,.18); }
        @media (prefers-reduced-motion: reduce) {
          .bs-enter, .bs-orb, .bs-gradient-text { animation: none !important; }
          .bs-control, .bs-lift { transition: none !important; }
        }
      `}</style>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="bs-orb absolute -left-48 top-0 h-[420px] w-[420px] rounded-full bg-cyan-400/[0.09] blur-[130px]" />
        <div className="bs-orb absolute -right-48 top-[380px] h-[480px] w-[480px] rounded-full bg-violet-600/[0.10] blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-[1450px] px-5 py-6 sm:px-8 lg:px-10">
        <header className="bs-enter sticky top-3 z-30 mb-2 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/[0.09] bg-[#090d16]/85 px-4 py-3 shadow-2xl shadow-black/20 backdrop-blur-2xl sm:px-5">
          <a href="#top" className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-cyan-200/30 bg-gradient-to-br from-cyan-300/20 via-blue-400/10 to-violet-400/20 text-cyan-100 shadow-[0_0_28px_rgba(34,211,238,0.12)]">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.7">
                <path d="M12 3 20 6v5c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V6l8-3Z" />
                <path d="m8.5 12 2.2 2.2 4.8-5" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold tracking-wide text-white">BrandSentinel <span className="text-cyan-300">AI</span></div>
              <div className="mt-0.5 text-[9px] uppercase tracking-[0.22em] text-slate-500">Brand intelligence platform</div>
            </div>
          </a>

          <nav className="hidden items-center gap-6 text-xs font-medium text-slate-400 md:flex">
            <a href="#overview" className="transition hover:text-white">Overview</a>
            <a href="#brand-profiles" className="transition hover:text-white">Brand Profiles</a>
            <a href="#text-review" className="transition hover:text-white">Text analysis</a>
            <a href="#image-review" className="transition hover:text-white">Visual review</a>
            <a href="#history" className="transition hover:text-white">History</a>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-2 text-[10px] text-emerald-300 sm:flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              SYSTEM READY
            </div>
            <a href="#text-review" className="rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-100">Start review <span aria-hidden="true">↗</span></a>
          </div>
        </header>

        <section id="top" className="relative grid min-h-[570px] items-center gap-12 overflow-hidden py-14 sm:py-20 lg:grid-cols-[1.08fr_.92fr] lg:py-24">
          <div className="pointer-events-none absolute inset-0 -z-10 opacity-30" style={{ backgroundImage: "linear-gradient(rgba(148,163,184,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.07) 1px, transparent 1px)", backgroundSize: "54px 54px", maskImage: "linear-gradient(to bottom, black, transparent 90%)" }} />
          <div id="overview" className="bs-enter bs-delay-1 relative">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.06] px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-100 shadow-[0_0_35px_rgba(34,211,238,0.06)]">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-300" /></span>
              AI-powered brand governance
            </div>

            <h1 className="max-w-3xl text-[3.1rem] font-semibold leading-[.98] tracking-[-0.065em] text-white sm:text-6xl lg:text-[5.5rem]">
              Your brand.
              <span className="block">Your standards.</span>
              <span className="bs-gradient-text mt-2 block bg-gradient-to-r from-cyan-200 via-sky-300 to-violet-300 bg-clip-text pb-2 text-transparent">Always aligned.</span>
            </h1>

            <p className="mt-7 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
              Catch risky claims before they go live. BrandSentinel reviews marketing copy and ad creatives against your guidelines, explains what needs attention, and helps your team publish with confidence.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="#text-review" className="group inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-cyan-200 to-sky-300 px-5 py-3.5 text-sm font-bold text-slate-950 shadow-[0_12px_40px_rgba(34,211,238,.15)] transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(34,211,238,.23)]">
                Analyze content <span className="transition group-hover:translate-x-1">→</span>
              </a>
              <a href="#image-review" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3.5 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.06]">
                Review an ad <span className="text-slate-500">↗</span>
              </a>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/[0.08] pt-6 text-xs text-slate-500">
              <span className="flex items-center gap-2"><span className="text-cyan-300">✳</span> Claims & messaging checks</span>
              <span className="flex items-center gap-2"><span className="text-violet-300">◈</span> Visual ad review</span>
              <span className="flex items-center gap-2"><span className="text-emerald-300">✓</span> Human-in-the-loop</span>
            </div>
          </div>

          <div className="bs-enter bs-delay-2 relative mx-auto w-full max-w-[520px]">
            <div className="bs-orb pointer-events-none absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-cyan-400/10 via-blue-500/10 to-violet-500/15 blur-2xl" />
            <div className="bs-glass relative overflow-hidden rounded-[1.75rem] border border-white/[0.12] p-4 shadow-[0_35px_100px_rgba(0,0,0,.45)] sm:p-5">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-200">✳</div>
                  <div><div className="text-xs font-semibold text-white">Brand integrity scan</div><div className="mt-1 text-[10px] text-slate-500">Campaign preview · Sample interface</div></div>
                </div>
                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/[0.07] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-emerald-200">Ready</span>
              </div>

              <div className="mt-5 rounded-2xl border border-white/[0.08] bg-[#080c14] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Campaign copy</span>
                  <span className="text-[10px] text-slate-600">PREVIEW</span>
                </div>
                <div className="mt-5 text-2xl font-semibold leading-tight tracking-tight text-white">Make every launch <span className="text-cyan-200">count.</span></div>
                <p className="mt-3 max-w-sm text-xs leading-6 text-slate-500">A sample campaign preview to illustrate how content can be reviewed before publishing.</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-lg border border-cyan-300/15 bg-cyan-300/[0.06] px-2.5 py-1.5 text-[10px] text-cyan-100">Brand voice</span>
                  <span className="rounded-lg border border-violet-300/15 bg-violet-300/[0.06] px-2.5 py-1.5 text-[10px] text-violet-100">Claim review</span>
                  <span className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-[10px] text-slate-400">Visual consistency</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-500"><span className="h-1.5 w-1.5 rounded-full bg-cyan-300" /> Session findings</div>
                  <div className="mt-3 text-3xl font-semibold tracking-tight text-white">{totalIssues.toString().padStart(2, "0")}</div>
                  <div className="mt-1 text-[10px] text-slate-500">Detected in current session</div>
                </div>
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-500"><span className="h-1.5 w-1.5 rounded-full bg-violet-300" /> Review modes</div>
                  <div className="mt-3 text-3xl font-semibold tracking-tight text-white">02</div>
                  <div className="mt-1 text-[10px] text-slate-500">Text + creative</div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.04] p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-300/10 text-emerald-200">✓</div>
                <div className="min-w-0 flex-1"><div className="text-xs font-medium text-emerald-100">Human review stays in control</div><div className="mt-1 text-[10px] leading-4 text-slate-500">AI flags potential issues; your team makes the final call.</div></div>
                <span className="text-emerald-200">↗</span>
              </div>
            </div>
            <div className="absolute -right-3 top-20 hidden rounded-xl border border-cyan-200/15 bg-[#101827]/95 px-3 py-2.5 shadow-xl sm:block">
              <div className="text-[9px] uppercase tracking-widest text-slate-500">Protection layer</div>
              <div className="mt-1 text-xs font-semibold text-cyan-100">Brand-aware review</div>
            </div>
          </div>
        </section>

        <section className="bs-enter bs-delay-3 mb-8 grid gap-3 sm:grid-cols-3">
          <div className="bs-lift rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4"><div className="text-xs font-semibold text-slate-200">01 <span className="ml-2 text-slate-400">Set your standards</span></div><p className="mt-2 text-xs leading-5 text-slate-500">Add approved claims, tone of voice, and brand rules.</p></div>
          <div className="bs-lift rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4"><div className="text-xs font-semibold text-slate-200">02 <span className="ml-2 text-slate-400">Review content</span></div><p className="mt-2 text-xs leading-5 text-slate-500">Analyze copy or upload an advertisement creative.</p></div>
          <div className="bs-lift rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4"><div className="text-xs font-semibold text-slate-200">03 <span className="ml-2 text-slate-400">Act on findings</span></div><p className="mt-2 text-xs leading-5 text-slate-500">Read evidence, recommendations, and export a report.</p></div>
        </section>

        {hasReport && (
          <div className="bs-enter mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-300/15 bg-gradient-to-r from-cyan-300/[0.06] to-violet-400/[0.04] p-4">
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
        <section id="history" className={`${panel} bs-glass bs-enter bs-delay-2 mb-5 scroll-mt-28 p-5 sm:p-7`}>
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
                  className="bs-lift group rounded-xl border border-white/[0.08] bg-[#0b0f17]/90 p-4"
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

        <div className="mb-5 mt-12 flex flex-wrap items-end justify-between gap-4">
          <div><div className={labelStyle}>The workspace</div><h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Put every campaign to the test.</h2><p className="mt-2 text-sm text-slate-500">One place to review copy, creatives, and past findings.</p></div>
          <span className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] uppercase tracking-widest text-slate-500">Live workspace</span>
        </div>
        <div className="grid scroll-mt-28 gap-5 xl:grid-cols-2">
          {/* Persistent Brand Profiles */}
          <section id="brand-profiles" className={`${panel} bs-glass bs-enter mb-5 scroll-mt-28 p-5 sm:p-7`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className={labelStyle}>Workspace / 00</div>
                <h2 className="mt-2 text-xl font-semibold">Persistent Brand Profiles</h2>
                <p className="mt-2 text-sm text-slate-400">Save reusable brand standards and load them into text and image reviews.</p>
              </div>
              <span className="rounded-full border border-cyan-300/20 bg-cyan-300/[0.06] px-3 py-1.5 text-xs text-cyan-200">{brandProfiles.length} saved</span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="saved-brand-profile" className="mb-2 block text-sm font-medium">Saved profiles</label>
                <select id="saved-brand-profile" value={selectedProfileId} onChange={(event) => {
                  const profile = brandProfiles.find((item) => item.id === event.target.value);
                  if (profile) applyBrandProfile(profile);
                  else createNewBrandProfile();
                }} className="bs-control w-full rounded-xl border border-white/10 bg-[#080c14] px-4 py-3 text-sm text-slate-200 outline-none focus:border-cyan-300/50">
                  <option value="">Select a saved profile</option>
                  {brandProfiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="brand-profile-name" className="mb-2 block text-sm font-medium">Profile name</label>
                <input id="brand-profile-name" value={profileName} onChange={(event) => setProfileName(event.target.value)} maxLength={80} placeholder="e.g. Acme — Trust-first" className="bs-control w-full rounded-xl border border-white/10 bg-[#080c14] px-4 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan-300/50" />
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="approved-claims" className="mb-2 block text-sm font-medium">Approved claims and facts</label>
                <textarea id="approved-claims" value={approvedClaims} onChange={(event) => setApprovedClaims(event.target.value)} maxLength={3000} rows={3} placeholder="One approved claim per line" className="bs-control w-full rounded-xl border border-white/10 bg-[#080c14]/90 px-4 py-3 text-sm leading-6 text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan-300/50" />
              </div>
              <div>
                <label htmlFor="restricted-terms" className="mb-2 block text-sm font-medium">Restricted words and phrases</label>
                <textarea id="restricted-terms" value={restrictedTerms} onChange={(event) => setRestrictedTerms(event.target.value)} maxLength={3000} rows={3} placeholder="One restricted term or phrase per line" className="bs-control w-full rounded-xl border border-white/10 bg-[#080c14]/90 px-4 py-3 text-sm leading-6 text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan-300/50" />
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="tone-rules" className="mb-2 block text-sm font-medium">Tone of voice rules</label>
              <textarea id="tone-rules" value={toneRules} onChange={(event) => setToneRules(event.target.value)} maxLength={3000} rows={3} placeholder="Describe the brand's preferred voice and style" className="bs-control w-full rounded-xl border border-white/10 bg-[#080c14]/90 px-4 py-3 text-sm leading-6 text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan-300/50" />
            </div>

            <p className="mt-3 text-xs leading-5 text-slate-500">Brand guidelines are saved with the profile. Loading a profile combines its approved claims, restricted terms and tone rules with the guidelines used by the AI review.</p>
            {profileMessage && <p role="status" className="mt-3 text-sm text-cyan-200">{profileMessage}</p>}

            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" onClick={saveBrandProfile} disabled={!profilesLoaded} className="rounded-xl bg-gradient-to-r from-cyan-200 to-sky-300 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50">{selectedProfileId ? "Update profile" : "Save new profile"}</button>
              <button type="button" onClick={createNewBrandProfile} className="rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-200 hover:bg-white/[0.05]">+ New profile</button>
              <button type="button" onClick={deleteBrandProfile} disabled={!selectedProfileId} className="rounded-xl border border-red-400/20 px-4 py-3 text-sm text-red-300 hover:bg-red-400/[0.08] disabled:cursor-not-allowed disabled:opacity-40">Delete profile</button>
            </div>
            <p className="mt-3 text-xs text-slate-500">Profiles are stored in this browser only and are not synced across devices.</p>
          </section>

          {/* Text analysis */}
          <section id="text-review" className={`${panel} bs-glass bs-enter bs-delay-3 scroll-mt-28 p-5 sm:p-7`}>
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

            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="brand-guidelines" className="block text-sm font-medium">
                Brand guidelines
              </label>
              <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                Quick-start voice presets
              </span>
            </div>

            <div className="mb-3 grid grid-cols-2 gap-2">
              {guidelinePresets.map((preset) => {
                const selected = brandRules === preset.rules;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setBrandRules(preset.rules)}
                    aria-pressed={selected}
                    className={`rounded-xl border p-3 text-left transition duration-200 hover:-translate-y-0.5 ${
                      selected
                        ? "border-cyan-300/40 bg-cyan-300/[0.08] shadow-[0_0_24px_rgba(34,211,238,0.06)]"
                        : "border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-100">
                      {preset.name}
                      {selected && <span className="text-cyan-200">✓</span>}
                    </span>
                    <span className="mt-1 block text-[10px] leading-4 text-slate-500">
                      {preset.description}
                    </span>
                  </button>
                );
              })}
            </div>

            <textarea
              id="brand-guidelines"
              value={brandRules}
              onChange={(event) => setBrandRules(event.target.value)}
              maxLength={5000}
              rows={4}
              placeholder="Enter your brand voice, approved claims, and restrictions..."
              className="bs-control w-full resize-y rounded-xl border border-white/10 bg-[#080c14]/90 px-4 py-3 text-sm leading-6 text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan-300/50"
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
              className="bs-control w-full resize-y rounded-xl border border-white/10 bg-[#080c14]/90 px-4 py-3 text-sm leading-6 text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan-300/50"
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
                className="bs-control rounded-xl bg-gradient-to-r from-cyan-200 to-sky-300 px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_8px_30px_rgba(34,211,238,0.12)] hover:-translate-y-0.5 hover:shadow-[0_12px_35px_rgba(34,211,238,0.18)] disabled:cursor-not-allowed disabled:opacity-50"
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
          <section id="image-review" className={`${panel} bs-glass bs-enter bs-delay-3 scroll-mt-28 p-5 sm:p-7`}>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className={labelStyle}>Visual intelligence / 02</div>
                <h2 className="mt-2 text-xl font-semibold">
                  Advertisement review
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  Inspect an ad creative for visual and messaging risks.
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
              className="bs-control group flex min-h-[180px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-[#080c14]/80 p-6 text-center hover:border-cyan-300/40 hover:bg-cyan-300/[0.035]"
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
              className="bs-control mt-4 w-full rounded-xl border border-cyan-300/25 bg-gradient-to-r from-cyan-300/[0.10] to-violet-400/[0.08] px-4 py-3 text-sm font-semibold text-cyan-100 hover:-translate-y-0.5 hover:border-cyan-200/40 hover:bg-cyan-300/[0.14] disabled:cursor-not-allowed disabled:opacity-50"
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

                {imageFindings.length === 0 && (
                  <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.05] p-4">
                    <div className="text-sm font-medium text-emerald-200">
                      No meaningful issues identified
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-400">
                      The original advertisement remains unchanged. This
                      preliminary AI review is not a guarantee of compliance.
                    </p>
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
    <article className="bs-lift rounded-xl border border-white/[0.08] bg-[#0b0f17]/90 p-4">
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