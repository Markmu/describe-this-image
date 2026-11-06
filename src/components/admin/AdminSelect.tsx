"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown } from "lucide-react";

type Option = { value: string; label: string; disabled?: boolean };
type Props = {
  name: string;
  label: string;
  options: Option[];
  defaultValue?: string;
  onChange?: (value: string, form: HTMLFormElement | null) => void;
};

export function AdminSelect({ name, label, options, defaultValue = "", onChange }: Props) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const search = useRef({ text: "", time: 0 });
  const [value, setValue] = useState(() => options.some(option => option.value === defaultValue) ? defaultValue : options[0]?.value ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [placement, setPlacement] = useState({ left: 0, top: 0, width: 160, maxHeight: 320 });
  const selected = options.find(option => option.value === value);
  const enabled = options.flatMap((option, index) => option.disabled ? [] : [index]);

  function show() {
    const rect = trigger.current!.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom - 12;
    const above = rect.top - 12;
    const height = Math.min(320, options.length * (window.innerWidth <= 640 ? 44 : 36) + 10);
    const useAbove = below < height && above > below;
    const maxHeight = Math.max(80, Math.min(height, useAbove ? above : below));
    const width = Math.min(Math.max(rect.width, 168), window.innerWidth - 24);
    setPlacement({ left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)), top: useAbove ? rect.top - maxHeight - 6 : rect.bottom + 6, width, maxHeight });
    const current = options.findIndex(option => option.value === value && !option.disabled);
    setActive(current >= 0 ? current : enabled[0] ?? 0);
    search.current = { text: "", time: 0 };
    setOpen(true);
  }

  function choose(index: number) {
    const option = options[index];
    if (!option || option.disabled) return;
    setValue(option.value);
    setOpen(false);
    onChange?.(option.value, trigger.current?.form ?? null);
    trigger.current?.focus();
  }

  useEffect(() => {
    const node = menu.current;
    if (!node || !open) return;
    node.showPopover?.();
    function dismiss(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    function close() { setOpen(false); }
    function scroll(event: Event) {
      if (!node?.contains(event.target as Node)) close();
    }
    document.addEventListener("pointerdown", dismiss);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", scroll, true);
    return () => {
      if (node.isConnected) node.hidePopover?.();
      document.removeEventListener("pointerdown", dismiss);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", scroll, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const node = menu.current;
    const option = document.getElementById(`${id}-option-${active}`);
    if (!node || !option) return;
    if (option.offsetTop < node.scrollTop) node.scrollTop = option.offsetTop;
    else if (option.offsetTop + option.offsetHeight > node.scrollTop + node.clientHeight) node.scrollTop = option.offsetTop + option.offsetHeight - node.clientHeight;
  }, [active, id, open]);

  function handleKey(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      return;
    }
    if (event.key === "Tab") { setOpen(false); return; }
    if (["ArrowDown", "ArrowUp", "Home", "End", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      if (!open) { show(); return; }
      if (event.key === "Enter" || event.key === " ") choose(active);
      else if (event.key === "Home") setActive(enabled[0] ?? 0);
      else if (event.key === "End") setActive(enabled.at(-1) ?? 0);
      else {
        const position = enabled.indexOf(active);
        setActive(enabled[(position + (event.key === "ArrowDown" ? 1 : -1) + enabled.length) % enabled.length] ?? 0);
      }
      return;
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      if (!open) show();
      const now = Date.now();
      const text = (now - search.current.time < 700 ? search.current.text : "") + event.key.toLocaleLowerCase();
      search.current = { text, time: now };
      const match = options.findIndex(option => !option.disabled && option.label.toLocaleLowerCase().startsWith(text));
      if (match >= 0) setActive(match);
    }
  }

  return <div ref={root} className="admin-select" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <input type="hidden" name={name} value={value} disabled={selected?.disabled} />
    <span className="admin-select-sizer" aria-hidden="true">{options.map(option => <span key={option.value}>{option.label}</span>)}</span>
    <button ref={trigger} type="button" className="admin-select-trigger" role="combobox" aria-label={label} aria-expanded={open} aria-haspopup="listbox" aria-controls={`${id}-list`} aria-activedescendant={open ? `${id}-option-${active}` : undefined} onKeyDown={handleKey} onClick={() => open ? setOpen(false) : show()}><span>{selected?.label}</span><ChevronDown size={15} strokeWidth={1.6} aria-hidden="true" /></button>
    {open && <div ref={menu} id={`${id}-list`} role="listbox" aria-label={label} popover="manual" className="admin-select-menu" style={placement}>
      {options.map((option, index) => <div key={option.value} id={`${id}-option-${index}`} role="option" aria-selected={value === option.value} aria-disabled={option.disabled || undefined} data-active={index === active} className="admin-select-option" onPointerMove={() => { if (!option.disabled) setActive(index); }} onMouseDown={event => event.preventDefault()} onClick={() => choose(index)}><span>{option.label}</span>{value === option.value && <Check size={15} strokeWidth={1.8} aria-hidden="true" />}</div>)}
    </div>}
  </div>;
}
