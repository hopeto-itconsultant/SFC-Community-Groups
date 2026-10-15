type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferred: BeforeInstallPromptEvent | null = null;
let listening = false;

/** Captures the browser install prompt so Settings can open it later. */
export function listenForInstallPrompt() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    window.dispatchEvent(new Event("pwa-install-available"));
  });
}

export function canPromptInstall() {
  return deferred !== null;
}

export async function promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  const prompt = deferred;
  if (!prompt) return "unavailable";
  deferred = null;
  try {
    await prompt.prompt();
    return (await prompt.userChoice).outcome;
  } catch {
    return "unavailable";
  }
}

if (typeof window !== "undefined") listenForInstallPrompt();
