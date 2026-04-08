"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { marked } from "marked";

type Settings = Record<string, string>;

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
    title: "Social Links",
    fields: [
      { key: "social_instagram", label: "Instagram URL", type: "url" },
      { key: "social_twitter", label: "Twitter URL", type: "url" },
      { key: "social_email", label: "Email", type: "email" },
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      });
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
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
                onChange={(e) =>
                  handleChange("about_portrait_url", e.target.value)
                }
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
                      !previewMode
                        ? "bg-white/10 text-white"
                        : "text-neutral-500 hover:text-white"
                    }`}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setPreviewMode(true)}
                    className={`px-3 py-1 text-xs transition-colors ${
                      previewMode
                        ? "bg-white/10 text-white"
                        : "text-neutral-500 hover:text-white"
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
                    __html: marked.parse(settings.about_content || "", {
                      async: false,
                    }) as string,
                  }}
                />
              ) : (
                <textarea
                  value={settings.about_content || ""}
                  onChange={(e) =>
                    handleChange("about_content", e.target.value)
                  }
                  rows={16}
                  className={`${inputClass} font-mono text-sm leading-relaxed`}
                  placeholder="Write your about page content in Markdown or HTML..."
                />
              )}
            </div>
          </div>
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
