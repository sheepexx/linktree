"use client";

import { FileImage, FileQuestion, FileText, Folder, KeyRound, Sparkles } from "lucide-react";
import { useState } from "react";

import { secretFolder } from "@/data/easter-eggs";

import { Tag } from "../ui/Tag";
import { Window } from "../ui/Window";

const fileIcons = {
  text: FileText,
  "image-placeholder": FileImage,
  "folder-placeholder": Folder,
} as const;

export function SecretFolderExplorer() {
  const [selectedId, setSelectedId] = useState<string>(secretFolder.files[0].id);
  const [hiddenMessage, setHiddenMessage] = useState(false);
  const selected = secretFolder.files.find((file) => file.id === selectedId) ?? secretFolder.files[0];

  const applyArchiveTheme = () => {
    window.dispatchEvent(new CustomEvent("sheepex:set-theme", { detail: "archive" }));
  };

  return (
    <Window title="[corrupted]_folder.???" eyebrow="optional">
      <div className="grid min-h-[32rem] md:grid-cols-[17rem_minmax(0,1fr)]">
        <div className="border-b border-[var(--line)] bg-[var(--panel-soft)] md:border-b-0 md:border-r">
          <div className="border-b border-[var(--line)] px-4 py-3 font-mono text-[9px] uppercase tracking-wider text-[var(--quiet)]">
            /not_important/
          </div>
          <div className="p-2">
            {secretFolder.files.map((file) => {
              const Icon = fileIcons[file.kind];
              const active = selected.id === file.id;
              return (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => setSelectedId(file.id)}
                  aria-pressed={active}
                  className={`flex min-h-14 w-full items-center gap-3 border px-3 text-left font-mono text-[10px] ${
                    active
                      ? "border-[var(--accent-soft)] bg-[color-mix(in_srgb,var(--accent)_10%,var(--panel))] text-[var(--ink)]"
                      : "border-transparent text-[var(--muted)] hover:border-[var(--line)] hover:bg-[var(--panel-raised)]"
                  }`}
                >
                  <Icon aria-hidden="true" className={`size-4 ${file.placeholder ? "text-[var(--warning)]" : "text-[var(--signal)]"}`} />
                  <span className="min-w-0 flex-1 truncate">{file.fileName}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex min-w-0 flex-col">
          <div className="checkerboard grid min-h-56 place-items-center border-b border-[var(--line)] p-5">
            <div className="max-w-md border border-[var(--line-bright)] bg-[var(--panel)] p-5 text-center shadow-[4px_4px_0_var(--shadow)]">
              <FileQuestion aria-hidden="true" className="mx-auto size-6 text-[var(--accent)]" />
              <p className="mt-4 font-mono text-xs font-semibold text-[var(--ink)]">{selected.fileName}</p>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{selected.content}</p>
              {selected.placeholder ? <div className="mt-4"><Tag tone="warning">empty slot</Tag></div> : null}
            </div>
          </div>

          <div className="grid flex-1 gap-5 p-5 sm:p-6 lg:grid-cols-2">
            <div>
              <h2 className="pixel-label text-[var(--ink)]">folder properties</h2>
              <dl className="mt-4 border border-[var(--line)] font-mono text-[10px]">
                <div className="grid grid-cols-[6rem_1fr] border-b border-[var(--line)] p-2.5">
                  <dt className="text-[var(--quiet)]">kind</dt>
                  <dd className="text-[var(--muted)]">{selected.kind}</dd>
                </div>
                <div className="grid grid-cols-[6rem_1fr] border-b border-[var(--line)] p-2.5">
                  <dt className="text-[var(--quiet)]">essential</dt>
                  <dd className="text-[var(--muted)]">no</dd>
                </div>
                <div className="grid grid-cols-[6rem_1fr] p-2.5">
                  <dt className="text-[var(--quiet)]">real asset</dt>
                  <dd className="text-[var(--muted)]">{selected.placeholder ? "not yet" : "text only"}</dd>
                </div>
              </dl>
            </div>

            <div>
              <h2 className="pixel-label text-[var(--ink)]">safe shortcuts</h2>
              <div className="mt-4 grid gap-2">
                <button
                  type="button"
                  onClick={applyArchiveTheme}
                  className="flex min-h-11 items-center gap-3 border border-[var(--line)] bg-[var(--panel-soft)] px-3 font-mono text-[10px] text-[var(--muted)] hover:border-[var(--accent-soft)] hover:text-[var(--accent)]"
                >
                  <KeyRound aria-hidden="true" className="size-4" /> apply archive palette
                </button>
                <button
                  type="button"
                  onClick={() => setHiddenMessage((visible) => !visible)}
                  className="flex min-h-11 items-center gap-3 border border-[var(--line)] bg-[var(--panel-soft)] px-3 font-mono text-[10px] text-[var(--muted)] hover:border-[var(--line-bright)] hover:text-[var(--ink)]"
                >
                  <Sparkles aria-hidden="true" className="size-4" /> {hiddenMessage ? "hide" : "show"} hidden message
                </button>
              </div>
              {hiddenMessage ? (
                <p role="status" className="mt-3 border-l-2 border-[var(--accent)] p-3 font-mono text-[9px] leading-4 text-[var(--quiet)]">
                  the secret is that everything is probably unfinished.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Window>
  );
}
