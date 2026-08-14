import fs from "node:fs";
import path from "node:path";

const packageJSONPath = path.resolve(process.cwd(), "./package.json");
const content = (await import(packageJSONPath, { with: { type: "json" } }))
  .default;

function bumpBabelDependency(type, version) {
  const dependencies = content[type];
  for (const dep of Object.keys(dependencies)) {
    if (dep.startsWith("@babel/") && !dependencies[dep].includes(":")) {
      dependencies[dep] = version;
      console.log(`Bumped ${type}:${dep} to ${version}`);
    }
  }
}

if (process.argv[2] === "resolutions") {
  const resolutions = content.resolutions || {};
  for (const name of fs.readdirSync(
    new URL("../../../packages", import.meta.url)
  )) {
    if (!name.startsWith("babel-")) continue;
    resolutions[name.replace("babel-", "@babel/")] = "*";
  }
  content.resolutions = resolutions;
} else {
  if ("peerDependencies" in content) {
    bumpBabelDependency("peerDependencies", "*");
  }
  // `latest` meant the Babel 7 line when this was written, which is the point
  // of the "downgrade" callers (CI's node <= 10 legs, which pin jest@24).
  // Babel 8 has since taken over the `latest` dist-tag and ships ESM, which
  // that toolchain cannot load, so ask for the 7 line explicitly.
  if ("devDependencies" in content) {
    bumpBabelDependency("devDependencies", "^7");
  }
  if ("dependencies" in content) {
    bumpBabelDependency("dependencies", "^7");
  }
}

fs.writeFileSync(packageJSONPath, JSON.stringify(content, undefined, 2));
