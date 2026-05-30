"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DashboardCard,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
  FilterBar,
  StatusBadge,
  TableScrollArea,
} from "@/components/dashboard/primitives";
import { deleteBannedWordAction, saveBannedWordAction } from "@/app/settings/actions";

type BannedWordView = {
  id: number;
  word: string;
  category: string;
  riskLevel: string;
  createdAt: Date;
};

const inputClassName =
  "h-12 w-full rounded-2xl border border-[#E4EAF3] bg-white px-4 text-sm text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] outline-none transition-all duration-200 ease-out hover:border-blue-200 hover:shadow-[0_10px_22px_rgba(59,130,246,0.08),inset_0_1px_0_rgba(255,255,255,0.85)] focus:border-blue-300 focus:ring-4 focus:ring-blue-50 motion-reduce:transition-none";

function getRiskTone(level: string) {
  if (level === "高") return "red" as const;
  if (level === "中") return "amber" as const;
  return "slate" as const;
}

export function BannedWordsManager({
  words,
  categories,
  riskLevels,
  runtimeNotice,
}: {
  words: BannedWordView[];
  categories: string[];
  riskLevels: string[];
  runtimeNotice?: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    id: "",
    word: "",
    category: categories[0] ?? "绝对化用语",
    riskLevel: riskLevels[0] ?? "高",
  });

  const query = searchParams.get("q") ?? "";
  const selectedCategory = searchParams.get("category") ?? "";
  const selectedRiskLevel = searchParams.get("riskLevel") ?? "";

  function resetForm() {
    setForm({
      id: "",
      word: "",
      category: categories[0] ?? "绝对化用语",
      riskLevel: riskLevels[0] ?? "高",
    });
  }

  function updateFilters(next: { q?: string; category?: string; riskLevel?: string }) {
    const params = new URLSearchParams(searchParams.toString());

    const q = next.q ?? query;
    const category = next.category ?? selectedCategory;
    const riskLevel = next.riskLevel ?? selectedRiskLevel;

    if (q.trim()) params.set("q", q.trim());
    else params.delete("q");

    if (category.trim()) params.set("category", category.trim());
    else params.delete("category");

    if (riskLevel.trim()) params.set("riskLevel", riskLevel.trim());
    else params.delete("riskLevel");

    router.push(`/settings/banned-words${params.toString() ? `?${params.toString()}` : ""}`);
  }

  function submit() {
    const formData = new FormData();
    formData.set("wordId", form.id);
    formData.set("word", form.word);
    formData.set("category", form.category);
    formData.set("riskLevel", form.riskLevel);

    startTransition(async () => {
      const result = await saveBannedWordAction(formData);
      if (!result.success) {
        setMessage(result.error);
        return;
      }

      setMessage("违规词已保存。");
      resetForm();
      router.refresh();
    });
  }

  return (
    <>
      {runtimeNotice ? (
        <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700">
          {runtimeNotice}
        </div>
      ) : null}

      <FilterBar>
        <div className="xl:min-w-[260px] xl:flex-1">
          <p className="mb-2 px-1 text-sm text-slate-500">搜索违规词</p>
          <input
            className={inputClassName}
            defaultValue={query}
            placeholder="输入关键词后回车筛选"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                updateFilters({ q: (event.currentTarget as HTMLInputElement).value });
              }
            }}
          />
        </div>
        <div className="xl:min-w-[220px]">
          <p className="mb-2 px-1 text-sm text-slate-500">分类筛选</p>
          <select className={inputClassName} value={selectedCategory} onChange={(event) => updateFilters({ category: event.target.value })}>
            <option value="">全部分类</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="xl:min-w-[220px]">
          <p className="mb-2 px-1 text-sm text-slate-500">风险等级筛选</p>
          <select className={inputClassName} value={selectedRiskLevel} onChange={(event) => updateFilters({ riskLevel: event.target.value })}>
            <option value="">全部等级</option>
            {riskLevels.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </FilterBar>

      <div className="grid gap-4 xl:grid-cols-[0.86fr_1.14fr]">
        <DashboardCard className="px-5 py-5">
          <h2 className="text-[1.12rem] font-semibold text-slate-900">{form.id ? "编辑违规词" : "新增违规词"}</h2>
          <div className="mt-5 grid gap-4">
            <Field label="词语">
              <input className={inputClassName} value={form.word} onChange={(event) => setForm((current) => ({ ...current, word: event.target.value }))} />
            </Field>
            <Field label="分类">
              <select className={inputClassName} value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}>
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="风险等级">
              <select className={inputClassName} value={form.riskLevel} onChange={(event) => setForm((current) => ({ ...current, riskLevel: event.target.value }))}>
                {riskLevels.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {message ? (
            <div className="mt-4 rounded-2xl border border-[#E4EAF3] bg-[#FBFDFF] px-4 py-3 text-sm text-slate-600">{message}</div>
          ) : null}

          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={resetForm} className="inline-flex h-12 items-center justify-center rounded-2xl border border-[#E4EAF3] bg-white px-5 text-sm font-medium text-slate-600">
              重置
            </button>
            <button type="button" disabled={isPending} onClick={submit} className="inline-flex h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2B73FF,#1B56E3)] px-5 text-sm font-medium text-white disabled:opacity-70">
              {isPending ? "处理中..." : "保存"}
            </button>
          </div>
        </DashboardCard>

        <DashboardCard>
          <div className="border-b border-[#EEF2F8] px-5 py-4">
            <h2 className="text-[1.08rem] font-semibold text-slate-900">违规词列表</h2>
          </div>
          <TableScrollArea>
            <DataTable className="min-w-[720px]">
              <DataTableHead>
                <tr>
                  <DataTableHeaderCell>词语</DataTableHeaderCell>
                  <DataTableHeaderCell>分类</DataTableHeaderCell>
                  <DataTableHeaderCell>风险等级</DataTableHeaderCell>
                  <DataTableHeaderCell>操作</DataTableHeaderCell>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {words.map((word) => (
                  <DataTableRow key={word.id}>
                    <DataTableCell>{word.word}</DataTableCell>
                    <DataTableCell>{word.category}</DataTableCell>
                    <DataTableCell>
                      <StatusBadge label={word.riskLevel} tone={getRiskTone(word.riskLevel)} />
                    </DataTableCell>
                    <DataTableCell>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setForm({
                              id: String(word.id),
                              word: word.word,
                              category: word.category,
                              riskLevel: word.riskLevel,
                            })
                          }
                          className="inline-flex h-10 items-center rounded-xl border border-[#DCE5F2] px-3 text-sm font-medium text-[#2563EB] hover:bg-blue-50"
                        >
                          编辑
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            startTransition(async () => {
                              const result = await deleteBannedWordAction(word.id);
                              setMessage(result.success ? "违规词已删除。" : result.error);
                              if (result.success) {
                                router.refresh();
                              }
                            });
                          }}
                          className="inline-flex h-10 items-center rounded-xl border border-rose-200 px-3 text-sm font-medium text-rose-600 hover:bg-rose-50"
                        >
                          删除
                        </button>
                      </div>
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          </TableScrollArea>
        </DashboardCard>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-medium text-slate-700">{label}</div>
      {children}
    </label>
  );
}
