module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment: "No circular dependencies allowed in the frontend source graph.",
      from: { path: "^src" },
      to: { circular: true },
    },
    {
      name: "features-cant-import-higher-layers",
      severity: "error",
      comment: "Features must not import from app/pages/widgets.",
      from: { path: "^src/features" },
      to: { path: "^src/(app|pages|widgets)" },
    },
    {
      name: "widgets-cant-import-higher-layers",
      severity: "error",
      comment: "Widgets must not import from app/pages.",
      from: { path: "^src/widgets" },
      to: { path: "^src/(app|pages)" },
    },
    {
      name: "entities-cant-import-higher-layers",
      severity: "error",
      comment: "Entities must not import from app/pages/widgets/features.",
      from: { path: "^src/entities" },
      to: { path: "^src/(app|pages|widgets|features)" },
    },
    {
      name: "shared-cant-import-higher-layers",
      severity: "error",
      comment: "Shared must not import from app/pages/widgets/features/entities.",
      from: { path: "^src/shared" },
      to: { path: "^src/(app|pages|widgets|features|entities)" },
    },
    {
      name: "pages-cant-import-app",
      severity: "error",
      comment: "Pages must not import from app.",
      from: { path: "^src/pages" },
      to: { path: "^src/app" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: { path: "dist" },
    tsConfig: { fileName: "tsconfig.json" },
  },
};
