"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown, Languages } from "lucide-react";
import { LANGUAGES } from "@/lib/image-input";

const names: Record<string, { native: string; code: string }> = {
  English: { native: "English", code: "en" },
  Spanish: { native: "Español", code: "es" },
  French: { native: "Français", code: "fr" },
  German: { native: "Deutsch", code: "de" },
  Chinese: { native: "中文", code: "zh" },
  Japanese: { native: "日本語", code: "ja" },
  Portuguese: { native: "Português", code: "pt" },
  Italian: { native: "Italiano", code: "it" },
};

export function LanguageSelect({ id, value, onChange, disabled = false, align = "end" }: {
  id: string;
  value: string;
  onChange: (language: string) => void;
  disabled?: boolean;
  align?: "start" | "end";
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [placement, setPlacement] = useState({ above: false, height: 440 });
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const options = useRef<HTMLDivElement>(null);
  const search = useRef({ text: "", time: 0 });
  const expanded = open && !disabled;
  const selected = names[value];

  function show() {
    if (disabled) return;
    const rect = trigger.current!.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom - 16;
    const above = rect.top - 16;
    const useAbove = below < 440 && above > below;
    setPlacement({ above: useAbove, height: Math.max(100, Math.min(440, useAbove ? above : below)) });
    setActive(Math.max(0, LANGUAGES.indexOf(value)));
    search.current = { text: "", time: 0 };
    setOpen(true);
  }

  function choose(index: number) {
    onChange(LANGUAGES[index]);
    setOpen(false);
    trigger.current?.focus();
  }

  useEffect(() => {
    if (!expanded) return;
    function dismiss(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    function close() { setOpen(false); }
    document.addEventListener("pointerdown", dismiss);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      window.removeEventListener("resize", close);
    };
  }, [expanded]);

  useEffect(() => {
    const list = options.current;
    const option = list?.children[active] as HTMLElement | undefined;
    if (!expanded || !list || !option) return;
    if (option.offsetTop < list.scrollTop) list.scrollTop = option.offsetTop;
    else if (option.offsetTop + option.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = option.offsetTop + option.offsetHeight - list.clientHeight;
    }
  }, [active, expanded]);

  function handleKey(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape") {
      if (expanded) { event.preventDefault(); event.stopPropagation(); setOpen(false); }
      return;
    }
    if (event.key === "Tab") { setOpen(false); return; }
    if (["ArrowDown", "ArrowUp", "Home", "End", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      if (!expanded) { show(); return; }
      if (event.key === "Enter" || event.key === " ") choose(active);
      else if (event.key === "Home") setActive(0);
      else if (event.key === "End") setActive(LANGUAGES.length - 1);
      else setActive(index => (index + (event.key === "ArrowDown" ? 1 : -1) + LANGUAGES.length) % LANGUAGES.length);
      return;
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      if (!expanded) show();
      const now = Date.now();
      const text = (now - search.current.time < 700 ? search.current.text : "") + event.key.toLocaleLowerCase();
      search.current = { text, time: now };
      const match = LANGUAGES.findIndex(language =>
        language.toLowerCase().startsWith(text) || names[language].native.toLocaleLowerCase().startsWith(text));
      if (match >= 0) setActive(match);
    }
  }

  return <div ref={root} data-ui className="language-select" data-align={align}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <button ref={trigger} id={id} type="button" role="combobox" className="language-trigger"
      disabled={disabled} aria-expanded={expanded} aria-haspopup="listbox" aria-controls={`${id}-list`}
      aria-activedescendant={expanded ? `${id}-option-${active}` : undefined}
      onKeyDown={handleKey} onClick={() => expanded ? setOpen(false) : show()}>
      <Languages size={17} strokeWidth={1.5} aria-hidden="true" />
      <span lang={selected.code}>{selected.native}</span>
      <ChevronDown size={15} strokeWidth={1.5} aria-hidden="true" className="language-chevron" />
    </button>
    {expanded && <div className="language-menu" data-above={placement.above} style={{ maxHeight: placement.height }}>
      <p className="language-menu-heading">Output language <span>{LANGUAGES.length} languages</span></p>
      <div ref={options} id={`${id}-list`} role="listbox" aria-label="Output language" className="language-options">
        {LANGUAGES.map((language, index) => <div key={language} id={`${id}-option-${index}`} role="option"
          aria-selected={value === language} className="language-option" data-active={active === index}
          onPointerMove={() => setActive(index)} onMouseDown={event => event.preventDefault()} onClick={() => choose(index)}>
          <span className="language-option-name"><span lang={names[language].code}>{names[language].native}</span>
            {names[language].native !== language && <span className="language-option-translation">{language}</span>}
          </span>
          {value === language ? <Check size={16} strokeWidth={2} aria-hidden="true" /> : <span className="language-code" aria-hidden="true">{names[language].code}</span>}
        </div>)}
      </div>
    </div>}
  </div>;
}
