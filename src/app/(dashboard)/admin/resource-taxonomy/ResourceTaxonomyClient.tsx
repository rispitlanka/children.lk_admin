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
    <div>
      <PageBreadcrumb pageTitle="Resource taxonomy" />
      <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
        Categories and sub categories appear in the organizer &quot;Add resource&quot; form.
      </p>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <ComponentCard title="Categories" desc="Super-admin list: top-level resource categories.">
            <div className="flex flex-wrap gap-2">
              <Input
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                placeholder="New category name"
                className="min-w-[200px] flex-1"
              />
              <Button type="button" size="sm" onClick={addCategory}>
                Add
              </Button>
            </div>
            <ul className="mt-4 space-y-2">
              {categories.map((c) => (
                <li
                  key={c._id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700"
                >
                  <span>
                    <span className="font-medium text-gray-900 dark:text-white">{c.name}</span>
                    <span className="ml-2 text-xs text-gray-500">{c.slug}</span>
                  </span>
                  <Button type="button" variant="outline" size="sm" onClick={() => removeCat(c._id)}>
                    Delete
                  </Button>
                </li>
              ))}
              {categories.length === 0 && (
                <li className="text-sm text-gray-500">No categories yet. Add one above.</li>
              )}
            </ul>
          </ComponentCard>

          <ComponentCard title="Sub categories" desc="Must belong to a category.">
            <div className="space-y-3">
              <div>
                <Label>Parent category</Label>
                <select
                  value={newSubCategoryId}
                  onChange={(e) => setNewSubCategoryId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
                >
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap gap-2">
                <Input
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  placeholder="New sub category name"
                  className="min-w-[200px] flex-1"
                />
                <Button type="button" size="sm" onClick={addSub} disabled={!categories.length}>
                  Add
                </Button>
              </div>
            </div>
            <ul className="mt-4 max-h-80 space-y-2 overflow-y-auto">
              {subs.map((s) => {
                const parent = categories.find((c) => c._id === s.categoryId);
                return (
                  <li
                    key={s._id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700"
                  >
                    <span>
                      <span className="font-medium text-gray-900 dark:text-white">{s.name}</span>
                      <span className="ml-2 text-xs text-gray-500">
                        under {parent?.name ?? "?"}
                      </span>
                    </span>
                    <Button type="button" variant="outline" size="sm" onClick={() => removeSub(s._id)}>
                      Delete
                    </Button>
                  </li>
                );
              })}
              {subs.length === 0 && (
                <li className="text-sm text-gray-500">No sub categories yet.</li>
              )}
            </ul>
          </ComponentCard>
        </div>
      )}
    </div>
  );
}
