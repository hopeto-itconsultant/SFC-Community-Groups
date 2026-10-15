/**
 * Copies from the tap itself. Phones opened over the local network have no
 * clipboard API, and an unfocused page rejects writeText, so this also copies
 * through the tap's own copy action.
 */
export function copyText(text: string): Promise<boolean> {
  window.focus();
  const commandOk = copyWithCommand(text);
  const write = navigator.clipboard?.writeText?.bind(navigator.clipboard);
  if (!write) return Promise.resolve(commandOk);
  return write(text).then(
    () => true,
    () => commandOk,
  );
}

function copyWithCommand(text: string): boolean {
  let copied = false;
  const onCopy = (event: ClipboardEvent) => {
    if (!event.clipboardData) return;
    event.clipboardData.setData("text/plain", text);
    event.preventDefault();
    copied = true;
  };
  document.addEventListener("copy", onCopy);

  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.fontSize = "16px";
  area.style.position = "fixed";
  area.style.top = "0";
  area.style.left = "0";
  area.style.width = "2em";
  area.style.height = "2em";
  area.style.padding = "0";
  area.style.border = "none";
  area.style.outline = "none";
  area.style.boxShadow = "none";
  area.style.background = "transparent";
  document.body.appendChild(area);

  const selection = document.getSelection();
  const stored = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
  area.focus();
  area.select();
  area.setSelectionRange(0, text.length);

  try {
    document.execCommand("copy");
  } catch {
    copied = false;
  }

  document.removeEventListener("copy", onCopy);
  area.remove();
  if (stored && selection) {
    selection.removeAllRanges();
    selection.addRange(stored);
  }
  return copied;
}
