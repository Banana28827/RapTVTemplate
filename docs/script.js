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
  const textContainer = document.getElementById("ct");
  const mydiv = document.getElementById("mydiv");
  const bottomHr = document.getElementById("bottomhr");

  if (typeof html2canvas === "undefined") {
    alert("The image exporter could not be loaded. Please refresh the page and try again.");
    return;
  }

  button.disabled = true;
  button.textContent = "Saving...";

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
     * In the editor, the image lives inside the Bootstrap column while the
     * draggable text overlay lives in #mydiv. That means their screen X
     * positions are different. For the exported post, the image must sit
     * directly underneath the entire text overlay.
     *
     * Temporarily translate the image horizontally so its left edge matches
     * #mydiv's left edge. This changes only the export composition and is
     * restored immediately afterward.
     */
    const mydivRect = mydiv.getBoundingClientRect();
    const originalImageTransform = image.style.transform;
    const imageRectBefore = image.getBoundingClientRect();

    image.style.transform =
      "translateX(" + Math.round(mydivRect.left - imageRectBefore.left) + "px)";

    await new Promise(function (resolve) {
      requestAnimationFrame(resolve);
    });

    const imageRect = image.getBoundingClientRect();
    const bottomHrRect = bottomHr.getBoundingClientRect();
    const mainTextRect = document.getElementById("maintext").getBoundingClientRect();
    const bottomTextRect = document.getElementById("bottomtext").getBoundingClientRect();

    // The image and the draggable text now share the same left edge.
    const exportLeft = imageRect.left;
    const exportTop = imageRect.top;

    /*
     * Keep the source image at its original 432x540 size. The exported canvas
     * grows DOWNWARD when the headline wraps or the bottom divider/text extends
     * below the image.
     */
    const exportBottom = Math.max(
      imageRect.bottom,
      bottomHrRect.bottom,
      mainTextRect.bottom,
      bottomTextRect.bottom
    );

    const exportWidth = Math.ceil(imageRect.width);
    const exportHeight = Math.ceil(exportBottom - exportTop + 8);

    /*
     * The text can extend below the browser viewport because #mydiv is
     * absolutely positioned. Give html2canvas a virtual viewport tall enough
     * to render that overflow instead of clipping the export at the viewport.
     */
    const requiredWindowHeight = Math.max(
      window.innerHeight,
      Math.ceil(exportBottom + window.scrollY + 100)
    );

    const canvas = await html2canvas(document.body, {
      x: Math.round(exportLeft + window.scrollX),
      y: Math.round(exportTop + window.scrollY),
      width: exportWidth,
      height: exportHeight,
      windowWidth: Math.max(window.innerWidth, Math.ceil(exportLeft + exportWidth + window.scrollX + 20)),
      windowHeight: requiredWindowHeight,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      scale: 2,
      backgroundColor: "#000000",
      useCORS: true,
      logging: false,
      ignoreElements: function (el) {
        return el.id === "save-image";
      }
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
    if (typeof originalImageTransform !== "undefined") {
      image.style.transform = originalImageTransform;
    }

    button.disabled = false;
    button.textContent = "Save Image";
  }
});
