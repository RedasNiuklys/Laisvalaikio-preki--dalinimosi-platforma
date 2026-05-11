import { Project } from "ts-morph";
import * as fs from "fs";
import * as path from "path";

const project = new Project({
  tsConfigFilePath: "./tsconfig.json"
});

const packages = new Map<string, string[]>();

project.getSourceFiles("app/**/*.{ts,tsx}").forEach(file => {
  const filePath = file.getFilePath();

  // Get folder relative to app
  const relativeDir = path
    .dirname(path.relative(process.cwd(), filePath))
    .replace(/\\/g, "/");

  if (!packages.has(relativeDir)) {
    packages.set(relativeDir, []);
  }

  const items = packages.get(relativeDir)!;

  file.getClasses().forEach(cls => {
    items.push(`class ${cls.getName()}`);
  });

  file.getInterfaces().forEach(intf => {
    items.push(`interface ${intf.getName()}`);
  });

  file.getTypeAliases().forEach(type => {
    items.push(`class ${type.getName()}`);
  });
});

let uml = "@startuml\n\n";

packages.forEach((items, pkg) => {
  uml += `package "${pkg}" {\n`;

  items.forEach(item => {
    uml += `  ${item}\n`;
  });

  uml += "}\n\n";
});

uml += "@enduml";

fs.writeFileSync("model.puml", uml);

console.log("Generated model.puml");