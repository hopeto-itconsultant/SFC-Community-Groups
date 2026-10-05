"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import type { CommunityGroup } from "@/data/types";
import { GroupForm } from "@/components/GroupForm";
import { GroupProfile } from "@/components/groups";
import { PageHeader } from "@/components/PageHeader";
import { usePhotoItems } from "@/components/PhotoPicker";
import { NotAvailable } from "@/components/RoleGate";
import { SavedBanner } from "@/components/SubmittedView";
import { LinkButton } from "@/components/ui";
import { canEditGroup, getGroupById } from "@/lib/data-access";
import { useCurrentUser } from "@/lib/session";

export default function EditGroupPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useCurrentUser();
  const group = getGroupById(id);

  if (!group) return <NotAvailable message="This group could not be found." />;
  if (!canEditGroup(user, group)) {
    return <NotAvailable message="Only Admin and this group's leaders can edit it." />;
  }

  const backHref = user.role === "admin" ? `/groups/${group.id}` : "/group";
  return <EditGroupFlow group={group} isAdmin={user.role === "admin"} backHref={backHref} />;
}

function EditGroupFlow({
  group,
  isAdmin,
  backHref,
}: {
  group: CommunityGroup;
  isAdmin: boolean;
  backHref: string;
}) {
  const { photos, setPhotos } = usePhotoItems();
  const [updated, setUpdated] = useState<CommunityGroup | null>(null);

  if (updated) {
    return (
      <>
        <PageHeader title="Group updated" backHref={backHref} />
        <div className="p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <SavedBanner title={`${updated.name} updated`} />
          <GroupProfile group={updated} />
          <LinkButton href={backHref} size="lg" block className="mt-6">
            Back to Group
          </LinkButton>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Edit Group" subtitle={group.name} backHref={backHref} />
      <GroupForm
        initial={group}
        canEditFrequency={isAdmin}
        photos={photos}
        onPhotosChange={setPhotos}
        submitLabel="SAVE CHANGES"
        onSubmit={(next) => {
          setUpdated(next);
          window.scrollTo(0, 0);
        }}
      />
    </>
  );
}
