// Resolve only shipped framework implementations; user state never chooses a module path.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
export const supportedFrameworks = Object.freeze([
  "swot",
  "pages",
  "vpc",
  "vars",
  "five_whys",
  "five_forces",
  "issue_tree",
]);
export function getCore(id) {
  if (!supportedFrameworks.includes(id))
    throw new Error("Unsupported canvas framework.");
  return require(`../../frameworks/${id}/state.js`);
}
export function getFrameworkDirectory(id) {
  getCore(id);
  return new URL(`../../frameworks/${id}/`, import.meta.url);
}
export function frameworkValidator(id) {
  const core = getCore(id);
  return (canvas) => {
    if (canvas?.framework !== id)
      throw new Error(
        `Working folder framework is ${id}; replacing it is not supported.`,
      );
    return core.validate(canvas);
  };
}
