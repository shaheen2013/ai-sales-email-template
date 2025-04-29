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

    if (stat.isDirectory()) {
      const nestedHtmlFiles = await findHtmlFiles(fullPath);
      htmlFiles = htmlFiles.concat(nestedHtmlFiles);
    } else if (path.extname(file) === ".html") {
      htmlFiles.push(fullPath);
    }
  }

  return htmlFiles;
}

async function processCss(cssFilePath) {
  const rawCss = await fs.readFile(cssFilePath, "utf8");

  const result = await postcss([
    tailwindcss({
      content: ["./src/**/*.html"],
    }),
    autoprefixer,
  ]).process(rawCss, { from: undefined });

  return result.css;
}

async function build() {
  const srcDir = path.resolve("src");
  const distDir = path.resolve("dist");

  await fs.ensureDir(distDir);

  const htmlFiles = await findHtmlFiles(srcDir);

  for (const htmlFile of htmlFiles) {
    const relativePath = path.relative(srcDir, htmlFile);
    const baseName = path.basename(htmlFile, ".html");
    const cssFile = path.join(path.dirname(htmlFile), `${baseName}.css`);

    if (await fs.pathExists(cssFile)) {
      const htmlContent = await fs.readFile(htmlFile, "utf8");
      const compiledCss = await processCss(cssFile);

      // 1. Remove <link> tag (the one linking to css)
      const withoutLink = htmlContent.replace(
        /<link\s+[^>]*href=["'][^"']*\.css["'][^>]*>/i,
        ""
      );

      // 2. Insert <style> right before </head>
      const finalHtml = withoutLink.replace(
        /<\/head>/i,
        `<style>\n${compiledCss}\n</style>\n</head>`
      );

      const outputPath = path.join(distDir, relativePath);
      await fs.ensureDir(path.dirname(outputPath));
      await fs.writeFile(outputPath, finalHtml);

      console.log(`✅ Built: ${outputPath}`);
    } else {
      console.warn(`⚠️ No matching CSS for: ${htmlFile}`);
    }
  }
}

build();
