import { Field, inputClass } from "@/components/form";
import { todayISO } from "@/lib/format";

/** Optional date of birth, email, and the date a leader started serving. */
export function LeaderDetailFields({
  dateOfBirth = "",
  email = "",
  servingSince = "",
}: {
  dateOfBirth?: string;
  email?: string;
  servingSince?: string;
}) {
  return (
    <>
      <Field label="Date of birth">
        <input name="dateOfBirth" type="date" defaultValue={dateOfBirth} max={todayISO()} className={inputClass} />
      </Field>
      <Field label="Email">
        <input
          name="email"
          type="email"
          defaultValue={email}
          autoComplete="email"
          inputMode="email"
          className={inputClass}
        />
      </Field>
      <Field label="Started serving">
        <input name="servingSince" type="date" defaultValue={servingSince} max={todayISO()} className={inputClass} />
      </Field>
    </>
  );
}
