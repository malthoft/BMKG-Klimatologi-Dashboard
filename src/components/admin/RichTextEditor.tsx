"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Tulis isi konten di sini...",
  className = ""
}: RichTextEditorProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Dynamically import ReactQuill to prevent SSR issues
  const ReactQuill = useMemo(
    () => dynamic(() => import("react-quill-new"), { 
      ssr: false,
      loading: () => (
        <div className="w-full h-48 bg-slate-50 animate-pulse rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 text-sm">
          Memuat Editor...
        </div>
      )
    }),
    []
  );

  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, 4, false] }],
        [{ size: ["small", false, "large", "huge"] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ align: [] }],
        ["blockquote", "link"],
        ["clean"]
      ],
      keyboard: {
        bindings: {
          "list autofill": null
        }
      }
    }),
    []
  );

  const formats = [
    "header",
    "size",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "list",
    "align",
    "blockquote",
    "link"
  ];

  if (!mounted) {
    return (
      <div className="w-full h-48 bg-slate-50 animate-pulse rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 text-sm">
        Memuat Editor...
      </div>
    );
  }

  return (
    <div className={`rich-text-editor-wrapper ${className}`}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
      <style jsx global>{`
        .rich-text-editor-wrapper .ql-toolbar {
          border-top-left-radius: 0.75rem;
          border-top-right-radius: 0.75rem;
          border-color: #e2e8f0;
          background-color: #f8fafc;
          font-family: inherit;
        }
        .rich-text-editor-wrapper .ql-container {
          border-bottom-left-radius: 0.75rem;
          border-bottom-right-radius: 0.75rem;
          border-color: #e2e8f0;
          min-height: 220px;
          font-size: 15px;
          font-family: inherit;
          background-color: #ffffff;
        }
        .rich-text-editor-wrapper .ql-editor {
          min-height: 200px;
          line-height: 1.6;
        }
        .rich-text-editor-wrapper .ql-editor.ql-blank::before {
          color: #94a3b8;
          font-style: normal;
        }
      `}</style>
    </div>
  );
}
