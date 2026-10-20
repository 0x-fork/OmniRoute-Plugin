// @vitest-environment jsdom
import React, { useState } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const {
  default: Modal,
  ConfirmModal,
  TALL_MODAL_PROPS,
} = await import("@/shared/components/Modal");

afterEach(() => cleanup());

// Radix restores focus (FocusScope) and arms its outside-pointer listener
// (DismissableLayer) on a `setTimeout(0)`: flush one macrotask inside act.
const flush = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));

// A real outside click is pointerdown + click; Radix defers a left-button
// pointerdown outside until its click (drag-select protection).
function clickOutside() {
  fireEvent.pointerDown(document.body);
  fireEvent.click(document.body);
}

function Harness({ closeOnOverlay = true }: { closeOnOverlay?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Details"
        closeOnOverlay={closeOnOverlay}
        footer={<span>footer</span>}
        {...TALL_MODAL_PROPS}
      >
        <button type="button">Inside</button>
      </Modal>
    </>
  );
}

describe("Modal adapter → kit Dialog (Radix)", () => {
  it("opens as a labelled modal dialog, moves focus inside, Escape closes and restores focus", async () => {
    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Open" });
    trigger.focus();
    fireEvent.click(trigger);
    const dialog = await screen.findByRole("dialog", { name: "Details" });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.className).toContain("ci-dialog");
    expect(dialog.className).toContain("max-h-[90vh]");
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(screen.getByText("footer").closest("[data-slot=dialog-footer]")).not.toBeNull();
    // #6265 — the body keeps the preset's plain padding, no second scroll owner
    const body = dialog.querySelector<HTMLElement>("[data-slot=modal-body]")!;
    expect(body.className).toBe("p-6");
    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    await flush();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("the close button is translated and calls onClose exactly once", async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="T">
        x
      </Modal>
    );
    fireEvent.click(await screen.findByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    // The kit's hardcoded "Close dialog" button is replaced by the translated one
    expect(screen.queryByRole("button", { name: "Close dialog" })).toBeNull();
  });

  it("closeOnOverlay=false keeps the dialog open on an outside click", async () => {
    render(<Harness closeOnOverlay={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    await screen.findByRole("dialog");
    await flush();
    clickOutside();
    await flush();
    expect(screen.queryByRole("dialog")).not.toBeNull();
  });

  it("closeOnOverlay=true (default) closes on an outside click", async () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    await screen.findByRole("dialog");
    await flush();
    clickOutside();
    await flush();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("falls back to an sr-only translated title so the dialog is always named", async () => {
    render(
      <Modal isOpen onClose={() => {}}>
        body
      </Modal>
    );
    const dialog = await screen.findByRole("dialog", { name: "Dialog" });
    expect(dialog.querySelector("[data-slot=dialog-title]")!.className).toContain("ci-sr-only");
  });

  it("ConfirmModal renders cancel/confirm with a destructive default and forwards loading", async () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmModal
        isOpen
        onClose={() => {}}
        onConfirm={onConfirm}
        message="Sure?"
        confirmText="Delete it"
      />
    );
    const confirm = await screen.findByRole("button", { name: "Delete it" });
    // Legacy Button paints `danger` as bg-red-500; the kit Button (track C) as
    // ci-button--destructive. F1 drops the legacy branch once C lands.
    expect(confirm.className).toMatch(/ci-button--destructive|bg-red-500/);
    fireEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Cancel" })).not.toBeNull();
  });
});
