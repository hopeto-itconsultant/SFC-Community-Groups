"use client";

import Image from "next/image";
import { startTransition, useActionState, useState } from "react";
import type { CommunityGroup } from "@/data/types";
import type { FormState } from "@/lib/actions/types";
import { FREQUENCY_LABELS } from "@/lib/format";
import { ChoiceField, Field, FormSection, SubmitBar, inputClass } from "./form";
import { PhotoPicker, appendPhotos, usePhotoItems } from "./PhotoPicker";

const FREQUENCY_OPTIONS = [
  { value: "monthly", label: FREQUENCY_LABELS.monthly },
  { value: "every-2-months", label: FREQUENCY_LABELS["every-2-months"] },
];

/** Add/edit form for a group's profile. */
export function GroupForm({
  initial,
  canEditFrequency,
  submitLabel,
  action,
}: {
  initial?: CommunityGroup;
  /** Only the Admin may change how often a group meets. */
  canEditFrequency: boolean;
  submitLabel: string;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const { photos, setPhotos } = usePhotoItems();
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = appendPhotos(new FormData(e.currentTarget), "photo", photos);
    startTransition(() => formAction(formData));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 px-4 pt-4">
      <FormSection title="Group Details">
        <Field label="Group Name" required>
          <input
            name="name"
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
        <Field label="Category">
          <input
            name="category"
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Youth"
            autoComplete="off"
            className={inputClass}
          />
        </Field>
        {canEditFrequency ? (
          <ChoiceField
            label="Fellowship Frequency"
            name="frequency"
            required
            options={FREQUENCY_OPTIONS}
            defaultValue={initial?.frequency ?? "every-2-months"}
          />
        ) : (
          <div>
            <p className="mb-1.5 text-sm font-semibold text-slate-700">Fellowship Frequency</p>
            <p className="text-base">{initial?.frequency ? FREQUENCY_LABELS[initial.frequency] : "Not set"}</p>
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
              unoptimized
            />
          </div>
        )}
        <PhotoPicker value={photos} onChange={setPhotos} max={1} />
      </FormSection>

      <SubmitBar label={submitLabel} error={state.error} pending={pending} />
    </form>
  );
}
