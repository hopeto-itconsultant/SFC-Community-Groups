"use client";

import { useState, useTransition } from "react";
import { Field, inputClass } from "@/components/form";
import { Button, Card } from "@/components/ui";
import { setHiddenSalutations } from "@/lib/actions/auth";

/** Shared comma-separated list of titles the app hides. Superadmin only. */
export function HiddenSalutationsForm({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startSave] = useTransition();

  function update() {
    setSaved(false);
    setError(null);
    startSave(async () => {
      const result = await setHiddenSalutations(value);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.value !== undefined) setValue(result.value);
      setSaved(true);
    });
  }

  return (
    <form action={update} className="mt-3">
      <Card className="space-y-3">
        <Field label="Titles to hide" aside="Comma-separated">
          <textarea
            name="salutations"
            value={value}
            rows={3}
            spellCheck={false}
            autoCapitalize="words"
            onChange={(event) => {
              setValue(event.target.value);
              setSaved(false);
            }}
            className={`${inputClass} min-h-24 resize-y`}
          />
        </Field>
        {error && (
          <p role="alert" className="text-sm font-medium text-red-600">
            {error}
          </p>
        )}
        {saved && <p className="text-sm font-medium text-emerald-700">Updated.</p>}
        <Button type="submit" block disabled={pending}>
          {pending ? "Updating…" : "Update"}
        </Button>
      </Card>
    </form>
  );
}
