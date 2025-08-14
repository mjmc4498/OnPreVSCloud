// app/js/ui/router.js
const routes = {};
let currentPath = "";

export function navigate(path) {
  window.location.hash = path;
}

function handleRouting() {
  const path = window.location.hash.slice(1) || "/";
  if (path === currentPath) return;
  currentPath = path;

  const routeHandler = routes[path] || routes["/404"];
  if (routeHandler) {
    // This is a simple version. A real one would render into a container.
    console.log(`Routing to: ${path}`);
    routeHandler();
  }
}

export function addRoute(path, handler) {
  routes[path] = handler;
}

export function startRouter() {
  window.addEventListener("hashchange", handleRouting);
  window.addEventListener("load", handleRouting);
  handleRouting(); // Handle initial route
}
