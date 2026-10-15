import { COUNTRIES, DEFAULT_COUNTRY_ISO, countryLabel } from "@/lib/countries";
import { Field, inputClass } from "./form";

/** Country code and national number on one row, under a single Mobile number label. */
export function MobileFields({
  country = DEFAULT_COUNTRY_ISO,
  mobile = "",
  required = false,
  hint,
}: {
  country?: string;
  mobile?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <Field label="Mobile number" required={required} hint={hint}>
      <div className="flex flex-nowrap items-start gap-2">
        <div className="w-[7rem] min-w-[7rem] max-w-[7rem] shrink-0 overflow-hidden">
          <select
            name="country"
            defaultValue={country}
            aria-label="Country"
            className={`${inputClass} !w-full !min-w-0 !max-w-full !px-2`}
          >
            {COUNTRIES.map((c) => (
              <option key={c.iso} value={c.iso}>
                {countryLabel(c)}
              </option>
            ))}
          </select>
        </div>
        <input
          name="mobile"
          type="tel"
          inputMode="numeric"
          autoComplete="off"
          required={required}
          defaultValue={mobile}
          placeholder="e.g. 9876543210"
          aria-label="Mobile number"
          className={`${inputClass} min-w-0 flex-1`}
        />
      </div>
    </Field>
  );
}
