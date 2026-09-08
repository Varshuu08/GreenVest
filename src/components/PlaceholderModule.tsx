import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

/**
 * Shared scaffold that keeps every "coming-soon" module visually consistent
 * while each concrete page supplies its own content body below the header.
 */
export function PlaceholderModule({
  icon,
  eyebrow,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader icon={icon} eyebrow={eyebrow} title={title} description={description} />
      {children}
    </div>
  );
}
