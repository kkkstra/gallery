"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { marked } from "marked";

type Settings = Record<string, string>;

interface SocialLink {
  id?: number;
  platform: string;
  label: string;
  url: string;
  sortOrder: number;
}

const PLATFORMS = [
  "instagram", "twitter", "facebook", "youtube", "tiktok",
  "github", "email", "website", "custom",
];

const SETTING_SECTIONS = [
  {
    title: "Site Info",
    fields: [
      { key: "site_title", label: "Site Title", type: "text" },
      { key: "site_description", label: "Site Description", type: "text" },
    ],
  },
  {
    title: "Hero Section",
    fields: [
      { key: "hero_subtitle", label: "Subtitle", type: "text" },
      { key: "hero_title", label: "Title", type: "text" },
      { key: "hero_description", label: "Description", type: "text" },
      { key: "hero_cta_text", label: "Button Text", type: "text" },
    ],
  },
  {
    title: "Footer",
    fields: [
      { key: "footer_copyright", label: "Copyright Text", type: "text" },
    ],
  },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>({});
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [importing, setImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/settings").then((r) => r.json()),
      fetch("/api/social-links").then((r) => r.json()),
    ]).then(([settingsData, linksData]) => {
      setSettings(settingsData);
      setSocialLinks(linksData);
      setLoading(false);
    });
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const addSocialLink = () => {
    setSocialLinks((prev) => [
      ...prev,
      { platform: "custom", label: "", url: "", sortOrder: prev.length },
    ]);
    setSaved(false);
  };

  const updateSocialLink = (index: number, field: keyof SocialLink, value: string | number) => {
    setSocialLinks((prev) =>
      prev.map((link, i) => (i === index ? { ...link, [field]: value } : link)),
    );
    setSaved(false);
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks((prev) => prev.filter((_, i) => i !== index));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await Promise.all([
      fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      }),
      fetch("/api/social-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          socialLinks.map((link, i) => ({ ...link, sortOrder: i })),
        ),
      }),
    ]);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-neutral-600 outline-none focus:border-white/30 transition-colors";

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-light tracking-wider text-white">
          Settings
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Customize your site content
        </p>
      </div>

      <div className="space-y-10">
        {SETTING_SECTIONS.map((section) => (
          <div key={section.title}>
            <h2 className="text-sm font-medium uppercase tracking-widest text-neutral-400 mb-4 pb-2 border-b border-white/10">
              {section.title}
            </h2>
            <div className="space-y-4">
              {section.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm text-neutral-400 mb-1.5">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={settings[field.key] || ""}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* About Page section */}
        <div>
          <h2 className="text-sm font-medium uppercase tracking-widest text-neutral-400 mb-4 pb-2 border-b border-white/10">
            About Page
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-neutral-400 mb-1.5">
                Portrait URL
              </label>
              <input
                type="url"
                value={settings.about_portrait_url || ""}
                onChange={(e) => handleChange("about_portrait_url", e.target.value)}
                className={inputClass}
              />
              {settings.about_portrait_url && (
                <div className="mt-2 relative h-32 w-24 overflow-hidden rounded-lg bg-white/5">
                  <Image
                    src={settings.about_portrait_url}
                    alt="Portrait preview"
                    fill
                    className="object-cover"
                    sizes="96px"
                    unoptimized
                  />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm text-neutral-400">
                  Content (Markdown / HTML)
                </label>
                <div className="flex rounded-lg border border-white/10 overflow-hidden">
                  <button
                    onClick={() => setPreviewMode(false)}
                    className={`px-3 py-1 text-xs transition-colors ${
                      !previewMode ? "bg-white/10 text-white" : "text-neutral-500 hover:text-white"
                    }`}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setPreviewMode(true)}
                    className={`px-3 py-1 text-xs transition-colors ${
                      previewMode ? "bg-white/10 text-white" : "text-neutral-500 hover:text-white"
                    }`}
                  >
                    Preview
                  </button>
                </div>
              </div>

              {previewMode ? (
                <div
                  className="prose-dark min-h-[300px] rounded-lg border border-white/10 bg-white/5 p-6"
                  dangerouslySetInnerHTML={{
                    __html: marked.parse(settings.about_content || "", { async: false }) as string,
                  }}
                />
              ) : (
                <textarea
                  value={settings.about_content || ""}
                  onChange={(e) => handleChange("about_content", e.target.value)}
                  rows={16}
                  className={`${inputClass} font-mono text-sm leading-relaxed`}
                  placeholder="Write your about page content in Markdown or HTML..."
                />
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Social Links */}
        <div>
          <h2 className="text-sm font-medium uppercase tracking-widest text-neutral-400 mb-4 pb-2 border-b border-white/10">
            Social Links
          </h2>
          <div className="space-y-3">
            {socialLinks.map((link, index) => (
              <div key={index} className="flex items-start gap-2">
                <select
                  value={link.platform}
                  onChange={(e) => {
                    updateSocialLink(index, "platform", e.target.value);
                    if (!link.label) {
                      updateSocialLink(
                        index,
                        "label",
                        e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1),
                      );
                    }
                  }}
                  className="w-32 shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-white/30"
                >
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={link.label}
                  onChange={(e) => updateSocialLink(index, "label", e.target.value)}
                  placeholder="Label"
                  className="w-32 shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-neutral-600 outline-none focus:border-white/30"
                />
                <input
                  type="text"
                  value={link.url}
                  onChange={(e) => updateSocialLink(index, "url", e.target.value)}
                  placeholder="URL or mailto:..."
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-neutral-600 outline-none focus:border-white/30"
                />
                <button
                  onClick={() => removeSocialLink(index)}
                  className="shrink-0 rounded-lg border border-red-500/20 p-2.5 text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            <button
              onClick={addSocialLink}
              className="flex items-center gap-2 rounded-lg border border-dashed border-white/20 px-4 py-2 text-sm text-neutral-400 hover:border-white/40 hover:text-white transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Link
            </button>
          </div>
        </div>
      </div>

      {/* Data Export / Import */}
      <div className="mt-10">
        <h2 className="text-sm font-medium uppercase tracking-widest text-neutral-400 mb-4 pb-2 border-b border-white/10">
          Data Export / Import
        </h2>
        <p className="text-sm text-neutral-500 mb-3">
          Export all site data as JSON, or restore from a previous backup. Photo files remain on your storage; the export includes their URLs.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={async () => {
              const res = await fetch("/api/export");
              if (!res.ok) return alert("Export failed");
              const data = await res.json();
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `gallery-backup-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm text-neutral-400 hover:text-white hover:border-white/30 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export Data
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (!confirm("This will REPLACE all existing data with the backup. Continue?")) {
                if (importInputRef.current) importInputRef.current.value = "";
                return;
              }
              setImporting(true);
              try {
                const text = await file.text();
                const json = JSON.parse(text);
                const res = await fetch("/api/import", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(json),
                });
                const result = await res.json();
                if (res.ok) {
                  alert(`Import successful!\n${Object.entries(result.counts || {}).map(([k, v]) => `${k}: ${v}`).join("\n")}`);
                  window.location.reload();
                } else {
                  alert(`Import failed: ${result.error}`);
                }
              } catch (err) {
                alert(`Import failed: ${err instanceof Error ? err.message : "Unknown error"}`);
              } finally {
                setImporting(false);
                if (importInputRef.current) importInputRef.current.value = "";
              }
            }}
          />
          <button
            type="button"
            disabled={importing}
            onClick={() => importInputRef.current?.click()}
            className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm text-neutral-400 hover:text-white hover:border-white/30 transition-colors disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            {importing ? "Importing..." : "Import Data"}
          </button>
        </div>
      </div>

      {/* Save button */}
      <div className="mt-10 flex items-center gap-4 sticky bottom-0 bg-neutral-950 py-4 border-t border-white/10">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-white px-6 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save All Settings"}
        </button>
        {saved && (
          <span className="text-sm text-emerald-400">
            Settings saved successfully
          </span>
        )}
      </div>
    </div>
  );
}
