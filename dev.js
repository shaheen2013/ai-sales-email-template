const fs = require("fs-extra");
const path = require("path");
const postcss = require("postcss");
const tailwindcss = require("tailwindcss");
const autoprefixer = require("autoprefixer");
const chokidar = require("chokidar");
const liveServer = require("live-server");

const srcDir = path.resolve("src");
const tempCssPath = path.join(srcDir, "dist.css"); // Temporary built CSS

// Step 1: Build Tailwind CSS to temp dist.css
async function buildCSS() {
  const rawCss = `
    @tailwind base;
    @tailwind components;
    @tailwind utilities;
  `;

  const result = await postcss([
    tailwindcss({ content: ["./src/**/*.html"] }),
    autoprefixer,
  ]).process(rawCss, { from: undefined });

  await fs.writeFile(tempCssPath, result.css);
  console.log("✅ CSS rebuilt: dist.css");
}

// Step 2: Start live-server once
function startServer() {
  const params = {
    root: "./src",
    open: true,
    wait: 500,
    logLevel: 2,
    port: 8080,
  };

  liveServer.start(params);
  console.log("🚀 Dev server running: http://localhost:8080");
}

// Step 3: Watch for changes and rebuild CSS only
function watchFiles() {
  chokidar
    .watch(["src/**/*.html", "src/**/*.css"], {
      ignoreInitial: true,
    })
    .on("all", async (event, filePath) => {
      console.log(`🔄 File changed: ${filePath}`);
      await buildCSS();
    });
}

// Main
async function main() {
  await buildCSS(); // Build CSS once at start
  startServer(); // Serve HTMLs with live reload
  watchFiles(); // Watch for dev changes
}

main();
