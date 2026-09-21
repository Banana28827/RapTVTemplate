function auto_height(elem) {  /* javascript */
    elem.style.height = "1px";
    elem.style.height = (elem.scrollHeight)+"px";
}


//Make the DIV element draggagle:
dragElement(document.getElementById("mydiv"));

function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  var dragHandle = document.getElementById(elmnt.id + "header") || elmnt;

  // Pointer events work with both mouse and touch, so dragging works on PC and mobile.
  dragHandle.addEventListener("pointerdown", dragPointerDown);

  function dragPointerDown(e) {
    e.preventDefault();

    pos3 = e.clientX;
    pos4 = e.clientY;

    // Keep receiving pointer events even if the finger/mouse leaves the header.
    if (dragHandle.setPointerCapture) {
      dragHandle.setPointerCapture(e.pointerId);
    }

    dragHandle.addEventListener("pointermove", elementDrag);
    dragHandle.addEventListener("pointerup", closeDragElement);
    dragHandle.addEventListener("pointercancel", closeDragElement);
  }

  function elementDrag(e) {
    e.preventDefault();

    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;

    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement(e) {
    dragHandle.removeEventListener("pointermove", elementDrag);
    dragHandle.removeEventListener("pointerup", closeDragElement);
    dragHandle.removeEventListener("pointercancel", closeDragElement);

    if (dragHandle.releasePointerCapture && e && dragHandle.hasPointerCapture(e.pointerId)) {
      dragHandle.releasePointerCapture(e.pointerId);
    }
  }
}

function newText(c){
  let newLine = '<font color='+c+'>&nbsp</font>';
   document.getElementById('maintext').focus();
   pasteHtmlAtCaret(newLine);

}

function pasteHtmlAtCaret(html) {
    var sel, range;
    if (window.getSelection) {
        // IE9 and non-IE
        sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount) {
            range = sel.getRangeAt(0);
            range.deleteContents();

            // Range.createContextualFragment() would be useful here but is
            // non-standard and not supported in all browsers (IE9, for one)
            var el = document.createElement("div");
            el.innerHTML = html;
            var frag = document.createDocumentFragment(), node, lastNode;
            while ( (node = el.firstChild) ) {
                lastNode = frag.appendChild(node);
            }
            range.insertNode(frag);

            // Preserve the selection
            if (lastNode) {
                range = range.cloneRange();
                range.setStartAfter(lastNode);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }
    } else if (document.selection && document.selection.type != "Control") {
        // IE < 9
        document.selection.createRange().pasteHTML(html);
    }
}

const image_input = document.querySelector("#image-input");

image_input.addEventListener("change", function() {
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    const uploaded_image = reader.result;
    document.querySelector("#display-image").style.backgroundImage = `url(${uploaded_image})`;
  });
  reader.readAsDataURL(this.files[0]);
});


$("#slider").on("input",function () {
  $('#maintext').css("font-size", $(this).val() + "px");
  console.log((this).val());
});


