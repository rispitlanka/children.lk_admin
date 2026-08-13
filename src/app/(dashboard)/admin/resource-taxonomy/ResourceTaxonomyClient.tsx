"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";

type Cat = { _id: string; name: string; slug: string; sortOrder: number; isActive: boolean };
type Sub = { _id: string; categoryId: string; name: string; slug: string; sortOrder: number; isActive: boolean };

export default function ResourceTaxonomyClient() {
  const [categories, setCategories] = useState<Cat[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCat, setNewCat] = useState("");
  const [newSubName, setNewSubName] = useState("");
  const [newSubCategoryId, setNewSubCategoryId] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [cRes, sRes] = await Promise.all([
        fetch("/api/admin/resource-categories"),
        fetch("/api/admin/resource-subcategories"),
      ]);
      const cData = await cRes.json();
      const sData = await sRes.json();
      if (!cRes.ok) throw new Error(cData.error ?? "Failed categories");
      if (!sRes.ok) throw new Error(sData.error ?? "Failed subcategories");
      setCategories(cData);
      setSubs(sData);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (categories.length && !newSubCategoryId) {
      setNewSubCategoryId(categories[0]._id);
    }
  }, [categories, newSubCategoryId]);

  const addCategory = async () => {
    if (!newCat.trim()) return;
    const res = await fetch("/api/admin/resource-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCat.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Failed");
      return;
    }
    toast.success("Category created");
    setNewCat("");
    load();
  };

  const addSub = async () => {
    if (!newSubName.trim() || !newSubCategoryId) return;
    const res = await fetch("/api/admin/resource-subcategories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId: newSubCategoryId, name: newSubName.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Failed");
      return;
    }
    toast.success("Sub category created");
    setNewSubName("");
    load();
  };

  const removeCat = async (id: string) => {
    if (!confirm("Delete this category and all its sub categories?")) return;
    const res = await fetch(`/api/admin/resource-categories/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Failed");
      return;
    }
    toast.success("Deleted");
    load();
  };

  const removeSub = async (id: string) => {
    if (!confirm("Delete this sub category?")) return;
    const res = await fetch(`/api/admin/resource-subcategories/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Failed");
      return;
    }
    toast.success("Deleted");
    load();
  };

  return (
    <div className="space-y-8">
      <div>
        <PageBreadcrumb pageTitle="Resource taxonomy" />
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Categories and sub categories appear in the organizer &quot;Add resource&quot; form.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          <ComponentCard title="Categories" desc="Super-admin list: top-level resource categories.">
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                placeholder="New category name"
                className="h-10 flex-1 min-w-[200px] rounded-[10px] border border-gray-200 bg-white px-3.5 text-xs text-gray-800 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-dark dark:text-white/90 dark:placeholder:text-white/30"
              />
              <Button type="button" size="sm" onClick={addCategory} className="h-10 px-4 text-xs">
                Add
              </Button>
            </div>
            <ul className="mt-4 divide-y divide-gray-200 dark:divide-gray-800">
              {categories.map((c) => (
                <li
                  key={c._id}
                  className="flex items-center justify-between gap-2 py-3 px-1 transition-colors hover:bg-gray-50/60 dark:hover:bg-white/[0.02]"
                >
                  <span>
                    <span className="font-medium text-gray-900 dark:text-white text-sm">{c.name}</span>
                    <span className="ml-2 text-xs text-gray-400">{c.slug}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeCat(c._id)}
                    className="inline-flex h-8 items-center justify-center rounded-[6px] bg-transparent px-2.5 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                  >
                    Delete
                  </button>
                </li>
              ))}
              {categories.length === 0 && (
                <li className="py-8 text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">No categories yet. Add one above.</p>
                </li>
              )}
            </ul>
          </ComponentCard>

          <ComponentCard title="Sub categories" desc="Must belong to a category.">
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-gray-500 mb-1">Parent category</Label>
                <select
                  value={newSubCategoryId}
                  onChange={(e) => setNewSubCategoryId(e.target.value)}
                  className="h-10 w-full rounded-[10px] border border-gray-200 bg-white px-3.5 text-xs font-medium text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-dark dark:text-gray-300"
                >
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  placeholder="New sub category name"
                  className="h-10 flex-1 min-w-[200px] rounded-[10px] border border-gray-200 bg-white px-3.5 text-xs text-gray-800 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-dark dark:text-white/90 dark:placeholder:text-white/30"
                />
                <Button type="button" size="sm" onClick={addSub} disabled={!categories.length} className="h-10 px-4 text-xs">
                  Add
                </Button>
              </div>
            </div>
            <ul className="mt-4 max-h-80 divide-y divide-gray-200 overflow-y-auto dark:divide-gray-800">
              {subs.map((s) => {
                const parent = categories.find((c) => c._id === s.categoryId);
                return (
                  <li
                    key={s._id}
                    className="flex items-center justify-between gap-2 py-3 px-1 transition-colors hover:bg-gray-50/60 dark:hover:bg-white/[0.02]"
                  >
                    <span>
                      <span className="font-medium text-gray-900 dark:text-white text-sm">{s.name}</span>
                      <span className="ml-2 text-xs text-gray-400">
                        under {parent?.name ?? "?"}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSub(s._id)}
                      className="inline-flex h-8 items-center justify-center rounded-[6px] bg-transparent px-2.5 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                    >
                      Delete
                    </button>
                  </li>
                );
              })}
              {subs.length === 0 && (
                <li className="py-8 text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">No sub categories yet.</p>
                </li>
              )}
            </ul>
          </ComponentCard>
        </div>
      )}
    </div>
  );
}
