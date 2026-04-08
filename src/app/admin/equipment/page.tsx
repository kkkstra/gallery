"use client";

import { useEffect, useState } from "react";

interface Equipment {
  id: number;
  brand: string;
  model: string;
}

function EquipmentPanel({
  title,
  items,
  onAdd,
  onDelete,
}: {
  title: string;
  items: Equipment[];
  onAdd: (brand: string, model: string) => void;
  onDelete: (id: number) => void;
}) {
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");

  const handleAdd = () => {
    if (!brand.trim() || !model.trim()) return;
    onAdd(brand.trim(), model.trim());
    setBrand("");
    setModel("");
  };

  const inputClass =
    "rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none focus:border-white/30 transition-colors";

  return (
    <div>
      <h2 className="text-sm font-medium uppercase tracking-widest text-neutral-400 mb-4 pb-2 border-b border-white/10">
        {title}
      </h2>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          placeholder="Brand"
          className={`w-36 ${inputClass}`}
        />
        <input
          type="text"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="Model"
          className={`flex-1 ${inputClass}`}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <button
          onClick={handleAdd}
          className="shrink-0 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90"
        >
          Add
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-neutral-600 py-4">No {title.toLowerCase()} added yet.</p>
      ) : (
        <div className="space-y-1">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-white/5 transition-colors"
            >
              <span className="text-sm text-neutral-300">
                <span className="text-neutral-500">{item.brand}</span>{" "}
                {item.model}
              </span>
              <button
                onClick={() => onDelete(item.id)}
                className="text-neutral-600 hover:text-red-400 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminEquipmentPage() {
  const [cameras, setCameras] = useState<Equipment[]>([]);
  const [lensItems, setLenses] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/cameras").then((r) => r.json()),
      fetch("/api/lenses").then((r) => r.json()),
    ]).then(([c, l]) => {
      setCameras(c);
      setLenses(l);
      setLoading(false);
    });
  }, []);

  const addCamera = async (brand: string, model: string) => {
    const res = await fetch("/api/cameras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brand, model }),
    });
    const cam = await res.json();
    setCameras((prev) => [...prev, cam]);
  };

  const deleteCamera = async (id: number) => {
    await fetch(`/api/cameras/${id}`, { method: "DELETE" });
    setCameras((prev) => prev.filter((c) => c.id !== id));
  };

  const addLens = async (brand: string, model: string) => {
    const res = await fetch("/api/lenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brand, model }),
    });
    const lens = await res.json();
    setLenses((prev) => [...prev, lens]);
  };

  const deleteLens = async (id: number) => {
    await fetch(`/api/lenses/${id}`, { method: "DELETE" });
    setLenses((prev) => prev.filter((l) => l.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-light tracking-wider text-white">
          Equipment
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Manage cameras and lenses for quick selection when adding photos
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <EquipmentPanel
          title="Cameras"
          items={cameras}
          onAdd={addCamera}
          onDelete={deleteCamera}
        />
        <EquipmentPanel
          title="Lenses"
          items={lensItems}
          onAdd={addLens}
          onDelete={deleteLens}
        />
      </div>
    </div>
  );
}
