/* Optional loopback binding. Removed entirely from portable HTML exports. */
const WorkingFolder = (() => {
  "use strict";
  async function connect({ getState, replaceState, refresh, status }) {
    if (location.protocol !== "http:" || location.hostname !== "127.0.0.1")
      throw new Error(
        "Open this working folder using its local service launch URL.",
      );
    const token =
      location.hash.slice(1) || sessionStorage.getItem("pensive-working-token");
    if (!/^[a-f0-9]{64}$/.test(token || ""))
      throw new Error("Service authorization missing. Use the launch URL.");
    sessionStorage.setItem("pensive-working-token", token);
    history.replaceState(null, "", location.pathname);
    async function api(path, data) {
      const result = await fetch(path, {
        method: data ? "POST" : "GET",
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        ...(data ? { body: JSON.stringify(data) } : {}),
      });
      const body = await result.json();
      if (!result.ok)
        throw new Error(body.error || "Working-folder operation failed.");
      return body;
    }
    let head = await api("/api/current"),
      baseline = JSON.stringify(head.canvas),
      queue = Promise.resolve(),
      pending = null,
      busy = 0;
    replaceState(head.canvas);
    const controls = document.createElement("div");
    controls.id = "revision-controls";
    controls.className = "toolbar";
    controls.setAttribute("aria-label", "Working folder");
    const save = document.createElement("button");
    save.type = "button";
    save.textContent = "Save Revision";
    const reload = document.createElement("button");
    reload.type = "button";
    reload.textContent = "Reload Latest";
    const indicator = document.createElement("span");
    indicator.id = "revision-status";
    indicator.setAttribute("role", "status");
    indicator.setAttribute("aria-label", "Revision status");
    indicator.setAttribute("aria-live", "polite");
    controls.append(save, reload, indicator);
    document.querySelector("#analysis-toolbar").before(controls);
    const dirty = () => !!pending || JSON.stringify(getState()) !== baseline;
    const saved = () => {
      indicator.textContent = dirty()
        ? "Unsaved changes"
        : `Saved revision ${head.revision_number}`;
    };
    function report(error) {
      indicator.textContent = `Unsaved changes: ${error.message}`;
      status(
        `Revision not saved: ${error.message} Export your local canvas to keep it.`,
        true,
      );
    }
    async function retryPending() {
      if (!pending) return;
      const result = await api("/api/revisions", pending);
      head = result;
      baseline = JSON.stringify(result.canvas);
      pending = null;
    }
    function serial(run) {
      busy++;
      save.disabled = reload.disabled = true;
      const task = queue.then(run);
      queue = task.catch(() => {});
      return task.finally(() => {
        busy--;
        save.disabled = reload.disabled = busy > 0;
      });
    }
    async function persistNow(captured, event) {
      indicator.textContent = "Saving revision…";
      await retryPending();
      if (
        JSON.stringify(captured) !== baseline ||
        event.kind !== "manual_save"
      ) {
        pending = {
          parent_revision_id: head.revision_id,
          operation_id: crypto.randomUUID(),
          event,
          canvas: captured,
        };
        await retryPending();
      }
      saved();
      status(
        dirty()
          ? "Newer changes remain unsaved in this tab."
          : `Saved revision ${head.revision_number}.`,
      );
      return head;
    }
    function persist(event = { kind: "manual_save", source: "browser" }) {
      const captured = structuredClone(getState());
      return serial(() => persistNow(captured, event));
    }
    save.addEventListener("click", () => persist().catch(report));
    reload.addEventListener("click", () =>
      serial(async () => {
        const starting = JSON.stringify(getState());
        if (
          dirty() &&
          !confirm(
            "Discard unsaved tab changes and load the latest saved revision? Export first to keep them.",
          )
        )
          return;
        const latest = await api("/api/current");
        // Edits and review decisions can still happen while the fetch is in flight.
        if (JSON.stringify(getState()) !== starting) {
          status(
            "Canvas changed during reload. Save or export your edits, then reload again.",
            true,
          );
          saved();
          return;
        }
        head = latest;
        baseline = JSON.stringify(head.canvas);
        pending = null;
        replaceState(head.canvas);
        refresh();
        saved();
        status(`Loaded saved revision ${head.revision_number}.`);
      }).catch(report),
    );
    window.addEventListener("beforeunload", (event) => {
      if (dirty() || busy) {
        event.preventDefault();
        event.returnValue = "";
      }
    });
    saved();
    return {
      edited(event) {
        saved();
        if (
          event &&
          ["proposal_accept", "proposal_reject", "import"].includes(event.kind)
        )
          persist({ ...event, source: "browser" }).catch(report);
      },
      request(action) {
        const captured = structuredClone(getState());
        return serial(async () => {
          await persistNow(captured, {
            kind: "manual_save",
            source: "browser",
          });
          if (dirty())
            throw new Error(
              "Canvas changed while saving. Save again before preparing the request.",
            );
          const handoff = await api("/api/requests", {
            parent_revision_id: head.revision_id,
            action,
          });
          if (dirty())
            throw new Error(
              "Canvas changed while preparing the request. Save again and retry.",
            );
          return handoff;
        }).catch((error) => {
          report(error);
          throw error;
        });
      },
    };
  }
  return Object.freeze({ connect });
})();
