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
  const mydiv = document.getElementById("mydiv");

  if (typeof html2canvas === "undefined") {
    alert("The image exporter could not be loaded. Please refresh the page and try again.");
    return;
  }

  button.disabled = true;
  button.textContent = "Saving...";

  let exportStage = null;

  try {
    if (document.fonts) {
      await document.fonts.load('50px "Steelfishy"');
      await document.fonts.ready;
    }

    await new Promise(function (resolve) {
      requestAnimationFrame(function () {
        requestAnimationFrame(resolve);
      });
    });

    /*
     * Do not capture document.body here. #display-image is a CSS background,
     * while the draggable text is a separate absolutely-positioned element.
     * html2canvas can render that combination with the background displaced
     * when the body is cropped.
     *
     * Instead, build a small, self-contained export stage:
     *   - a real <img> for the uploaded background
     *   - the existing text/NEWS/divider overlay cloned at its exact screen
     *     position relative to the image
     *   - the existing overlay.png cloned over the image
     *
     * This makes the exported coordinates independent of Bootstrap columns,
     * the page viewport, scrolling, and html2canvas body cropping.
     */
    const imageRect = image.getBoundingClientRect();
    const mydivRect = mydiv.getBoundingClientRect();
    const bottomHr = document.getElementById("bottomhr");
    const mainText = document.getElementById("maintext");
    const bottomText = document.getElementById("bottomtext");

    const rects = [
      mydivRect,
      bottomHr.getBoundingClientRect(),
      mainText.getBoundingClientRect(),
      bottomText.getBoundingClientRect()
    ];

    const relativeBottom = Math.max.apply(null, rects.map(function (rect) {
      return rect.bottom - imageRect.top;
    }));

    const exportWidth = Math.max(1, Math.ceil(imageRect.width));
    const exportHeight = Math.max(
      Math.ceil(imageRect.height),
      Math.ceil(relativeBottom + 8)
    );

    exportStage = document.createElement("div");
    exportStage.id = "raptv-export-stage";
    exportStage.style.position = "absolute";
    exportStage.style.left = "0px";
    exportStage.style.top = "0px";
    exportStage.style.width = exportWidth + "px";
    exportStage.style.height = exportHeight + "px";
    exportStage.style.overflow = "hidden";
    exportStage.style.background = "#000";
    exportStage.style.pointerEvents = "none";
    exportStage.style.zIndex = "-100000";
    document.body.appendChild(exportStage);

    // Recreate the uploaded CSS background as a real image so it cannot be
    // lost or shifted when html2canvas renders the export.
    const backgroundImage = document.createElement("img");
    const backgroundUrl = getComputedStyle(image).backgroundImage;

    if (!backgroundUrl || backgroundUrl === "none") {
      throw new Error("No uploaded image is available to export.");
    }

    const urlMatch = backgroundUrl.match(/^url\(["']?(.*?)["']?\)$/);
    if (!urlMatch) {
      throw new Error("Could not read the uploaded image.");
    }

    backgroundImage.src = urlMatch[1];
    backgroundImage.style.position = "absolute";
    backgroundImage.style.left = "0px";
    backgroundImage.style.top = "0px";
    backgroundImage.style.width = exportWidth + "px";
    backgroundImage.style.height = Math.ceil(imageRect.height) + "px";
    backgroundImage.style.objectFit = "cover";
    backgroundImage.style.objectPosition = "center center";
    backgroundImage.style.display = "block";
    exportStage.appendChild(backgroundImage);

    // Clone the existing overlay graphic from inside #display-image.
    const originalOverlay = image.querySelector("img");
    if (originalOverlay) {
      const overlayClone = originalOverlay.cloneNode(true);
      const overlayRect = originalOverlay.getBoundingClientRect();
      const overlayStyle = getComputedStyle(originalOverlay);

      overlayClone.style.position = "absolute";
      overlayClone.style.left = Math.round(overlayRect.left - imageRect.left) + "px";
      overlayClone.style.top = Math.round(overlayRect.top - imageRect.top) + "px";
      overlayClone.style.width = Math.ceil(overlayRect.width) + "px";
      overlayClone.style.height = Math.ceil(overlayRect.height) + "px";
      overlayClone.style.margin = "0";
      overlayClone.style.transform = overlayStyle.transform;
      overlayClone.style.transformOrigin = overlayStyle.transformOrigin;
      exportStage.appendChild(overlayClone);
    }

    // Clone the complete draggable overlay, preserving its internal layout.
    const textClone = mydiv.cloneNode(true);
    textClone.style.position = "absolute";
    textClone.style.left = Math.round(mydivRect.left - imageRect.left) + "px";
    textClone.style.top = Math.round(mydivRect.top - imageRect.top) + "px";
    textClone.style.width = Math.ceil(mydivRect.width) + "px";
    textClone.style.height = exportHeight + "px";
    textClone.style.margin = "0";
    textClone.style.background = "transparent";
    textClone.style.zIndex = "10";
    textClone.style.pointerEvents = "none";

    // The cloned content should not retain the editor's cursor/selection.
    textClone.querySelectorAll("[contenteditable]").forEach(function (el) {
      el.removeAttribute("contenteditable");
    });

    exportStage.appendChild(textClone);

    // Wait for every image/font inside the isolated stage before capturing it.
    const stageImages = Array.from(exportStage.querySelectorAll("img"));
    await Promise.all(stageImages.map(function (img) {
      if (img.complete && img.naturalWidth > 0) {
        return Promise.resolve();
      }

      return new Promise(function (resolve, reject) {
        img.addEventListener("load", resolve, { once: true });
        img.addEventListener("error", function () {
          reject(new Error("An export image could not be loaded."));
        }, { once: true });
      });
    }));

    await new Promise(function (resolve) {
      requestAnimationFrame(function () {
        requestAnimationFrame(resolve);
      });
    });

    const canvas = await html2canvas(exportStage, {
      width: exportWidth,
      height: exportHeight,
      windowWidth: exportWidth,
      windowHeight: exportHeight,
      scrollX: 0,
      scrollY: 0,
      scale: 2,
      backgroundColor: "#000000",
      useCORS: true,
      logging: false
    });

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
    if (error && error.name !== "AbortError") {
      console.error("Could not save image:", error);
      alert("Could not save the image. Please try again.");
    }
  } finally {
    if (exportStage && exportStage.parentNode) {
      exportStage.parentNode.removeChild(exportStage);
    }

    button.disabled = false;
    button.textContent = "Save Image";
  }
});
