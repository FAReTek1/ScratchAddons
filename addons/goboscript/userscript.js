/* global chrome */
import * as sb2gs from "./sb2gs.js";
import * as pyodidePkg from "./../../libraries/thirdparty/pyodide/pyodide.mjs";

/**
 * @param addon {UserscriptAddon}
 * @param console
 * @returns {Promise<void>}
 */
export default async function ({ addon, console }) {
  const decompileButton = document.createElement("button");
  decompileButton.className = "button sa-decompile-button waiting";
  decompileButton.title = "decompile to goboscript code";
  decompileButton.appendChild(document.createElement("span")).innerText = "Decompile";

  const pyodidePromise = pyodidePkg.loadPyodide();

  const pyodidePackagingPromise = pyodidePromise.then(async (pyodide) => {
    console.log("PYODIDE LOADED");

    const loadMicropipPromise = pyodide.loadPackage("micropip");

    const sb2gsWhlFile = await (await fetch(`${addon.self.dir}/${sb2gs.sb2gsWhlName}`)).bytes();

    pyodide.FS.writeFile(`/${sb2gs.sb2gsWhlName}`, sb2gsWhlFile);

    await loadMicropipPromise;

    console.log("EXITING PYODIDE PACKAGING");
    return pyodide;
  });

  decompileButton.onclick = async () => {
    console.log("DECOMPILE BUTTON CLICKED");
    const pyodide = await pyodidePackagingPromise;
    console.log("AWAITED PYODIDE PACKAGING");

    decompileButton.classList.remove("waiting");
    decompileButton.classList.add("loading");
    try {
      await sb2gs.decompile(addon, console, pyodide, decompileButton);
    } catch (err) {
      window.alert(err);
    }
    decompileButton.classList.remove("loading");
    decompileButton.classList.add("waiting");
  };

  while (true) {
    const seeInside = await addon.tab.waitForElement(".see-inside-button", {
      markAsSeen: true,
    });
    seeInside.parentElement.appendChild(decompileButton);
  }
}
