"use client";

import Image from "next/image";
import { useState } from "react";
import type { CommunityGroup, Frequency } from "@/data/types";
import { FREQUENCY_LABELS } from "@/lib/format";
import { Field, FormSection, SubmitBar, inputClass } from "./form";
import { PhotoPicker, type PhotoItem } from "./PhotoPicker";

const FREQUENCIES = Object.keys(FREQUENCY_LABELS) as Frequency[];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Add/edit form for a group's profile. The parent owns `photos` so preview URLs
 * stay valid on the result screen after the form unmounts.
 */
export function GroupForm({
  initial,
  canEditFrequency,
  photos,
  onPhotosChange,
  submitLabel,
  onSubmit,
}: {
  initial?: CommunityGroup;
  /** Frequency is fixed for the prototype; only Admin may change it. */
  canEditFrequency: boolean;
  photos: PhotoItem[];
  onPhotosChange: (photos: PhotoItem[]) => void;
  submitLabel: string;
  onSubmit: (group: CommunityGroup) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [frequency, setFrequency] = useState<Frequency>(initial?.frequency ?? "every-2-months");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    onSubmit({
      id: initial?.id ?? `draft-${slugify(trimmedName) || Date.now()}`,
      leaderIds: initial?.leaderIds ?? [],
      assistantLeaderIds: initial?.assistantLeaderIds ?? [],
      status: initial?.status,
      closedAt: initial?.closedAt,
      name: trimmedName,
      category: category.trim() || undefined,
      frequency,
      photo: photos[0]?.previewUrl ?? initial?.photo,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 px-4 pt-4">
      <FormSection title="Group Details">
        <Field label="Group Name">
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Young Adults"
            autoComplete="off"
            autoCapitalize="words"
            className={inputClass}
          />
        </Field>
        <Field label="Category" optional>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Youth"
            autoComplete="off"
            className={inputClass}
          />
        </Field>
        {canEditFrequency ? (
          <Field label="Fellowship Frequency">
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as Frequency)}
              className={inputClass}
            >
              {FREQUENCIES.map((f) => (
                <option key={f} value={f}>
                  {FREQUENCY_LABELS[f]}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <div>
            <p className="mb-1.5 text-sm font-semibold text-slate-700">Fellowship Frequency</p>
            <p className="text-base">{FREQUENCY_LABELS[frequency]}</p>
            <p className="mt-1 text-xs text-slate-500">Only Admin can change how often a group meets.</p>
          </div>
        )}
      </FormSection>

      <FormSection title="Group Photo">
        {initial?.photo && photos.length === 0 && (
          <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-slate-100">
            <Image
              src={initial.photo}
              alt={`Current ${initial.name} photo`}
              fill
              sizes="(max-width: 576px) 100vw, 576px"
              className="object-cover"
            />
          </div>
        )}
        <PhotoPicker value={photos} onChange={onPhotosChange} max={1} />
      </FormSection>

      <SubmitBar label={submitLabel} />
    </form>
  );
}
