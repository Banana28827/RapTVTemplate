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
     * Export a post-sized composition instead of cropping document.body.
     * The editor keeps the upload and draggable overlay in different layout
     * containers, so their page coordinates must not be used as the PNG's
     * coordinates.
     *
     * The uploaded image is always the 432x540 base of the export.
     * The complete draggable overlay is placed over that base at the
     * bottom-left, which is the intended RAP TV composition.
     */
    const exportWidth = 432;
    const imageHeight = 540;

    const computedBackground = getComputedStyle(image).backgroundImage;
    const match = computedBackground.match(/^url\(["']?(.*?)["']?\)$/);

    if (!match) {
      throw new Error("No uploaded image is available to export.");
    }

    const uploadedUrl = match[1];

    exportStage = document.createElement("div");
    exportStage.id = "raptv-export-stage";
    exportStage.style.position = "fixed";
    exportStage.style.left = "-100000px";
    exportStage.style.top = "0";
    exportStage.style.width = exportWidth + "px";
    exportStage.style.height = imageHeight + "px";
    exportStage.style.overflow = "hidden";
    exportStage.style.background = "#000000";
    exportStage.style.pointerEvents = "none";
    exportStage.style.zIndex = "-100000";
    document.body.appendChild(exportStage);

    const exportImage = document.createElement("img");
    exportImage.src = uploadedUrl;
    exportImage.alt = "";
    exportImage.style.position = "absolute";
    exportImage.style.left = "0";
    exportImage.style.top = "0";
    exportImage.style.width = exportWidth + "px";
    exportImage.style.height = imageHeight + "px";
    exportImage.style.objectFit = "cover";
    exportImage.style.objectPosition = "center center";
    exportImage.style.display = "block";
    exportStage.appendChild(exportImage);

    const originalOverlay = image.querySelector("img");
    if (originalOverlay) {
      const overlayClone = originalOverlay.cloneNode(true);
      const overlayStyle = getComputedStyle(originalOverlay);

      overlayClone.style.position = "absolute";
      overlayClone.style.left = "0";
      overlayClone.style.top = "0";
      overlayClone.style.width = exportWidth + "px";
      overlayClone.style.height = "auto";
      overlayClone.style.margin = "0";
      overlayClone.style.transform = overlayStyle.transform;
      overlayClone.style.transformOrigin = overlayStyle.transformOrigin;
      exportStage.appendChild(overlayClone);
    }

    /*
     * Measure the visible overlay independently. #mydiv itself has height:0
     * in the editor, so use its children to determine the actual content
     * footprint before positioning the clone.
     */
    const mydivRect = mydiv.getBoundingClientRect();
    const headerRect = document.getElementById("mydivheader").getBoundingClientRect();
    const mainRect = document.getElementById("maintext").getBoundingClientRect();
    const bottomRect = document.getElementById("bottomtext").getBoundingClientRect();
    const hrRect = document.getElementById("bottomhr").getBoundingClientRect();

    const overlayTop = Math.min(headerRect.top, mainRect.top, bottomRect.top, hrRect.top);
    const overlayBottom = Math.max(headerRect.bottom, mainRect.bottom, bottomRect.bottom, hrRect.bottom);
    const overlayHeight = Math.max(1, Math.ceil(overlayBottom - overlayTop + 8));

    const textClone = mydiv.cloneNode(true);
    textClone.style.position = "absolute";
    textClone.style.left = "0";
    textClone.style.top = Math.max(0, imageHeight - overlayHeight) + "px";
    textClone.style.width = exportWidth + "px";
    textClone.style.height = overlayHeight + "px";
    textClone.style.margin = "0";
    textClone.style.padding = "0";
    textClone.style.background = "transparent";
    textClone.style.zIndex = "10";
    textClone.style.pointerEvents = "none";

    textClone.querySelectorAll("[contenteditable]").forEach(function (el) {
      el.removeAttribute("contenteditable");
    });

    exportStage.appendChild(textClone);

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
      height: imageHeight,
      windowWidth: exportWidth,
      windowHeight: imageHeight,
      scrollX: 0,
      scrollY: 0,
      scale: 2,
      backgroundColor: "#000000",
      useCORS: true,
      logging: false
    });

    const blob = await new Promise(function (resolve, reject) {
      canvas.toBlob(function (result) {
        if (result) resolve(result);
        else reject(new Error("Could not create the PNG file."));
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
