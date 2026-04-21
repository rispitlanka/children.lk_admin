"use client";

import { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, false] }],
  ["bold", "italic", "underline", "strike"],
  [{ list: "ordered" }, { list: "bullet" }],
  [{ indent: "-1" }, { indent: "+1" }],
  ["blockquote", "link"],
  ["clean"],
];

export type ResourceDescriptionQuillProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
};

/**
 * Quill editor without react-quill (react-quill uses findDOMNode, removed in React 19).
 */
export default function ResourceDescriptionQuill({
  value,
  onChange,
  placeholder = "",
  className = "",
}: ResourceDescriptionQuillProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const host = document.createElement("div");
    wrap.appendChild(host);

    const quill = new Quill(host, {
      theme: "snow",
      placeholder,
      modules: {
        toolbar: TOOLBAR_OPTIONS,
      },
    });
    if (value) {
      quill.clipboard.dangerouslyPasteHTML(value, "silent");
    }

    const onTextChange = () => {
      onChangeRef.current(quill.root.innerHTML);
    };
    quill.on("text-change", onTextChange);

    return () => {
      quill.off("text-change", onTextChange);
      wrap.innerHTML = "";
    };
    // Intentionally only re-run when placeholder changes; `value` is initial HTML only.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- avoid remounting Quill on each keystroke
  }, [placeholder]);

  return <div ref={wrapRef} className={className} />;
}
