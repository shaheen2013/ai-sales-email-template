import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  root: "./src", // Vite will look for files in the `src` folder
  build: {
    outDir: "../dist", // Output build will go to `dist` folder
    rollupOptions: {
      input: path.resolve(__dirname, "src/*.html"), // Target all `.html` files in `src` folder
    },
  },
  plugins: [],
});
