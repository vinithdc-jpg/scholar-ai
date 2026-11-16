"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export type CustomSelectOption = {
  value: string;
  label: string;
};

type CustomSelectProps = {
  options: CustomSelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  ariaLabel: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export function CustomSelect({
  options,
  value,
  defaultValue,
  onValueChange,
  name,
  ariaLabel,
  placeholder = "Select an option",
  className = "",
  disabled = false,
}: CustomSelectProps) {
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [internalValue, setInternalValue] = useState(
    defaultValue ?? options[0]?.value ?? "",
  );
  const [isOpen, setIsOpen] = useState(false);
  const selectedValue = value === undefined ? internalValue : value;
  const selectedOption = options.find(
    (option) => option.value === selectedValue,
  );

  useEffect(() => {
    if (!isOpen) return;

    const selectedIndex = options.findIndex(
      (option) => option.value === selectedValue,
    );
    optionRefs.current[selectedIndex === -1 ? 0 : selectedIndex]?.focus();

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen, options, selectedValue]);

  useEffect(() => {
    if (value !== undefined) return;
    const form = containerRef.current?.closest("form");
    if (!form) return;
    const resetValue = defaultValue ?? options[0]?.value ?? "";
    const handleReset = () => setInternalValue(resetValue);
    form.addEventListener("reset", handleReset);
    return () => form.removeEventListener("reset", handleReset);
  }, [defaultValue, options, value]);

  function chooseOption(optionValue: string) {
    if (value === undefined) setInternalValue(optionValue);
    onValueChange?.(optionValue);
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      setIsOpen(false);
      triggerRef.current?.focus();
      return;
    }

    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const currentIndex = optionRefs.current.findIndex(
      (option) => option === document.activeElement,
    );
    if (currentIndex === -1) return;

    event.preventDefault();
    const direction = event.key === "ArrowDown" ? 1 : -1;
    const nextIndex = (currentIndex + direction + options.length) % options.length;
    optionRefs.current[nextIndex]?.focus();
  }

  return (
    <div
      ref={containerRef}
      className="relative min-w-0"
      onKeyDown={handleKeyDown}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsOpen(false);
        }
      }}
    >
      {name && (
        <input
          type="hidden"
          name={name}
          value={selectedValue}
          disabled={disabled}
        />
      )}
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listId}
        disabled={disabled}
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={(event) => {
          if (
            !isOpen &&
            (event.key === "ArrowDown" || event.key === "ArrowUp")
          ) {
            event.preventDefault();
            setIsOpen(true);
          }
        }}
        className={`site-select flex h-10 w-full items-center justify-between gap-3 text-left text-[11px] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        <span className={!selectedOption ? "text-[#9299aa]" : ""}>
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown
          size={15}
          aria-hidden="true"
          className={`shrink-0 text-[#6366f1] transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div
          id={listId}
          role="listbox"
          aria-label={`${ariaLabel} options`}
          className="absolute right-0 top-full z-50 mt-2 max-h-64 w-full min-w-[12rem] max-w-[calc(100vw_-_2rem)] overflow-y-auto rounded-xl border border-[#c7d2fe] bg-white p-1.5 shadow-[0_12px_30px_rgba(49,46,129,0.18)] ring-1 ring-[#6366f1]/10 dark:bg-[#17172f]"
        >
          {options.map((option, index) => {
            const isSelected = option.value === selectedValue;
            return (
              <button
                key={option.value}
                ref={(element) => {
                  optionRefs.current[index] = element;
                }}
                type="button"
                role="option"
                aria-selected={isSelected}
                tabIndex={0}
                onClick={() => chooseOption(option.value)}
                className={`flex w-full items-center justify-between gap-4 rounded-lg px-3 py-2 text-left text-[11px] font-medium transition-colors ${
                  isSelected
                    ? "bg-[#6366f1] text-white"
                    : "text-[#4b5270] hover:bg-[#eef2ff] hover:text-[#312e81] dark:text-[#d6d7ef] dark:hover:bg-[#28284d] dark:hover:text-white"
                }`}
              >
                {option.label}
                {isSelected && <Check size={14} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

type CustomComboboxProps = {
  value: string;
  options: string[];
  onValueChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
  maxLength?: number;
  disabled?: boolean;
};

export function CustomCombobox({
  value,
  options,
  onValueChange,
  ariaLabel,
  className = "",
  maxLength,
  disabled = false,
}: CustomComboboxProps) {
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [showAllOptions, setShowAllOptions] = useState(true);
  const matchingOptions = options.filter((option) =>
    option.toLowerCase().includes(value.trim().toLowerCase()),
  );
  const visibleOptions = showAllOptions ? options : matchingOptions;

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((index) => {
        if (!visibleOptions.length) return -1;
        if (index === -1) return direction === 1 ? 0 : visibleOptions.length - 1;
        return (index + direction + visibleOptions.length) % visibleOptions.length;
      });
      return;
    }
    if (event.key === "Enter" && isOpen && activeIndex >= 0) {
      event.preventDefault();
      onValueChange(visibleOptions[activeIndex]);
      setIsOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        role="combobox"
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-activedescendant={
          isOpen && activeIndex >= 0
            ? `${listId}-option-${activeIndex}`
            : undefined
        }
        value={value}
        maxLength={maxLength}
        disabled={disabled}
        onFocus={() => {
          setShowAllOptions(true);
          setIsOpen(true);
        }}
        onChange={(event) => {
          onValueChange(event.target.value);
          setShowAllOptions(false);
          setActiveIndex(-1);
          setIsOpen(true);
        }}
        onKeyDown={handleKeyDown}
        onBlur={(event) => {
          if (!event.currentTarget.parentElement?.contains(
            event.relatedTarget as Node | null,
          )) {
            setIsOpen(false);
            setActiveIndex(-1);
          }
        }}
        className={className}
      />
      {isOpen && visibleOptions.length > 0 && (
        <div
          id={listId}
          role="listbox"
          aria-label={`${ariaLabel} suggestions`}
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-64 overflow-y-auto rounded-xl border border-[#c7d2fe] bg-white p-1.5 shadow-[0_12px_30px_rgba(49,46,129,0.18)] ring-1 ring-[#6366f1]/10 dark:bg-[#17172f]"
        >
          {visibleOptions.map((option, index) => (
            <button
              key={option}
              id={`${listId}-option-${index}`}
              type="button"
              role="option"
              aria-selected={activeIndex === index}
              tabIndex={-1}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onValueChange(option);
                setIsOpen(false);
                setActiveIndex(-1);
              }}
              className={`block w-full rounded-lg px-3 py-2 text-left text-[11px] transition-colors ${
                activeIndex === index
                  ? "bg-[#6366f1] text-white"
                  : "text-[#4b5270] hover:bg-[#eef2ff] hover:text-[#312e81] dark:text-[#d6d7ef] dark:hover:bg-[#28284d] dark:hover:text-white"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type CustomDatePickerProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
  min?: string;
  max?: string;
};

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return year && month && day ? new Date(year, month - 1, day) : null;
}

function toDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value: string) {
  const date = parseDate(value);
  if (!date) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}-${month}-${date.getFullYear()}`;
}

export function CustomDatePicker({
  value,
  defaultValue = "",
  onValueChange,
  name,
  ariaLabel,
  className = "",
  disabled = false,
  min,
  max,
}: CustomDatePickerProps) {
  const dialogId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const yearRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const [isChoosingYear, setIsChoosingYear] = useState(false);
  const [opensAbove, setOpensAbove] = useState(false);
  const selectedValue = value === undefined ? internalValue : value;
  const selectedDate = parseDate(selectedValue);
  const [visibleMonth, setVisibleMonth] = useState(
    () =>
      selectedDate
        ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
        : new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isChoosingYear) return;
    const selectedYear = visibleMonth.getFullYear();
    yearRefs.current
      .find((button) => button?.value === String(selectedYear))
      ?.scrollIntoView({ block: "nearest" });
  }, [isChoosingYear, visibleMonth]);

  useEffect(() => {
    if (value !== undefined) return;
    const form = containerRef.current?.closest("form");
    if (!form) return;
    const handleReset = () => {
      setInternalValue(defaultValue);
      const date = parseDate(defaultValue);
      if (date) {
        setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
      }
      setIsOpen(false);
      setIsChoosingYear(false);
    };
    form.addEventListener("reset", handleReset);
    return () => form.removeEventListener("reset", handleReset);
  }, [defaultValue, value]);

  function updateValue(nextValue: string) {
    if (value === undefined) setInternalValue(nextValue);
    onValueChange?.(nextValue);
  }

  function openCalendar() {
    if (selectedDate) {
      setVisibleMonth(
        new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
      );
    }
    setIsChoosingYear(false);
    const bounds = containerRef.current?.getBoundingClientRect();
    setOpensAbove(
      bounds !== undefined &&
        window.innerHeight - bounds.bottom < 340 &&
        bounds.top > 340,
    );
    setIsOpen((open) => !open);
  }

  const firstDay = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth(),
    1,
  );
  const startOffset = firstDay.getDay();
  const calendarStart = new Date(
    firstDay.getFullYear(),
    firstDay.getMonth(),
    1 - startOffset,
  );
  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(
      calendarStart.getFullYear(),
      calendarStart.getMonth(),
      calendarStart.getDate() + index,
    );
    return date;
  });
  const todayValue = toDateValue(new Date());
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: 231 },
    (_, index) => currentYear + 50 - index,
  );
  const monthLabel = visibleMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div
      ref={containerRef}
      className="relative"
      onKeyDown={(event) => {
        if (event.key === "Escape" && isOpen) {
          setIsOpen(false);
          setIsChoosingYear(false);
          triggerRef.current?.focus();
        }
      }}
    >
      {name && (
        <input
          type="hidden"
          name={name}
          value={selectedValue}
          disabled={disabled}
        />
      )}
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={dialogId}
        disabled={disabled}
        onClick={openCalendar}
        className={`workspace-input flex h-11 w-full items-center justify-between rounded-xl border border-[#ddd6fe] bg-white px-3 text-left text-[12px] text-[#0f172a] outline-none transition focus:border-[#a5b4fc] focus:ring-2 focus:ring-[#6366f1]/15 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        <span className={selectedValue ? "" : "text-[#9299aa]"}>
          {formatDate(selectedValue) || "dd-mm-yyyy"}
        </span>
        <CalendarDays size={16} aria-hidden="true" className="text-[#6366f1]" />
      </button>
      {isOpen && (
        <div
          id={dialogId}
          role="dialog"
          aria-label={`Choose ${ariaLabel.toLowerCase()}`}
          className={`absolute left-0 z-50 w-[min(19rem,_calc(100vw_-_2rem))] rounded-2xl border border-[#ddd6fe] bg-white p-3 shadow-[0_14px_36px_rgba(49,46,129,0.2)] dark:bg-[#17172f] ${
            opensAbove ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() =>
                setVisibleMonth(
                  new Date(
                    visibleMonth.getFullYear(),
                    visibleMonth.getMonth() - 1,
                    1,
                  ),
                )
              }
              className="grid size-8 place-items-center rounded-lg text-[#555d71] transition hover:bg-[#eef2ff] hover:text-[#312e81] dark:text-[#d6d7ef] dark:hover:bg-[#28284d]"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => setIsChoosingYear((choosing) => !choosing)}
              aria-expanded={isChoosingYear}
              className="rounded-lg px-2 py-1 text-[12px] font-bold text-[#312e81] hover:bg-[#eef2ff] dark:text-white dark:hover:bg-[#28284d]"
            >
              {monthLabel}
            </button>
            <button
              type="button"
              aria-label="Next month"
              onClick={() =>
                setVisibleMonth(
                  new Date(
                    visibleMonth.getFullYear(),
                    visibleMonth.getMonth() + 1,
                    1,
                  ),
                )
              }
              className="grid size-8 place-items-center rounded-lg text-[#555d71] transition hover:bg-[#eef2ff] hover:text-[#312e81] dark:text-[#d6d7ef] dark:hover:bg-[#28284d]"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          {isChoosingYear ? (
            <div className="grid max-h-56 grid-cols-4 gap-1 overflow-y-auto">
              {years.map((year, index) => (
                <button
                  key={year}
                  ref={(element) => {
                    yearRefs.current[index] = element;
                  }}
                  type="button"
                  value={year}
                  aria-pressed={year === visibleMonth.getFullYear()}
                  onClick={() => {
                    setVisibleMonth(
                      new Date(
                        year,
                        visibleMonth.getMonth(),
                        1,
                      ),
                    );
                    setIsChoosingYear(false);
                  }}
                  className={`rounded-lg px-2 py-2 text-[10px] font-medium transition-colors ${
                    year === visibleMonth.getFullYear()
                      ? "bg-[#6366f1] text-white"
                      : "text-[#4b5270] hover:bg-[#eef2ff] hover:text-[#312e81] dark:text-[#d6d7ef] dark:hover:bg-[#28284d]"
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1 text-center">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <span
                  key={day}
                  className="py-1 text-[9px] font-semibold text-[#9299aa]"
                >
                  {day}
                </span>
              ))}
              {calendarDays.map((date) => {
                const dateValue = toDateValue(date);
                const isCurrentMonth =
                  date.getMonth() === visibleMonth.getMonth();
                const isSelected = dateValue === selectedValue;
                const isToday = dateValue === todayValue;
                const isDisabled =
                  (min !== undefined && dateValue < min) ||
                  (max !== undefined && dateValue > max);
                return (
                  <button
                    key={dateValue}
                    type="button"
                    aria-label={date.toLocaleDateString(undefined, {
                      dateStyle: "long",
                    })}
                    aria-pressed={isSelected}
                    disabled={isDisabled}
                    onClick={() => {
                      updateValue(dateValue);
                      setIsOpen(false);
                      triggerRef.current?.focus();
                    }}
                    className={`grid aspect-square place-items-center rounded-lg text-[10px] transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
                      isSelected
                        ? "bg-[#6366f1] font-bold text-white"
                        : isToday
                          ? "border border-[#6366f1] font-bold text-[#312e81] dark:text-white"
                          : isCurrentMonth
                            ? "text-[#4b5270] hover:bg-[#eef2ff] hover:text-[#312e81] dark:text-[#d6d7ef] dark:hover:bg-[#28284d]"
                            : "text-[#b2b7c5] hover:bg-[#f5f3ff] dark:text-[#72738f]"
                    }`}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          )}
          <div className="mt-3 flex justify-between border-t border-[#eeeaff] pt-2 dark:border-[#33345a]">
            <button
              type="button"
              onClick={() => {
                updateValue("");
                setIsOpen(false);
              }}
              className="rounded-lg px-2 py-1 text-[10px] font-semibold text-[#6366f1] hover:bg-[#eef2ff] dark:hover:bg-[#28284d]"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                const today = toDateValue(new Date());
                if (
                  (min === undefined || today >= min) &&
                  (max === undefined || today <= max)
                ) {
                  updateValue(today);
                  setIsOpen(false);
                  triggerRef.current?.focus();
                }
              }}
              disabled={
                (min !== undefined && todayValue < min) ||
                (max !== undefined && todayValue > max)
              }
              className="rounded-lg px-2 py-1 text-[10px] font-semibold text-[#6366f1] hover:bg-[#eef2ff] disabled:opacity-40 dark:hover:bg-[#28284d]"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
