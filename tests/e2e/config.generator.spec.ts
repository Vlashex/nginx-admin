import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/tests/e2e/harness/index.html");
});

test("generateConfigPreview emits valid nginx server block with directives", async ({
  page,
}) => {
  const config = await page.evaluate(async () => {
    // @ts-expect-error harness
    const { generateConfigPreview } = window.__core__;
    const route = {
      id: "r1",
      domain: "example.com",
      port: 443,
      root: "/var/www/html",
      enabled: true,
      ssl: true,
      ssl_certificate: "/etc/ssl/cert.pem",
      ssl_certificate_key: "/etc/ssl/key.pem",
      locations: [
        { path: "/", index: "index.html" },
        { path: "/api", proxy_pass: "http://backend" },
      ],
      advanced: {
        client_max_body_size: "2m",
        keepalive_timeout: "65s",
        gzip: true,
        gzip_types: "text/plain application/json",
        caching: false,
        cache_valid: "5m",
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "system",
        tags: [],
      },
    };
    return generateConfigPreview(route);
  });

  expect(config).toContain("server {");
  expect(config).toContain("listen 443 ssl");
  expect(config).toContain("server_name example.com");
  expect(config).toContain("root /var/www/html");
  expect(config).toContain("ssl_certificate /etc/ssl/cert.pem");
  expect(config).toContain("ssl_certificate_key /etc/ssl/key.pem");
  expect(config).toContain("client_max_body_size 2m");
  expect(config).toContain("keepalive_timeout 65s");
  expect(config).toContain("gzip on");
  expect(config).toContain("gzip_types text/plain application/json");
  expect(config).toContain("location /");
  expect(config).toContain("index index.html");
  expect(config).toContain("location /api");
  expect(config).toContain("proxy_pass http://backend");
});
