// @vitest-environment jsdom
import React, { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const { default: Modal } = await import("../../../src/shared/components/Modal");

const cleanups: Array<() => void> = [];

// The kit Dialog (Radix FocusScope) restores focus to the opener on a
// `setTimeout(0)` after the dialog unmounts — flush one macrotask inside act.
const flush = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));

function Harness() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)}>
        Open details
      </button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Details">
        Modal body
      </Modal>
    </>
  );
}

function renderHarness() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(<Harness />));
  cleanups.push(() => {
    act(() => root.unmount());
    container.remove();
  });
  return container;
}

// The dialog is portaled to document.body (Radix), not rendered inside the container.
const getDialog = () => document.body.querySelector<HTMLElement>('[role="dialog"]');

beforeEach(() => {
  (
    globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  while (cleanups.length) cleanups.pop()!();
  vi.restoreAllMocks();
});

describe("shared Modal focus restoration", () => {
  it("returns focus to the trigger after Escape closes the dialog", async () => {
    const container = renderHarness();
    const trigger = container.querySelector<HTMLButtonElement>("button")!;

    act(() => {
      trigger.focus();
      trigger.click();
    });

    const dialog = getDialog()!;
    expect(dialog).not.toBeNull();
    act(() => {
      dialog.querySelector<HTMLButtonElement>("button")!.focus();
    });
    expect(document.activeElement).not.toBe(trigger);

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });
    await flush();

    expect(getDialog()).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("returns focus after the close button dismisses the dialog", async () => {
    const container = renderHarness();
    const trigger = container.querySelector<HTMLButtonElement>("button")!;

    act(() => {
      trigger.focus();
      trigger.click();
    });

    const closeButton = getDialog()!.querySelector<HTMLButtonElement>("button")!;
    act(() => {
      closeButton.focus();
      closeButton.click();
    });
    await flush();

    expect(getDialog()).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("does not land focus on an opener that was removed while the dialog was open", async () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    let isOpen = true;
    const renderModal = () => {
      root.render(
        <Modal
          isOpen={isOpen}
          onClose={() => {
            isOpen = false;
            renderModal();
          }}
          title="Details"
        >
          Modal body
        </Modal>
      );
    };

    act(renderModal);
    trigger.remove();

    expect(() => {
      act(() => {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      });
    }).not.toThrow();
    await flush();

    expect(getDialog()).toBeNull();
    // Focusing a detached element is a no-op: focus must not end up on the removed opener.
    expect(document.activeElement).not.toBe(trigger);
    expect(document.activeElement).toBe(document.body);
    act(() => root.unmount());
    container.remove();
  });
});
