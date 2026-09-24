window.addEventListener("DOMContentLoaded", () => {
  loadSession();
  const initialPage = window.location.hash.replace("#", "") || "home";
  loadPage(initialPage);
});

window.addEventListener("hashchange", () => {
  const pageName = window.location.hash.replace("#", "") || "home";
  loadPage(pageName);
});
