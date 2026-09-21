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
    // Export exactly the 432x540 post area. The text is positioned inside
    // this area according to its real position on the page.
    const imageRect = image.getBoundingClientRect();
    const exportWidth = Math.round(imageRect.width);
    const exportHeight = Math.round(imageRect.height);

    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

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

    // Copy the complete image/overlay exactly as displayed.
    const imageClone = image.cloneNode(true);
    imageClone.style.position = "absolute";
    imageClone.style.left = "0";
    imageClone.style.top = "0";
    imageClone.style.margin = "0";
    imageClone.style.width = exportWidth + "px";
    imageClone.style.height = exportHeight + "px";
    imageClone.style.border = "1px solid black";
    exportBox.appendChild(imageClone);

    const textElements = [
      document.getElementById("mydivheader"),
      document.getElementById("maintext"),
      document.getElementById("bottomtext"),
      document.getElementById("bottomhr")
    ].filter(Boolean);

    textElements.forEach(function (source) {
      const rect = source.getBoundingClientRect();
      const computed = window.getComputedStyle(source);
      const clone = source.cloneNode(true);

      clone.style.position = "absolute";
      clone.style.boxSizing = "border-box";
      clone.style.left = Math.round(rect.left - imageRect.left) + "px";
      clone.style.top = Math.round(rect.top - imageRect.top) + "px";
      clone.style.width = Math.round(rect.width) + "px";
      clone.style.height = Math.round(rect.height) + "px";
      clone.style.margin = "0";
      clone.style.padding = computed.padding;
      clone.style.display = computed.display;
      clone.style.visibility = "visible";
      clone.style.opacity = "1";

      // Preserve the exact font used by the live element.
      clone.style.fontFamily = computed.fontFamily;
      clone.style.fontSize = computed.fontSize;
      clone.style.fontStyle = computed.fontStyle;
      clone.style.fontWeight = computed.fontWeight;
      clone.style.lineHeight = computed.lineHeight;
      clone.style.letterSpacing = computed.letterSpacing;
      clone.style.textTransform = computed.textTransform;
      clone.style.textAlign = computed.textAlign;
      clone.style.wordBreak = computed.wordBreak;
      clone.style.whiteSpace = computed.whiteSpace;
      clone.style.color = computed.color;

      if (source.id === "mydivheader") {
        clone.style.padding = computed.padding;
      }

      if (source.id === "bottomhr") {
        clone.style.objectFit = "fill";
      }

      exportBox.appendChild(clone);
    });

    document.body.appendChild(exportBox);

    // Force the cloned text to use the same loaded font before rendering.
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

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
