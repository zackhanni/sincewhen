"use client";

import { useRef } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  MAX_FREQUENCY_COUNT,
  MAX_NAME_LENGTH,
  convertFrequency,
  isValidCalendarDate,
  todayCalendarDate,
  type CalendarDate,
  type Frequency,
  type FrequencyUnit,
  type TaskNode,
} from "@/lib/core";
import { cn } from "@/lib/utils";

/** What the form hands back. `lastCompleted` is left out when the item does not repeat. */
export type NodeFormResult = {
  name: string;
  frequency: Frequency | null;
  lastCompleted?: CalendarDate | null;
};

type LastDoneChoice = "today" | "date" | "never";

const UNITS: { value: FrequencyUnit; label: string }[] = [
  { value: "day", label: "days" },
  { value: "week", label: "weeks" },
  { value: "month", label: "months" },
  { value: "year", label: "years" },
];

const LAST_DONE_CHOICES: { value: LastDoneChoice; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "date", label: "Pick a date" },
  { value: "never", label: "Never (due now)" },
];

// TanStack Form validators return an error message, or undefined when the value is fine.
const validateName = ({ value }: { value: string }) =>
  value.trim().length === 0
    ? "Give it a name"
    : value.trim().length > MAX_NAME_LENGTH
      ? `Keep it under ${MAX_NAME_LENGTH} characters`
      : undefined;

const validateCount = ({ value }: { value: number }) =>
  Number.isInteger(value) && value >= 1 && value <= MAX_FREQUENCY_COUNT
    ? undefined
    : `Enter a whole number from 1 to ${MAX_FREQUENCY_COUNT}`;

/** Native controls are styled to match the shadcn Input. On a phone they open the system picker. */
const nativeControl =
  "h-9 rounded-lg border border-input bg-transparent px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type NodeFormProps = {
  /** The item being edited, or undefined when adding a new one. */
  node?: TaskNode;
  /** Whether a brand-new item starts as a repeating task (true) or a plain folder (false). */
  startsRepeating: boolean;
  /** A top-level item is usually a location or a category, which changes the example name shown. */
  atTopLevel: boolean;
  submitLabel: string;
  onSubmit: (result: NodeFormResult) => void;
};

/** The greyed-out example in the empty name box, matched to what is being added. */
function namePlaceholder(repeats: boolean, atTopLevel: boolean): string {
  if (repeats) return "Change the air filter";
  return atTopLevel ? "Home, Work, or Cleaning" : "Kitchen";
}

