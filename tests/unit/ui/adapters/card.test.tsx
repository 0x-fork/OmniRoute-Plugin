// @vitest-environment jsdom
import React from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

const CardModule = await import("@/shared/components/Card");
const Card = CardModule.default;

afterEach(() => cleanup());

describe("Card adapter → kit Card", () => {
  it("renders header (icon, title, subtitle, action) and content on the kit card", () => {
    const { container, getByText } = render(
      <Card
        title="Usage"
        subtitle="Last 7 days"
        icon="analytics"
        action={<button>More</button>}
        data-testid="c"
      >
        body
      </Card>
    );
    const card = container.querySelector("[data-slot=card]")!;
    expect(card.className).toContain("ci-card");
    expect(card.getAttribute("data-testid")).toBe("c");
    expect(card.querySelector("[data-slot=card-header] svg.oi-icon")).not.toBeNull();
    expect(getByText("Usage").closest("[data-slot=card-title]")).not.toBeNull();
    expect(getByText("Last 7 days").closest("[data-slot=card-description]")).not.toBeNull();
    expect(getByText("More").closest("[data-slot=card-action]")).not.toBeNull();
    expect(getByText("body").closest("[data-slot=card-content]")).not.toBeNull();
  });

  it("padding=none removes the content padding; hover adds the interactive class", () => {
    const { container } = render(
      <Card padding="none" hover>
        x
      </Card>
    );
    const content = container.querySelector("[data-slot=card-content]")!;
    expect(content.className).toContain("p-0");
    expect(container.querySelector("[data-slot=card]")!.className).toContain("oi-card--hover");
  });

  it("keeps heading semantics for the title and a <p> subtitle", () => {
    const { getByRole, getByText } = render(<Card title="Providers" subtitle="All of them" />);
    const heading = getByRole("heading", { level: 3, name: "Providers" });
    expect(heading.tagName).toBe("H3");
    expect(getByText("All of them").tagName).toBe("P");
  });

  it("maps padding onto the kit header and content; className reaches the root", () => {
    const { container } = render(
      <Card title="T" padding="xs" className="mt-4">
        x
      </Card>
    );
    expect(container.querySelector("[data-slot=card]")!.className).toContain("mt-4");
    expect(container.querySelector("[data-slot=card-header]")!.className).toContain("px-3");
    expect(container.querySelector("[data-slot=card-content]")!.className).toContain("p-3");
  });

  it("keeps Card.Section / Card.Row / Card.ListItem (also as named exports) with their markup", () => {
    expect(Card.Section).toBe(CardModule.CardSection);
    expect(Card.Row).toBe(CardModule.CardRow);
    expect(Card.ListItem).toBe(CardModule.CardListItem);
    const { getByText, container } = render(
      <Card>
        <Card.Section data-testid="s">section</Card.Section>
        <Card.Row>row</Card.Row>
        <Card.ListItem actions={<button>Del</button>}>item</Card.ListItem>
      </Card>
    );
    expect(container.querySelector("[data-testid=s]")!.className).toContain("border-border");
    expect(getByText("row").className).toContain("border-b");
    const item = getByText("item").parentElement!;
    expect(item.className).toContain("group");
    expect(getByText("Del").parentElement!.className).toContain("group-hover:opacity-100");
  });
});
