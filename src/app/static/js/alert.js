window.addEventListener("load", initAlerts);

function initAlerts() {
  const container = document.getElementById("flash-container");
  if (!container) return;

  // auto-dismiss each alert after 5s
  container.querySelectorAll("[data-flash-id]").forEach((el) => {
    setTimeout(() => dismiss(el), 5000);
  });

  // manual close clicking the button
  container.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-flash-close]");
    if (!btn) return;
    const id = btn.getAttribute("data-flash-close");
    const alertEl = container.querySelector(`[data-flash-id="${id}"]`);
    dismiss(alertEl);
  });
}

function dismiss(el) {
  if (!el) return;
  el.classList.remove("animate-flash-in");
  el.classList.add("transition-opacity", "duration-500");

  // this is needed for some reason, other wise the browser just skip directly to opacity 0
  setTimeout(() => {
    el.classList.add("opacity-0");
  }, 10);

  el.addEventListener("transitionend", () => {
    el.remove();
  });
}
