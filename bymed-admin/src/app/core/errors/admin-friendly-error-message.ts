/** Maps thrown values to a short, non-technical message for the admin UI. */
export function getAdminFriendlyErrorMessage(error: unknown): string {
  if (error === null || error === undefined) {
    return 'Something went wrong. Try reloading the page.';
  }

  if (typeof error === 'string' && error.trim().length > 0) {
    return summarizeChunkLoadMessage(error) ?? 'Something went wrong. Try reloading the page.';
  }

  if (error instanceof Error) {
    const fromChunk = summarizeChunkLoadMessage(error.message) ?? summarizeChunkLoadMessage(error.name);
    if (fromChunk) {
      return fromChunk;
    }
  }

  return 'Something went wrong. Try reloading the page.';
}

function summarizeChunkLoadMessage(text: string | undefined): string | null {
  if (!text) {
    return null;
  }

  if (text.includes('ChunkLoadError') || /loading chunk [\d]+ failed/i.test(text)) {
    return 'The app may have been updated or the connection dropped. Reload the page to continue.';
  }

  return null;
}
