// Two ways to get a backup file off the device. Both are browser-only.

/**
 * The file as the share sheet wants it, or null if this browser cannot share files.
 * Some browsers refuse `application/json` but accept plain text, so both are tried. The name
 * keeps its .json ending either way, and import reads the contents, not the type.
 */
export function makeShareableFile(name: string, text: string): File | null {
  if (typeof navigator.canShare !== "function") return null;
  for (const type of ["application/json", "text/plain"]) {
    const file = new File([text], name, { type });
    if (navigator.canShare({ files: [file] })) return file;
  }
  return null;
}

/**
 * Opens the system share sheet — Messages, Mail, AirDrop, Save to Files. This is the "text it to
 * myself" feature, with no server involved. Resolves true if shared, false if the user backed out.
 */
export async function shareFile(file: File): Promise<boolean> {
  try {
    await navigator.share({ files: [file], title: file.name });
    return true;
  } catch (error) {
    // Closing the share sheet rejects with AbortError. That is a choice, not a failure.
    if (error instanceof DOMException && error.name === "AbortError") return false;
    throw error;
  }
}

/** Saves the text as a file through a temporary link, the standard way to download from a page. */
export function downloadTextFile(name: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  // Give the browser a moment to start the download before the temporary URL is released.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
