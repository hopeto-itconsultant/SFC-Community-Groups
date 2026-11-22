import { CacheCommit } from "@/components/CachedPage";
import { HomeCached } from "@/components/home-cache";
import { HomeScreen } from "@/components/HomeScreen";
import { getNameDisplay, getRealUser, requireUser } from "@/lib/auth";
import {
  countReportsCreatedThisMonth,
  getGroupDetail,
  getGroupDirectory,
  getLastFellowship,
  getNextFellowship,
  getReportTypeSummaries,
  getUpcomingBriefs,
} from "@/lib/data-access";
import { toGroupCardModel } from "@/lib/group-card-model";
import { ROLE_LABELS, formatRupees, formatShortDateTimeDay } from "@/lib/format";
import { HOME_PAGE_KEY, type HomeModel } from "@/lib/page-models";
import { isAdminRole } from "@/lib/roles";
import { scopeKeyForUser } from "@/lib/shell";

export default function HomePage() {
  return (
    <HomeCached>
      <HomeContent />
    </HomeCached>
  );
}

async function HomeContent() {
  const [user, real] = await Promise.all([requireUser(), getRealUser()]);
  const model = await loadHome(user);
  const loginAsId = real && real.id !== user.id ? user.id : null;
  return (
    <CacheCommit scopeKey={scopeKeyForUser(user, loginAsId)} pageKey={HOME_PAGE_KEY} data={model}>
      <HomeScreen model={model} />
    </CacheCommit>
  );
}

async function loadHome(user: Awaited<ReturnType<typeof requireUser>>): Promise<HomeModel> {
  if (!isAdminRole(user.role)) {
    if (!user.groupId) {
      const shown = await getNameDisplay();
      return { kind: "none", welcomeName: shown(user.name) };
    }
    const [shown, detail, summaries, reportsThisMonth, next, last] = await Promise.all([
      getNameDisplay(),
      getGroupDetail(user.groupId),
      getReportTypeSummaries(user.groupId),
      countReportsCreatedThisMonth(user.groupId),
      getNextFellowship(user.groupId),
      getLastFellowship(user.groupId),
    ]);
    const welcomeName = shown(user.name);
    if (!detail) return { kind: "none", welcomeName };
    return {
      kind: "leader",
      welcomeName,
      groupName: detail.group.name,
      roleLabel: ROLE_LABELS[user.role],
      reportsThisMonth,
      planned: summaries.nextFellowship?.upcomingCount ?? 0,
      spentLabel: formatRupees(summaries.expenditure?.thisMonthAmount ?? 0),
      next: next
        ? {
            id: next.id,
            date: next.proposedDate,
            when: formatShortDateTimeDay(next.proposedDate, next.time),
            location: next.location,
          }
        : null,
      last: last
        ? {
            id: last.id,
            when: formatShortDateTimeDay(last.date, last.time),
            detail: `${last.attendees} attended · ${last.firstTimers} first-time`,
          }
        : null,
    };
  }

  const [shown, entries, reportsThisMonth, upcoming] = await Promise.all([
    getNameDisplay(),
    getGroupDirectory(),
    countReportsCreatedThisMonth(),
    getUpcomingBriefs(),
  ]);
  return {
    kind: "admin",
    welcomeName: shown(user.name),
    groupCount: entries.length,
    reportsThisMonth,
    planned: upcoming.count,
    groups: entries.map((entry) => toGroupCardModel(entry, shown, upcoming.byGroup.get(entry.group.id))),
  };
}