export function NodeForm({ node, startsRepeating, atTopLevel, submitLabel, onSubmit }: NodeFormProps) {
  const today = todayCalendarDate();

  const form = useForm({
    defaultValues: {
      name: node?.name ?? "",
      repeats: node ? node.frequency !== null : startsRepeating,
      count: node?.frequency?.count ?? 1,
      unit: (node?.frequency?.unit ?? "month") as FrequencyUnit,
      // Editing shows the stored date. A new task defaults to "done today", so it first comes
      // due one full interval from now rather than immediately.
      lastDone: (node ? (node.lastCompleted ? "date" : "never") : "today") as LastDoneChoice,
      lastDoneDate: node?.lastCompleted ?? today,
    },
    onSubmit: ({ value }) => {
      if (!value.repeats) {
        // A folder has no use for a last-done date, and the form hid those controls. Leaving
        // `lastCompleted` out (rather than sending null) keeps whatever is stored, so switching
        // a task to a folder and back does not wipe its history.
        onSubmit({ name: value.name.trim(), frequency: null });
        return;
      }
      const lastCompleted =
        value.lastDone === "never" ? null : value.lastDone === "today" ? today : value.lastDoneDate;
      onSubmit({
        name: value.name.trim(),
        frequency: { count: value.count, unit: value.unit },
        lastCompleted,
      });
    },
  });

  // Read here, above the fields, because the name box's example depends on it.
  const isRepeating = useStore(form.store, (state) => state.values.repeats);

  // Changing the unit of a saved task keeps the same length of time: "every 2 weeks" switched
  // to days becomes "every 14 days", ready to adjust. Each switch converts from the saved
  // frequency, not from the previous switch, so flicking through the units and back returns the
  // original number instead of piling up rounding (2 weeks -> 1 month -> 4 weeks).
  // Once the user types a number, or when adding a new task, nothing is converted: the number is
  // meant for the unit picked next. Someone who types "2" and then picks "weeks" means 2 weeks.
  const convertFrom = useRef<Frequency | null>(node?.frequency ?? null);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <FieldGroup>
        <form.Field name="name" validators={{ onSubmit: validateName }}>
          {(field) => (
            <Field data-invalid={field.state.meta.errors.length > 0}>
              <FieldLabel htmlFor={field.name}>Name</FieldLabel>
              <Input
                id={field.name}
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                placeholder={namePlaceholder(isRepeating, atTopLevel)}
                autoComplete="off"
                // 16px text stops iOS Safari zooming the page in when an input is focused.
                className="h-9 text-base"
              />
              <FieldError errors={field.state.meta.errors.map((message) => ({ message }))} />
            </Field>
          )}
        </form.Field>

        <form.Field name="repeats">
          {(field) => (
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={field.state.value}
                onChange={(event) => field.handleChange(event.target.checked)}
                className="mt-0.5 size-5"
              />
              <span>
                <span className="font-medium">Repeats</span>
                <span className="block text-muted-foreground">
                  Off makes this a folder: it holds other items but cannot be checked off.
                </span>
              </span>
            </label>
          )}
        </form.Field>

        {/* Subscribe re-renders only this part when `repeats` or `lastDone` changes. */}
        <form.Subscribe selector={(state) => [state.values.repeats, state.values.lastDone] as const}>
          {([repeats, lastDone]) =>
            repeats && (
              <>
                <Field>
                  <FieldLabel htmlFor="count">Every</FieldLabel>
                  <div className="flex gap-2">
                    <form.Field
                      name="count"
                      validators={{
                        // A hidden control must not block saving: only check it while it applies.
                        onSubmit: ({ value, fieldApi }) =>
                          fieldApi.form.getFieldValue("repeats") ? validateCount({ value }) : undefined,
                      }}
                    >
                      {(field) => (
                        <div className="flex-1">
                          <Input
                            id="count"
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={MAX_FREQUENCY_COUNT}
                            value={Number.isNaN(field.state.value) ? "" : field.state.value}
                            onChange={(event) => {
                              convertFrom.current = null;
                              field.handleChange(event.target.valueAsNumber);
                            }}
                            onBlur={field.handleBlur}
                            className="h-9 text-base"
                          />
                          <FieldError errors={field.state.meta.errors.map((message) => ({ message }))} />
                        </div>
                      )}
                    </form.Field>
                    <form.Field name="unit">
                      {(field) => (
                        <select
                          aria-label="Unit"
                          value={field.state.value}
                          onChange={(event) => {
                            const unit = event.target.value as FrequencyUnit;
                            if (convertFrom.current) {
                              form.setFieldValue("count", convertFrequency(convertFrom.current, unit).count);
                            }
                            field.handleChange(unit);
                          }}
                          className={cn(nativeControl, "flex-1")}
                        >
                          {UNITS.map((unit) => (
                            <option key={unit.value} value={unit.value}>
                              {unit.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </form.Field>
                  </div>
                </Field>

                <Field>
                  <FieldLabel>Last done</FieldLabel>
                  <form.Field name="lastDone">
                    {(field) => (
                      <div className="flex flex-wrap gap-2">
                        {LAST_DONE_CHOICES.map((choice) => (
                          <Button
                            key={choice.value}
                            type="button"
                            variant={field.state.value === choice.value ? "default" : "outline"}
                            aria-pressed={field.state.value === choice.value}
                            onClick={() => field.handleChange(choice.value)}
                          >
                            {choice.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </form.Field>
                  {lastDone === "date" && (
                    <form.Field
                      name="lastDoneDate"
                      validators={{
                        onSubmit: ({ value, fieldApi }) =>
                          !fieldApi.form.getFieldValue("repeats") ||
                          fieldApi.form.getFieldValue("lastDone") !== "date"
                            ? undefined
                            : !isValidCalendarDate(value)
                            ? "Pick a date"
                            : value > today
                              ? "That date is in the future"
                              : undefined,
                      }}
                    >
                      {(field) => (
                        <>
                          <input
                            type="date"
                            aria-label="Date last done"
                            max={today}
                            value={field.state.value}
                            onChange={(event) => field.handleChange(event.target.value)}
                            className={nativeControl}
                          />
                          <FieldError errors={field.state.meta.errors.map((message) => ({ message }))} />
                        </>
                      )}
                    </form.Field>
                  )}
                </Field>
              </>
            )
          }
        </form.Subscribe>

        <Button type="submit" size="lg">
          {submitLabel}
        </Button>
      </FieldGroup>
    </form>
  );
}
