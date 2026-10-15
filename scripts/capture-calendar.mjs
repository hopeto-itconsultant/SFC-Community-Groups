/** One-off calendar screenshots. Does not print passwords, phones, or tokens. */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import puppeteer from "file:///C:/Users/hopet/AppData/Local/Temp/guide-capture/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";

const root = process.cwd();
const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const base = "http://localhost:3000";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

function loginEmail(profile) {
  if (profile.username) return `u.${profile.username}@login.sfc.invalid`;
  if (profile.mobile) return `${profile.mobile.replace(/^\+/, "")}@login.sfc.invalid`;
  return null;
}

function sessionCookies(session) {
  const ref = new URL(url).hostname.split(".")[0];
  const key = `sb-${ref}-auth-token`;
  const encoded = `base64-${Buffer.from(JSON.stringify(session), "utf8").toString("base64url")}`;
  const chunkSize = 3180;
  const encodedValue = encodeURIComponent(encoded);
  const parts = [];
  if (encodedValue.length <= chunkSize) parts.push(encoded);
  else {
    let rest = encodedValue;
    while (rest.length > 0) {
      let head = rest.slice(0, chunkSize);
      const lastEscape = head.lastIndexOf("%");
      if (lastEscape > chunkSize - 3) head = head.slice(0, lastEscape);
      while (head.length > 0) {
        try {
          parts.push(decodeURIComponent(head));
          break;
        } catch {
          head = head.slice(0, -3);
        }
      }
      rest = rest.slice(head.length);
    }
  }
  return parts.map((value, index) => ({
    name: parts.length === 1 ? key : `${key}.${index}`,
    value,
    domain: "localhost",
    path: "/",
    httpOnly: false,
    secure: false,
    sameSite: "Lax",
  }));
}

async function sessionFor(profile) {
  const email = loginEmail(profile);
  const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const anon = createClient(url, publishable, { auth: { persistSession: false, autoRefreshToken: false } });
  const link = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (link.error || !link.data?.properties?.hashed_token) throw new Error(link.error?.message ?? "Could not start a session.");
  const verified = await anon.auth.verifyOtp({ token_hash: link.data.properties.hashed_token, type: "magiclink" });
  if (verified.error || !verified.data.session) throw new Error(verified.error?.message ?? "Could not open a session.");
  return verified.data.session;
}

async function pickSubjects() {
  const db = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const [profilesRes, membersRes, groupsRes, reportsRes] = await Promise.all([
    db.from("profiles").select("id, name, is_admin, active, auth_user_id, username, mobile"),
    db.from("group_leaders").select("profile_id, group_id, role"),
    db.from("groups").select("id, name, status"),
    db.from("reports").select("id, group_id, type"),
  ]);
  for (const res of [profilesRes, membersRes, groupsRes, reportsRes]) {
    if (res.error) throw new Error(res.error.message);
  }
  const groups = new Map(groupsRes.data.map((group) => [group.id, group]));
  const leaders = membersRes.data
    .filter((row) => row.role === "leader")
    .map((row) => ({
      profile: profilesRes.data.find((person) => person.id === row.profile_id),
      group: groups.get(row.group_id),
    }))
    .filter((row) => row.profile?.active && row.profile.auth_user_id && loginEmail(row.profile) && row.group?.status === "active")
    .map((row) => ({
      ...row,
      score: reportsRes.data.filter((report) => report.group_id === row.group.id && report.type === "fellowship").length,
    }))
    .sort((a, b) => b.score - a.score);
  const leader = leaders[0];
  const admin = profilesRes.data.find((person) => person.is_admin && person.active && person.auth_user_id && loginEmail(person));
  if (!leader || !admin) throw new Error("Need a leader and an admin with logins.");
  return { leader: leader.profile, admin, groupName: leader.group.name };
}

async function shootCalendar(browser, profile, file) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.evaluateOnNewDocument(() => localStorage.setItem("sfc.reportsLayout", "calendar"));
  await page.setCookie(...sessionCookies(await sessionFor(profile)));
  await page.goto(`${base}/reports?type=fellowship`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector('button[aria-label="Previous month"]', { timeout: 30000 });
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await new Promise((resolve) => setTimeout(resolve, 400));
  await page.evaluate(() => {
    const maskPhone = (value) =>
      value.replace(/\+\d[\d\s\-()]{7,}\d|\b\d{10,}\b/g, (match) => {
        const digits = match.replace(/\D/g, "");
        return digits.length >= 10 ? `••••••${digits.slice(-2)}` : match;
      });
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      const next = maskPhone(node.nodeValue ?? "");
      if (next !== node.nodeValue) node.nodeValue = next;
      node = walker.nextNode();
    }
    const nav = document.querySelector('nav[aria-label="Main"]');
    if (nav && document.documentElement.scrollHeight > window.innerHeight + 8) {
      nav.style.position = "static";
      const main = document.querySelector("main");
      if (main) main.style.paddingBottom = "0px";
    }
  });
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.screenshot({ path: file, fullPage: height < 4600 });
  console.log(`${path.basename(file)} ${height}px`);
  await page.close();
}

const subjects = await pickSubjects();
console.log(`Leader group: ${subjects.groupName}`);
const leaderDir = path.join(root, "docs", "guide", "images", "leader");
const adminDir = path.join(root, "docs", "guide", "images", "admin");
await mkdir(leaderDir, { recursive: true });
await mkdir(adminDir, { recursive: true });
const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ["--hide-scrollbars"] });
try {
  await shootCalendar(browser, subjects.leader, path.join(leaderDir, "calendar.png"));
  await shootCalendar(browser, subjects.admin, path.join(adminDir, "calendar.png"));
} finally {
  await browser.close();
}
