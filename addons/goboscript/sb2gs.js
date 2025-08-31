/* global chrome */
import * as pyodidePkg from "./pyodide/pyodide.mjs";

/**
 * @param addon {UserscriptAddon}
 * @param console
 * @returns {Promise<void>}
 */
export default async function ({ addon, console }) {
  const decompileButton = document.createElement("button");
  decompileButton.className = "button sa-decompile-button";
  decompileButton.title = "decompile to goboscript code";
  decompileButton.appendChild(document.createElement("span")).innerText = "Decompile";

  const pyodide = await pyodidePkg.loadPyodide();
  await pyodide.loadPackage("micropip");

  // TESTING
  pyodide.FS.writeFile("/input.sb3", await (await fetch(`${addon.self.dir}/test.sb3`)).bytes());

  const sb2gsWhlName = "sb2gs-2.0.0-py3-none-any.whl";
  pyodide.FS.writeFile(`/${sb2gsWhlName}`, await (await fetch(`${addon.self.dir}/${sb2gsWhlName}`)).bytes());

  await pyodide.runPythonAsync(`
import micropip

await micropip.install('emfs:/${sb2gsWhlName}')

package_list = micropip.list()
print(package_list)

from pathlib import Path
import sb2gs

sb2gs.decompile(Path("/input.sb3"), Path("/output"))
`);

  console.log(pyodide.FS.readdir("/output"));
  // END TESTING

  while (true) {
    const seeInside = await addon.tab.waitForElement(".see-inside-button", {
      markAsSeen: true,
    });
    seeInside.parentElement.appendChild(decompileButton);
  }
}
