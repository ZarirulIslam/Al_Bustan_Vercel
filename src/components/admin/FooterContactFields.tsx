"use client";

import { useState } from "react";
import type { FooterOffice, SiteSettings } from "@/lib/types";
import type { SettingsFormState } from "@/lib/admin/settingsSchema";

const inputClass =
  "w-full rounded border border-limestone-300 bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-garden-500";

// "Footer contact" part of Website Settings: the footer's Contact column,
// laid out like the reference site — named offices with multi-line
// addresses, then phone numbers, emails and the website. Offices are sent
// to the server as JSON in a hidden field.
export function FooterContactFields({
  settings,
  errors,
}: {
  settings: SiteSettings;
  errors?: SettingsFormState["fieldErrors"];
}) {
  const [offices, setOffices] = useState<FooterOffice[]>(
    settings.footerOffices.length > 0 ? settings.footerOffices : [{ name: "Corporate Office", address: settings.address }]
  );

  const update = (i: number, patch: Partial<FooterOffice>) =>
    setOffices((list) => list.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));
  const move = (i: number, delta: -1 | 1) =>
    setOffices((list) => {
      const next = [...list];
      [next[i], next[i + delta]] = [next[i + delta], next[i]];
      return next;
    });

  return (
    <div className="space-y-6">
      <input type="hidden" name="footerOffices" value={JSON.stringify(offices)} />

      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-ink">Offices</p>
          {offices.length < 8 && (
            <button
              type="button"
              onClick={() => setOffices((list) => [...list, { name: "", address: "" }])}
              className="text-xs font-medium text-garden-700 hover:underline"
            >
              + Add office
            </button>
          )}
        </div>
        <p className="mt-0.5 text-xs text-ink-soft">Each office shows its name in bold with the address underneath — one line per row.</p>

        <div className="mt-3 space-y-3">
          {offices.map((office, i) => (
            <div key={i} className="rounded-lg border border-limestone-300 bg-limestone-100/60 p-4">
              <div className="flex items-center gap-2">
                <input
                  aria-label={`Office ${i + 1} name`}
                  value={office.name}
                  onChange={(e) => update(i, { name: e.target.value })}
                  placeholder="e.g. Corporate Office"
                  className={inputClass}
                />
                <button
                  type="button"
                  aria-label="Move up"
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                  className="rounded border border-limestone-300 px-2 py-2 text-xs text-ink-soft hover:text-garden-700 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label="Move down"
                  disabled={i === offices.length - 1}
                  onClick={() => move(i, 1)}
                  className="rounded border border-limestone-300 px-2 py-2 text-xs text-ink-soft hover:text-garden-700 disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  aria-label="Remove office"
                  onClick={() => setOffices((list) => list.filter((_, idx) => idx !== i))}
                  className="rounded border border-red-200 px-2.5 py-2 text-xs text-red-700 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
              <textarea
                aria-label={`Office ${i + 1} address`}
                value={office.address}
                onChange={(e) => update(i, { address: e.target.value })}
                rows={3}
                placeholder={"16 Tower Hamlet, Level 03\nKamal Ataturk Avenue, Banani\nDhaka-1213, Bangladesh"}
                className={`${inputClass} mt-2`}
              />
            </div>
          ))}
          {offices.length === 0 && (
            <p className="rounded-lg border border-dashed border-limestone-300 px-4 py-4 text-center text-xs text-ink-soft">
              No offices — the footer will show the main address from “Office” above.
            </p>
          )}
        </div>
        {errors?.footerOffices && <p className="mt-1 text-xs text-red-700">{errors.footerOffices}</p>}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="footerPhones" className="text-sm text-ink">
            Phone numbers
          </label>
          <textarea
            id="footerPhones"
            name="footerPhones"
            rows={3}
            defaultValue={settings.footerPhones.join("\n")}
            placeholder={settings.phone || "+88 01X XXXX XXXX"}
            className={`${inputClass} mt-1.5`}
          />
          <p className="mt-1 text-xs text-ink-soft">One per line. Empty = the main phone above.</p>
          {errors?.footerPhones && <p className="mt-1 text-xs text-red-700">{errors.footerPhones}</p>}
        </div>
        <div>
          <label htmlFor="footerEmails" className="text-sm text-ink">
            Email addresses
          </label>
          <textarea
            id="footerEmails"
            name="footerEmails"
            rows={3}
            defaultValue={settings.footerEmails.join("\n")}
            placeholder={settings.email || "info@example.com"}
            className={`${inputClass} mt-1.5`}
          />
          <p className="mt-1 text-xs text-ink-soft">One per line. Empty = the main email above.</p>
          {errors?.footerEmails && <p className="mt-1 text-xs text-red-700">{errors.footerEmails}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="website" className="text-sm text-ink">
          Website (optional)
        </label>
        <input
          id="website"
          name="website"
          defaultValue={settings.website ?? ""}
          placeholder="www.example.com"
          className={`${inputClass} mt-1.5`}
        />
        {errors?.website && <p className="mt-1 text-xs text-red-700">{errors.website}</p>}
      </div>
    </div>
  );
}
