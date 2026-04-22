import Link from "next/link";
import { PlusIcon } from "@/icons";

type Props = {
  href: string;
  label: string;
};

/**
 * Primary “+ label” CTA used on organizer list pages. Icon sits in a fixed box
 * centered with the label so flex alignment stays stable across browsers.
 */
export default function PlusActionLink({ href, label }: Props) {
  return (
    <Link
      href={href}
      className="inline-grid grid-flow-col auto-cols-max items-center gap-x-2.5 rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium leading-none text-white shadow-theme-xs transition hover:bg-brand-600"
    >
      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden>
        <PlusIcon className="block h-4 w-4 shrink-0" />
      </span>
      <span className="inline-flex items-center leading-none">{label}</span>
    </Link>
  );
}
