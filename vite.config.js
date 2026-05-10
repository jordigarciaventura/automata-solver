export default {
  "root": "src",
  build: {
    outDir: '../dist',
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("d3-graphviz") || id.includes("@hpcc-js/wasm")) {
            return "graphviz-vendor";
          }
          if (id.includes("d3")) {
            return "d3-vendor";
          }
          if (id.includes("canvg")) {
            return "canvg-vendor";
          }
          return "vendor";
        },
      },
    },
  }
}