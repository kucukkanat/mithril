import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createProject, deleteProject, duplicateProject, listProjects, type ProjectListEntry } from "../lib/db.ts";
import { blankProject, TEMPLATES, templateSpec, uniqueName, type ProjectTemplate } from "../lib/defaults.ts";
import { TopBar } from "../components/TopBar.tsx";

export function ProjectListPage() {
  const [projects, setProjects] = useState<readonly ProjectListEntry[] | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const navigate = useNavigate();

  const refresh = (): void => {
    void listProjects().then(setProjects);
  };
  useEffect(refresh, []);

  // Esc closes the new-project sheet (the global shortcut layer only handles the palette/cheatsheet).
  useEffect(() => {
    if (!showGallery) return undefined;
    const onKey = (e: KeyboardEvent): void => { if (e.key === "Escape") setShowGallery(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showGallery]);

  const createFrom = (template: ProjectTemplate | null): void => {
    const existing = new Set((projects ?? []).map((p) => p.name));
    const spec = template === null ? blankProject(uniqueName("Untitled agent", existing)) : templateSpec(template, existing);
    void createProject(spec).then((id) => navigate(`/p/${id}`));
  };

  const gallery = (
    <div className="template-grid" data-testid="template-grid">
      {TEMPLATES.map((t) => (
        <button key={t.id} className="template-card" data-testid={`template-${t.id}`} onClick={() => createFrom(t)}>
          <span className="tpl-icon" aria-hidden>{t.icon}</span>
          <span className="tpl-name">{t.name}</span>
          <span className="tpl-desc">{t.description}</span>
          <span className="tpl-tags">
            {t.tags.map((tag) => (
              <span key={tag} className="tpl-tag">{tag}</span>
            ))}
            {t.needsKey === true && <span className="tpl-tag tpl-key">needs key</span>}
          </span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="designer" data-testid="project-list-page">
      <TopBar />
      <main className="project-list">
        {projects === null && <p className="hint">Loading…</p>}

        {projects !== null && projects.length === 0 && (
          <section className="onboard" data-testid="onboard">
            <div className="onboard-glyph" aria-hidden>⛏</div>
            <h1>Design your first agent</h1>
            <p className="onboard-sub">
              Start from a template and run it right here in your browser — no account, no key, no server. Everything stays on this device.
            </p>
            {gallery}
            <div className="onboard-foot">
              <button className="ghost" data-testid="onboard-blank" onClick={() => createFrom(null)}>
                Start blank instead
              </button>
            </div>
          </section>
        )}

        {projects !== null && projects.length > 0 && (
          <>
            <div className="project-list-head">
              <h1>Projects</h1>
              <button className="primary" data-testid="project-create" onClick={() => setShowGallery(true)}>
                + New project
              </button>
            </div>
            <ul>
              {projects.map((p) => (
                <li key={p.id} className="project-card" data-testid={`project-card-${p.id}`}>
                  <Link to={`/p/${p.id}`} data-testid={`project-open-${p.id}`}>
                    <strong>{p.name}</strong>
                    <span className="hint">{new Date(p.updatedAt).toLocaleString()}</span>
                  </Link>
                  <div className="project-card-actions">
                    <button className="ghost" data-testid={`project-duplicate-${p.id}`} onClick={() => void duplicateProject(p.id).then(refresh)}>
                      Duplicate
                    </button>
                    <button
                      className="ghost danger"
                      data-testid={`project-delete-${p.id}`}
                      onClick={() => {
                        if (window.confirm(`Delete "${p.name}"? This can't be undone.`)) {
                          void deleteProject(p.id).then(refresh);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        {showGallery && (
          <div className="sheet-backdrop" data-testid="gallery-sheet" onClick={() => setShowGallery(false)}>
            <div className="sheet" role="dialog" aria-modal="true" aria-label="New project" onClick={(e) => e.stopPropagation()}>
              <div className="sheet-head">
                <h2>Start a new project</h2>
                <button className="ghost" autoFocus data-testid="gallery-close" onClick={() => setShowGallery(false)}>✕</button>
              </div>
              {gallery}
              <div className="onboard-foot">
                <button className="ghost" data-testid="gallery-blank" onClick={() => createFrom(null)}>
                  Start blank instead
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
