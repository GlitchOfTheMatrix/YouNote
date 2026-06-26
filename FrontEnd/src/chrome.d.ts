// Type declarations for the Chrome Extension messaging API.
// Only the subset used by the YouNote frontend to communicate with the extension.

declare namespace chrome {
  namespace runtime {
    const lastError: { message?: string } | undefined;

    function sendMessage(
      extensionId: string,
      message: unknown,
      callback: (response: unknown) => void,
    ): void;
  }
}
