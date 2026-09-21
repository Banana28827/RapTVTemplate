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
    // The draggable text container itself has height: 0, so use its visible
    // children when calculating the actual area that needs to be exported.
    const elements = [
      image,
      document.getElementById("mydivheader"),
      document.getElementById("maintext"),
      document.getElementById("bottomtext"),
      document.getElementById("bottomhr")
    ].filter(Boolean);

    const rects = elements.map(function (el) {
      const r = el.getBoundingClientRect();
      return {
        left: r.left + window.scrollX,
        top: r.top + window.scrollY,
        right: r.right + window.scrollX,
        bottom: r.bottom + window.scrollY
      };
    });

    const padding = 6;
    const left = Math.max(0, Math.floor(Math.min.apply(null, rects.map(r => r.left)) - padding));
    const top = Math.max(0, Math.floor(Math.min.apply(null, rects.map(r => r.top)) - padding));
    const right = Math.ceil(Math.max.apply(null, rects.map(r => r.right)) + padding);
    const bottom = Math.ceil(Math.max.apply(null, rects.map(r => r.bottom)) + padding);

    const pageWidth = Math.max(document.documentElement.scrollWidth, window.innerWidth);
    const pageHeight = Math.max(document.documentElement.scrollHeight, window.innerHeight);

    // Render the whole document first. This avoids html2canvas interpreting
    // x/y relative to the wrong viewport when the page is scrolled.
    const fullCanvas = await html2canvas(document.body, {
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
      scale: 2,
      backgroundColor: "#000000",
      useCORS: true,
      logging: false,
      windowWidth: pageWidth,
      windowHeight: pageHeight,
      scrollX: 0,
      scrollY: 0,
      ignoreElements: function (el) {
        return el.id === "save-image";
      }
    });

    const scale = fullCanvas.width / pageWidth;
    const cropX = Math.max(0, Math.round(left * scale));
    const cropY = Math.max(0, Math.round(top * scale));
    const cropWidth = Math.min(fullCanvas.width - cropX, Math.round((right - left) * scale));
    const cropHeight = Math.min(fullCanvas.height - cropY, Math.round((bottom - top) * scale));

    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = cropWidth;
    outputCanvas.height = cropHeight;

    const ctx = outputCanvas.getContext("2d");
    ctx.drawImage(
      fullCanvas,
      cropX, cropY, cropWidth, cropHeight,
      0, 0, cropWidth, cropHeight
    );

    const blob = await new Promise(function (resolve, reject) {
      outputCanvas.toBlob(function (result) {
        if (result) {
          resolve(result);
        } else {
          reject(new Error("Could not create the PNG file."));
        }
      }, "image/png");
    });

    const file = new File([blob], "raptv-post.png", { type: "image/png" });

    // Use the browser's native save dialog when supported.
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
      // On mobile browsers, use the native Android/iOS share sheet.
      await navigator.share({
        files: [file],
        title: "RAP TV Post",
        text: "Save your generated RAP TV post"
      });
    } else {
      // Final fallback for browsers without a native save dialog/share sheet.
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
    // Canceling the native save/share dialog is not an error.
    if (error && error.name !== "AbortError") {
      console.error("Could not save image:", error);
      alert("Could not save the image. Please try again.");
    }
  } finally {
    button.disabled = false;
    button.textContent = "Save Image";
  }
});
