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

  if (typeof html2canvas === "undefined") {
    alert("The image exporter could not be loaded. Please refresh the page and try again.");
    return;
  }

  button.disabled = true;
  button.textContent = "Saving...";

  try {
    const imageRect = image.getBoundingClientRect();

    const textElements = [
      document.getElementById("mydivheader"),
      document.getElementById("maintext"),
      document.getElementById("bottomtext"),
      document.getElementById("bottomhr")
    ].filter(Boolean);

    // Make sure the custom Steelfishy font has finished loading before
    // html2canvas clones the text.
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    // The post normally starts at the selected image. Extend the export only
    // when a draggable element (especially bottomhr) reaches below it.
    const rects = textElements.map(function (el) {
      const r = el.getBoundingClientRect();
      return {
        left: r.left,
        top: r.top,
        right: r.right,
        bottom: r.bottom
      };
    });

    const exportLeft = Math.min(
      imageRect.left,
      ...rects.map(r => r.left)
    );
    const exportTop = imageRect.top;
    const exportRight = Math.max(
      imageRect.right,
      ...rects.map(r => r.right)
    );
    const exportBottom = Math.max(
      imageRect.bottom,
      ...rects.map(r => r.bottom)
    );

    const exportWidth = Math.ceil(exportRight - exportLeft);
    const exportHeight = Math.ceil(exportBottom - exportTop);

    const exportBox = document.createElement("div");
    exportBox.dataset.raptvExport = "true";
    exportBox.style.position = "fixed";
    exportBox.style.left = "0";
    exportBox.style.top = "0";
    exportBox.style.width = exportWidth + "px";
    exportBox.style.height = exportHeight + "px";
    exportBox.style.overflow = "hidden";
    exportBox.style.backgroundColor = "#000000";
    exportBox.style.zIndex = "-99999";

    // Copy the selected image and overlay.
    const imageClone = image.cloneNode(true);
    imageClone.style.position = "absolute";
    imageClone.style.left = Math.round(imageRect.left - exportLeft) + "px";
    imageClone.style.top = "0";
    imageClone.style.margin = "0";
    imageClone.style.width = Math.round(imageRect.width) + "px";
    imageClone.style.height = Math.round(imageRect.height) + "px";
    imageClone.style.border = "1px solid black";
    exportBox.appendChild(imageClone);

    textElements.forEach(function (source) {
      const rect = source.getBoundingClientRect();
      const clone = source.cloneNode(true);
      const computed = window.getComputedStyle(source);

      clone.style.position = "absolute";
      clone.style.left = Math.round(rect.left - exportLeft) + "px";
      clone.style.top = Math.round(rect.top - exportTop) + "px";
      clone.style.margin = "0";
      clone.style.visibility = "visible";
      clone.style.opacity = "1";

      // html2canvas can otherwise fall back to a default font for cloned
      // content. Copy the resolved font properties explicitly.
      clone.style.fontFamily = computed.fontFamily;
      clone.style.fontSize = computed.fontSize;
      clone.style.fontStyle = computed.fontStyle;
      clone.style.fontWeight = computed.fontWeight;
      clone.style.lineHeight = computed.lineHeight;
      clone.style.letterSpacing = computed.letterSpacing;
      clone.style.textTransform = computed.textTransform;
      clone.style.color = computed.color;

      // Preserve the NEWS image's intrinsic dimensions and bottomhr width.
      if (source.id === "bottomhr") {
        clone.style.width = computed.width;
        clone.style.height = computed.height;
      }

      exportBox.appendChild(clone);
    });

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
    const leftover = document.querySelector("body > div[data-raptv-export='true']");
    if (leftover) {
      leftover.remove();
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
