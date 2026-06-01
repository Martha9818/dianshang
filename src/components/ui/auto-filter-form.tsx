"use client";

import { useRouter } from "next/navigation";
import type { FocusEvent, FormEvent, KeyboardEvent, ReactNode } from "react";

type AutoFilterFormProps = {
  action: string;
  className?: string;
  children: ReactNode;
  dropParams?: string[];
};

const textInputTypes = new Set(["", "text", "search", "number", "email", "url", "tel"]);

function isTextLikeControl(target: EventTarget | null): target is HTMLInputElement | HTMLTextAreaElement {
  if (target instanceof HTMLTextAreaElement) return true;
  if (!(target instanceof HTMLInputElement)) return false;
  return textInputTypes.has(target.type);
}

function buildFilterUrl(form: HTMLFormElement, action: string, dropParams: Set<string>) {
  const params = new URLSearchParams();

  for (const [name, rawValue] of new FormData(form).entries()) {
    if (dropParams.has(name) || typeof rawValue !== "string") continue;

    const value = rawValue.trim();
    if (!value) continue;
    params.append(name, value);
  }

  const query = params.toString();
  return query ? `${action}?${query}` : action;
}

export function AutoFilterForm({ action, className, children, dropParams = [] }: AutoFilterFormProps) {
  const router = useRouter();
  const droppedParams = new Set(dropParams);

  function applyFilters(form: HTMLFormElement) {
    router.replace(buildFilterUrl(form, action, droppedParams), { scroll: false });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyFilters(event.currentTarget);
  }

  function handleChange(event: FormEvent<HTMLFormElement>) {
    if (event.target instanceof HTMLSelectElement) {
      applyFilters(event.currentTarget);
    }
  }

  function handleFocus(event: FocusEvent<HTMLFormElement>) {
    if (isTextLikeControl(event.target)) {
      event.target.dataset.autoFilterValue = event.target.value;
    }
  }

  function handleBlur(event: FocusEvent<HTMLFormElement>) {
    if (!isTextLikeControl(event.target)) return;
    if (event.target.dataset.autoFilterValue === event.target.value) return;

    applyFilters(event.currentTarget);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key !== "Enter" || event.nativeEvent.isComposing || !isTextLikeControl(event.target)) return;

    event.preventDefault();
    applyFilters(event.currentTarget);
    event.target.dataset.autoFilterValue = event.target.value;
  }

  return (
    <form className={className} onBlur={handleBlur} onChange={handleChange} onFocus={handleFocus} onKeyDown={handleKeyDown} onSubmit={handleSubmit}>
      {children}
    </form>
  );
}
