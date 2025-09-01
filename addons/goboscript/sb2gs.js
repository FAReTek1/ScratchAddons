/* global chrome */
import downloadBlob from "../../libraries/common/cs/download-blob.js";


export const sb2gsWhlName = "sb2gs-2.0.0-py3-none-any.whl";

/**
 * @param addon {UserscriptAddon}
 * @param console
 * @param pyodide
 * @returns {Promise<void>}
 */
export async function decompile(addon, console, pyodide) {
  const vm = addon.tab.traps.vm;
  /**@type {Blob}*/
  const project = await vm.saveProjectSb3();
  const inputPath = "/input.sb3";
  const outputDirPath = "/workdir";
  const outputPath = "/output.zip";

  pyodide.FS.writeFile(inputPath, new Uint8Array(await project.arrayBuffer()));

  await pyodide.runPythonAsync(`
import micropip

await micropip.install('emfs:/${sb2gsWhlName}')

package_list = micropip.list()
print(package_list)

from pathlib import Path
import sb2gs
import shutil

input_path = Path("${inputPath}")
output_dir_path = Path("${outputDirPath}")

sb2gs.decompile(input_path, output_dir_path)

shutil.make_archive("${outputPath.slice(0, -4)}", "zip", "${outputDirPath}")
`);
  // This is the zip file provided by shutil.make_archive
  const data = pyodide.FS.readFile(outputPath);
  // for now, let's just download it instead of making an entire file viewing interface
  const blob = new Blob([data]);

  // We need to determine the title of the file.
  // The logic for this is taken from download-button/userscript.js
  const username = await addon.auth.fetchUsername();
  const projectAuthor = addon.tab.redux.state.preview.projectInfo.author?.username;

  const isOwn = username === projectAuthor;

  const title = isOwn ? document.querySelector(".project-title input") : document.querySelector(".project-title");
  const titleStr = isOwn ? title.value : title.innerText;

  const projectId = window.location.pathname.split("/")[2]

  const beginFilenameWithId = true;
  downloadBlob((beginFilenameWithId ? `${projectId} ` : "") + titleStr + '.zip', blob);
}
