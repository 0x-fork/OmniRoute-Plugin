// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { default: Collapsible } = await import("@/shared/components/Collapsible");
const { default: CollapsibleSection } = await import("@/shared/components/CollapsibleSection");
const { default: SegmentedControl } = await import("@/shared/components/SegmentedControl");

afterEach(() => cleanup());

describe("Collapsible / CollapsibleSection / SegmentedControl adapters", () => {
  it("Collapsible toggles with a single native button carrying aria-expanded; trailing stays outside", () => {
    render(
      <Collapsible
        title="Advanced"
        subtitle="more"
        icon="tune"
        trailing={<button type="button">Act</button>}
      >
        body
      </Collapsible>
    );
    const trigger = screen.getByRole("button", { name: /Advanced/ });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.querySelector("button")).toBeNull();
    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("body")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Act" }).closest("button[aria-expanded]")).toBeNull();
  });

  it("CollapsibleSection opens by default when asked and shows the count badge", () => {
    render(
      <CollapsibleSection title="Items" count={3} defaultOpen>
        inner
      </CollapsibleSection>
    );
    expect(screen.getByRole("button", { name: /Items/ }).getAttribute("aria-expanded")).toBe(
      "true"
    );
    expect(screen.getByText("3").className).toContain("ci-badge");
    expect(screen.getByText("inner")).not.toBeNull();
  });

  it("SegmentedControl is a tablist with aria-selected and reports onChange", () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl
        aria-label="View"
        value="a"
        onChange={onChange}
        options={[
          { value: "a", label: "A", icon: "view_list" },
          { value: "b", label: "B" },
        ]}
      />
    );
    const tabs = screen.getAllByRole("tab");
    expect(screen.getByRole("tablist", { name: "View" })).not.toBeNull();
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    expect(tabs[0].querySelector("svg.oi-icon")).not.toBeNull();
    fireEvent.click(tabs[1]);
    expect(onChange).toHaveBeenCalledWith("b");
  });
});
