import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

/**
 * Flat config, composed directly.
 *
 * `eslint-config-next` 16 ships real flat configs, so the `FlatCompat` shim this
 * file used to go through is gone — passing a native flat config back through
 * the eslintrc compatibility layer makes it try to JSON-serialise a plugin
 * object that references itself, and ESLint dies on the circular structure
 * rather than reporting anything useful.
 */
const config = [
  {
    // Build output and generated files. `.netlify/` appears after
    // `netlify deploy --build`; `next-env.d.ts` is rewritten on every build.
    ignores: [".next/**", ".netlify/**", "node_modules/**", "next-env.d.ts"],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      "no-console": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
    },
  },
  {
    /* The asset pipeline is a build-time Node script, not app code: it reports
       what it measured and what it wrote, which is the whole point of running it. */
    files: ["scripts/**/*.mjs"],
    rules: { "no-console": "off" },
  },
  {
    /* Netlify scheduled functions. Nobody is watching a cron run, so the
       function log is the only place its outcome can be observed — and Netlify
       requires the handler to be the default export, which it cannot be and
       also be a named declaration this rule is happy with. */
    files: ["netlify/functions/**/*.mjs"],
    rules: {
      "no-console": "off",
      "import/no-anonymous-default-export": "off",
    },
  },
];

export default config;
