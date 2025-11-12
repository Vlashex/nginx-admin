import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/tests/e2e/harness/index.html");
  await page.locator("h1:has-text('Harness')").waitFor();
  await page.waitForFunction(() => {
    // @ts-expect-error harness
    return typeof window !== "undefined" && !!window.__stores__;
  });
});

test("server status change generates log entry", async ({ page }) => {
  await page.evaluate(() => {
    // @ts-expect-error harness
    window.__stores__.logs.clearLogs();
  });
  await page.evaluate(() => {
    // @ts-expect-error harness
    window.__stores__.server.toggleStatus("running");
  });
  await expect(page.locator("#server-status")).toHaveText("running");
  await expect(page.locator("#logs-count")).toHaveText("1");
});

test("route selection updates edit form", async ({ page }) => {
  const id = await page.evaluate(async () => {
    // @ts-expect-error harness
    const routes = window.__stores__.routes;
    const newId = await routes.addRoute({
      domain: "example.com",
      port: 80,
      root: "/var/www/html",
      enabled: true,
      ssl: false,
      locations: [],
      advanced: {
        client_max_body_size: "1m",
        keepalive_timeout: "65s",
        gzip: false,
        gzip_types: "",
        caching: false,
        cache_valid: "5m",
      },
    });
    await routes.loadRoutes(); // ensure in-memory map is populated
    return newId as string;
  });

  await page.evaluate((rid) => {
    // @ts-expect-error harness
    window.__stores__.routes.setCurrentRoute(rid);
  }, id);

  await expect(page.locator("#current-route")).toHaveText(id);
  await expect(page.locator("#form-domain")).toHaveText("example.com"); // will now update
});

test("route changes auto-save", async ({ page }) => {
  // add two routes then trigger save throttle
  await page.evaluate(async () => {
    // @ts-expect-error harness
    const routes = window.__stores__.routes;
    await routes.addRoute({
      domain: "a.com",
      port: 80,
      root: "/var/www/html",
      enabled: true,
      ssl: false,
      locations: [],
      advanced: {
        client_max_body_size: "1m",
        keepalive_timeout: "65s",
        gzip: false,
        gzip_types: "",
        caching: false,
        cache_valid: "5m",
      },
    });
    await routes.addRoute({
      domain: "b.com",
      port: 81,
      root: "/var/www/site",
      enabled: false,
      ssl: false,
      locations: [],
      advanced: {
        client_max_body_size: "2m",
        keepalive_timeout: "65s",
        gzip: true,
        gzip_types: "text/plain",
        caching: false,
        cache_valid: "5m",
      },
    });
  });

  // wait beyond the debounce to allow saveRoutes to run
  await page.waitForTimeout(1200);

  // assert that save flag persisted by presence of localStorage key used by LocalStorageRouteRepository
  const persisted = await page.evaluate(() => {
    return (
      localStorage.getItem("routes") ?? localStorage.getItem("nginx_routes")
    );
  });
  expect(persisted).toBeTruthy();
});
