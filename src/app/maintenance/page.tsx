import Icon from "@/shared/components/Icon";
import { OmniRouteLockup } from "@/shared/components/OmniRouteLogo";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function MaintenancePage() {
  const t = useTranslations("publicSystem");

  return (
    <main className="min-h-screen text-text-main flex items-center justify-center p-6">
      <section className="w-full max-w-xl rounded-2xl border border-border bg-surface p-8 shadow-soft text-center">
        <div className="mb-4 flex justify-center">
          <OmniRouteLockup />
        </div>
        <Icon name="construction" size={48} className="mx-auto mb-3 text-text-muted" />
        <h1 className="ci-heading text-2xl">{t("maintenance.title")}</h1>
        <p className="mt-3 text-text-muted leading-relaxed">{t("maintenance.description")}</p>

        <ul className="mt-6 text-sm text-text-muted text-left rounded-xl border border-border bg-bg-alt p-4 space-y-2">
          <li className="flex items-start gap-2">
            <Icon name="info" size={16} className="text-primary mt-0.5" />
            {t("maintenance.suggestion1")}
          </li>
          <li className="flex items-start gap-2">
            <Icon name="info" size={16} className="text-primary mt-0.5" />
            {t("maintenance.suggestion2")}
          </li>
        </ul>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            href="/status"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-sm font-semibold bg-primary text-accent-foreground hover:bg-primary-hover hover:shadow-elevated transition-all duration-200 motion-reduce:transition-none"
          >
            {t("maintenance.systemStatus")}
          </Link>
          <Link
            href="/dashboard/health"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-sm font-semibold border border-border hover:bg-bg-alt transition-colors duration-200 motion-reduce:transition-none"
          >
            {t("maintenance.healthDashboard")}
          </Link>
        </div>
      </section>
    </main>
  );
}
