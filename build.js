const fs = require("fs-extra");
const path = require("path");
const postcss = require("postcss");
const tailwindcss = require("tailwindcss");
const autoprefixer = require("autoprefixer");

async function findHtmlFiles(dir) {
  let files = await fs.readdir(dir);
  let htmlFiles = [];

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = await fs.stat(fullPath);

    console.log(" => ", path.join(dir, file));

    if (stat.isDirectory()) {
      const nestedHtmlFiles = await findHtmlFiles(fullPath);
      htmlFiles = htmlFiles.concat(nestedHtmlFiles);
    } else if (path.extname(file) === ".html") {
      htmlFiles.push(fullPath);
    }
  }

  return htmlFiles;
}

async function processTailwind(contentPaths) {
  const rawCss = `
@tailwind base;
@tailwind components;
@tailwind utilities;
`;

  const result = await postcss([
    tailwindcss({
      content: contentPaths,
    }),
    autoprefixer,
  ]).process(rawCss, { from: undefined });

  return result.css;
}

async function build() {
  const srcDir = path.resolve("src");
  const distDir = path.resolve("build");

  await fs.ensureDir(distDir);

  const htmlFiles = await findHtmlFiles(srcDir);
  // console.log(" => ", htmlFiles);

  return;

  for (const htmlFile of htmlFiles) {
    const relativePath = path.relative(srcDir, htmlFile);

    const htmlContent = await fs.readFile(htmlFile, "utf8");
    const compiledCss = await processTailwind([htmlFile]); // only scan this html for classes

    // 1. Remove <link> tag if exists (cleanup)
    const withoutLink = htmlContent.replace(
      /<link\s+[^>]*href=["'][^"']*\.css["'][^>]*>/i,
      ""
    );

    // 2. Inject compiled <style> before </head>
    const finalHtml = withoutLink.replace(
      /<\/head>/i,
      `<style>\n${compiledCss}\n</style>\n</head>`
    );

    const outputPath = path.join(distDir, relativePath);
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeFile(outputPath, finalHtml);

    console.log(`✅ Built: ${outputPath}`);
  }

  console.log("🎉 Build complete. No external CSS needed anymore.");
}

build();
