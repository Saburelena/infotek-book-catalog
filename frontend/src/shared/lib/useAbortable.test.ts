import { describe, expect, it, vi } from "vitest";

import { useAbortable } from "./useAbortable";

describe("useAbortable", () => {
  it("does not trigger Vue scope warnings outside setup", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(() => useAbortable()).not.toThrow();
    const { signal } = useAbortable();
    expect(signal()).toBeInstanceOf(AbortSignal);
    expect(warn).not.toHaveBeenCalled();

    warn.mockRestore();
  });
});
