import downloadBlob from "../../libraries/common/cs/download-blob.js";

/**
 * @param addon {UserscriptAddon}
 * @param console
 * @returns {Promise<void>}
 */
export default async function ({ addon, console }) {
  const decompileButton = document.createElement("button");
  decompileButton.className = "button sa-decompile-button waiting";
  decompileButton.title = "Decompile to goboscript code & download.";
  decompileButton.appendChild(document.createElement("span")).innerText = "Decompile";

  decompileButton.onclick = async (e) => {
    decompileButton.classList.remove("waiting");
    decompileButton.classList.add("loading");

    const username = await addon.auth.fetchUsername();
    const projectAuthor = addon.tab.redux.state.preview.projectInfo.author?.username;

    const isOwn = username === projectAuthor;

    const title = isOwn ? document.querySelector(".project-title input") : document.querySelector(".project-title");
    const titleStr = isOwn ? title.value : title.innerText;

    const projectId = window.location.pathname.split("/")[2];

    try {
      const beginFilenameWithId = e.shiftKey !== addon.settings.get("beginFilenameWithId");

      const data = await (await fetch(`https://faretek-api.vercel.app/api/sb2gs/?id=${projectId}`)).blob();
      downloadBlob((beginFilenameWithId ? `${projectId} ` : "") + titleStr + ".zip", data);
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
