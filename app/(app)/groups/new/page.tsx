"use client";

import { useState } from "react";
import type { CommunityGroup } from "@/data/types";
import { GroupForm } from "@/components/GroupForm";
import { GroupProfile } from "@/components/groups";
import { PageHeader } from "@/components/PageHeader";
import { usePhotoItems } from "@/components/PhotoPicker";
import { RoleGate } from "@/components/RoleGate";
import { SavedBanner } from "@/components/SubmittedView";
import { Button, LinkButton } from "@/components/ui";

export default function NewGroupPage() {
  return (
    <RoleGate allow={["admin"]}>
      <NewGroupFlow />
    </RoleGate>
  );
}

function NewGroupFlow() {
  const { photos, setPhotos, clear } = usePhotoItems();
  const [added, setAdded] = useState<CommunityGroup | null>(null);
  const [formKey, setFormKey] = useState(0);

  if (added) {
    return (
      <>
        <PageHeader title="Group added" backHref="/groups" />
        <div className="p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <SavedBanner title={`${added.name} added`} />
          <GroupProfile group={added} />
          <p className="mt-3 px-1 text-sm text-slate-500">
            Leaders and assistant leaders are assigned separately.
          </p>
          <div className="mt-6 space-y-2">
            <LinkButton href="/groups" size="lg" block>
              Back to Groups
            </LinkButton>
            <Button
              variant="secondary"
              size="lg"
              block
              onClick={() => {
                clear();
                setAdded(null);
                setFormKey((k) => k + 1);
              }}
            >
              Add another group
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Add Group" backHref="/groups" />
      <GroupForm
        key={formKey}
        canEditFrequency
        photos={photos}
        onPhotosChange={setPhotos}
        submitLabel="ADD GROUP"
        onSubmit={(group) => {
          setAdded(group);
          window.scrollTo(0, 0);
        }}
      />
    </>
  );
}