// Save the generated post as a PNG.
document.getElementById("save-image").addEventListener("click", async function () {
  const button = this;
  const image = document.getElementById("display-image");
  const textContainer = document.getElementById("mydiv");

  if (typeof html2canvas === "undefined") {
    alert("The image exporter could not be loaded. Please refresh the page and try again.");
    return;
  }

  button.disabled = true;
  button.textContent = "Saving...";

  let exportBox = null;

  try {
    const imageRect = image.getBoundingClientRect();
    const textRect = textContainer.getBoundingClientRect();

    const exportWidth = Math.round(imageRect.width);
    const exportHeight = Math.round(imageRect.height);

    // Make absolutely sure the custom font is loaded before html2canvas runs.
    if (document.fonts) {
      await document.fonts.load('50px "Steelfishy"');
      await document.fonts.ready;
    }

    exportBox = document.createElement("div");
    exportBox.dataset.raptvExport = "true";
    exportBox.style.position = "fixed";
    exportBox.style.left = "0";
    exportBox.style.top = "0";
    exportBox.style.width = exportWidth + "px";
    exportBox.style.height = exportHeight + "px";
    exportBox.style.overflow = "hidden";
    exportBox.style.background = "#000000";
    exportBox.style.zIndex = "-99999";

    // Put the image/overlay into the export at exactly its displayed size.
    const imageClone = image.cloneNode(true);
    imageClone.style.position = "absolute";
    imageClone.style.left = "0";
    imageClone.style.top = "0";
    imageClone.style.width = imageRect.width + "px";
    imageClone.style.height = imageRect.height + "px";
    imageClone.style.margin = "0";
    imageClone.style.border = "1px solid black";
    exportBox.appendChild(imageClone);

    /*
     * Clone the ENTIRE draggable text container instead of cloning each text
     * node individually. This preserves #ct, .container, #maintext,
     * #bottomtext and #bottomhr exactly as the live page lays them out.
     */
    const textClone = textContainer.cloneNode(true);
    textClone.style.position = "absolute";
    textClone.style.left = Math.round(textRect.left - imageRect.left) + "px";
    textClone.style.top = Math.round(textRect.top - imageRect.top) + "px";
    textClone.style.margin = "0";
    textClone.style.right = "auto";
    textClone.style.bottom = "auto";
    textClone.style.transform = "none";
    textClone.style.visibility = "visible";
    textClone.style.opacity = "1";

    // Explicitly preserve the live container dimensions/appearance.
    const textComputed = window.getComputedStyle(textContainer);
    textClone.style.width = textComputed.width;
    textClone.style.height = textComputed.height;
    textClone.style.backgroundColor = textComputed.backgroundColor;
    textClone.style.border = textComputed.border;
    textClone.style.padding = textComputed.padding;
    textClone.style.boxSizing = textComputed.boxSizing;

    exportBox.appendChild(textClone);

    /*
     * Add a font-face inside the export tree. This prevents html2canvas from
     * falling back to Arial when it renders the cloned Steelfishy text.
     * The font is same-origin with this GitHub Pages site.
     */
    try {
      const fontResponse = await fetch(new URL("steelfishy/steelfisheb.ttf", document.baseURI).href);
      if (fontResponse.ok) {
        const fontBuffer = await fontResponse.arrayBuffer();
        const bytes = new Uint8Array(fontBuffer);
        let binary = "";
        const chunkSize = 0x8000;

        for (let i = 0; i < bytes.length; i += chunkSize) {
          binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
        }

        const fontStyle = document.createElement("style");
        fontStyle.textContent =
          '@font-face { font-family: "Steelfishy"; src: url(data:font/ttf;base64,' +
          btoa(binary) +
          ') format("truetype"); font-style: normal; font-weight: 100; }' +
          '#mydiv, #mydiv * { font-family: "Steelfishy"; }' +
          '#bottomtext { font-family: Arial !important; }';
        exportBox.insertBefore(fontStyle, exportBox.firstChild);
      }
    } catch (fontError) {
      console.warn("Could not embed Steelfishy font; using the loaded page font.", fontError);
    }

    document.body.appendChild(exportBox);

    await new Promise(function (resolve) {
      requestAnimationFrame(function () {
        requestAnimationFrame(resolve);
      });
    });

    const canvas = await html2canvas(exportBox, {
      width: exportWidth,
      height: exportHeight,
      scale: 2,
      backgroundColor: "#000000",
      useCORS: true,
      logging: false
    });

    exportBox.remove();
    exportBox = null;

    const blob = await new Promise(function (resolve, reject) {
      canvas.toBlob(function (result) {
        if (result) {
          resolve(result);
        } else {
          reject(new Error("Could not create the PNG file."));
        }
      }, "image/png");
    });

    const file = new File([blob], "raptv-post.png", { type: "image/png" });

    if ("showSaveFilePicker" in window) {
      const handle = await window.showSaveFilePicker({
        suggestedName: "raptv-post.png",
        types: [{
          description: "PNG image",
          accept: { "image/png": [".png"] }
        }]
      });

      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
    } else if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
      await navigator.share({
        files: [file],
        title: "RAP TV Post",
        text: "Save your generated RAP TV post"
      });
    } else {
      const link = document.createElement("a");
      link.download = "raptv-post.png";
      link.href = URL.createObjectURL(blob);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(function () {
        URL.revokeObjectURL(link.href);
      }, 1000);
    }
  } catch (error) {
    if (exportBox) {
      exportBox.remove();
    }

    if (error && error.name !== "AbortError") {
      console.error("Could not save image:", error);
      alert("Could not save the image. Please try again.");
    }
  } finally {
    button.disabled = false;
    button.textContent = "Save Image";
  }
});
