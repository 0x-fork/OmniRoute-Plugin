"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Tabs, TabsList, TabsTrigger } from "@omniroute/ui-kit/tabs";
import type { InterceptedRequest } from "@/mitm/inspector/types";
import EmptyState from "@/shared/components/EmptyState";
import Icon from "@/shared/components/Icon";
import { HeadersTab } from "./tabs/HeadersTab";
import { RequestBodyTab } from "./tabs/RequestBodyTab";
import { ResponseBodyTab } from "./tabs/ResponseBodyTab";
import { TimingTab } from "./tabs/TimingTab";
import { LlmDetailsTab } from "./tabs/LlmDetailsTab";
import { ConversationTab } from "./tabs/ConversationTab";
import { StatsTab } from "./tabs/StatsTab";
import { AnnotationField } from "./shared/AnnotationField";

type TabId = "conversation" | "headers" | "request" | "response" | "timing" | "llm" | "stats";

interface Tab {
  id: TabId;
  labelKey: string;
  icon: string;
  llmOnly?: boolean;
}

const TABS: Tab[] = [
  { id: "conversation", labelKey: "tabConversation", icon: "chat_bubble" },
  { id: "headers", labelKey: "tabHeaders", icon: "list" },
  { id: "request", labelKey: "tabRequest", icon: "upload" },
  { id: "response", labelKey: "tabResponse", icon: "download" },
  { id: "timing", labelKey: "tabTiming", icon: "timer" },
  { id: "llm", labelKey: "tabLlm", icon: "psychology", llmOnly: true },
  { id: "stats", labelKey: "tabStats", icon: "bar_chart" },
];

interface DetailsPanelProps {
  request: InterceptedRequest | null;
  allRequests: InterceptedRequest[];
}

export function DetailsPanel({ request, allRequests }: DetailsPanelProps) {
  const t = useTranslations("trafficInspector");
  const [activeTab, setActiveTab] = useState<TabId>("conversation");

  if (!request) {
    return (
      <div data-testid="details-panel" className="h-full flex items-center justify-center p-4">
        <EmptyState icon="info" title={t("selectRequest")} />
      </div>
    );
  }

  const isLlm = request.detectedKind === "llm";
  const visibleTabs = TABS.filter((t) => !t.llmOnly || isLlm);

  // Ensure active tab is valid
  const currentTab = visibleTabs.find((t) => t.id === activeTab) ? activeTab : "conversation";

  return (
    <div data-testid="details-panel" className="h-full flex flex-col overflow-hidden">
      {/* Tab bar — panels render below conditionally, so the triggers drop aria-controls. */}
      <Tabs
        variant="underline"
        value={currentTab}
        onValueChange={(next) => setActiveTab(next as TabId)}
        className="shrink-0 border-b border-border bg-bg-subtle px-2 pt-1"
      >
        <TabsList aria-label={t("requestDetails")} className="flex-wrap">
          {visibleTabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              aria-controls={undefined}
              className="gap-1 text-xs"
            >
              <Icon name={tab.icon} size={13} />
              {t(tab.labelKey)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {currentTab === "conversation" && <ConversationTab request={request} />}
        {currentTab === "headers" && <HeadersTab request={request} />}
        {currentTab === "request" && <RequestBodyTab request={request} />}
        {currentTab === "response" && <ResponseBodyTab request={request} />}
        {currentTab === "timing" && <TimingTab request={request} />}
        {currentTab === "llm" && isLlm && <LlmDetailsTab request={request} />}
        {currentTab === "stats" && <StatsTab requests={allRequests} />}
      </div>

      {/* Annotation footer */}
      <div className="shrink-0 border-t border-border px-3 py-2 bg-bg-subtle">
        <AnnotationField requestId={request.id} initialValue={request.annotation ?? ""} />
      </div>
    </div>
  );
}
