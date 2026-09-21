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
  const header = document.getElementById("mydivheader");
  const mainText = document.getElementById("maintext");
  const bottomText = document.getElementById("bottomtext");
  const bottomHr = document.getElementById("bottomhr");

  if (typeof html2canvas === "undefined") {
    alert("The image exporter could not be loaded. Please refresh the page and try again.");
    return;
  }

  button.disabled = true;
  button.textContent = "Saving...";
  let stage = null;

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

    // Export an isolated composition. The editor itself is never moved.
    // This avoids the body-crop/transform problem that left the image on
    // the right side of the saved PNG.
    const imageRect = image.getBoundingClientRect();
    const imageWidth = Math.round(imageRect.width);
    const imageHeight = Math.round(imageRect.height);

    if (!imageWidth || !imageHeight) {
      throw new Error("The image area is not available.");
    }

    const elements = [header, mainText, bottomText, bottomHr];
    const rects = elements.map(function (el) {
      return el.getBoundingClientRect();
    });

    const contentBottom = Math.max.apply(null, [
      imageRect.bottom
    ].concat(rects.map(function (r) { return r.bottom; })));

    const exportHeight = Math.max(
      imageHeight,
      Math.ceil(contentBottom - imageRect.top + 8)
    );

    stage = document.createElement("div");
    stage.style.position = "fixed";
    stage.style.left = "0";
    stage.style.top = "0";
    stage.style.width = imageWidth + "px";
    stage.style.height = exportHeight + "px";
    stage.style.overflow = "hidden";
    stage.style.background = "#000";
    stage.style.pointerEvents = "none";
    stage.style.zIndex = "2147483647";
    document.body.appendChild(stage);

    // Clone the complete image container so its uploaded background and
    // bottom fade/overlay stay together.
    const imageClone = image.cloneNode(true);
    imageClone.removeAttribute("id");
    imageClone.style.position = "absolute";
    imageClone.style.left = "0px";
    imageClone.style.top = "0px";
    imageClone.style.width = imageWidth + "px";
    imageClone.style.height = imageHeight + "px";
    imageClone.style.margin = "0";
    imageClone.style.border = "0";
    imageClone.style.transform = "none";
    imageClone.style.backgroundPosition = getComputedStyle(image).backgroundPosition;
    imageClone.style.backgroundSize = getComputedStyle(image).backgroundSize;
    imageClone.style.backgroundRepeat = getComputedStyle(image).backgroundRepeat;
    stage.appendChild(imageClone);

    // Copy each draggable element at its current screen position relative
    // to the artwork. Dragging #mydiv therefore remains fully supported.
    elements.forEach(function (source) {
      const sourceRect = source.getBoundingClientRect();
      const clone = source.cloneNode(true);
      const computed = getComputedStyle(source);

      clone.removeAttribute("id");
      clone.style.position = "absolute";
      clone.style.left = Math.round(sourceRect.left - imageRect.left) + "px";
      clone.style.top = Math.round(sourceRect.top - imageRect.top) + "px";
      clone.style.width = Math.round(sourceRect.width) + "px";
      clone.style.height = Math.round(sourceRect.height) + "px";
      clone.style.margin = "0";
      clone.style.boxSizing = "border-box";
      clone.style.transform = computed.transform;
      clone.style.transformOrigin = computed.transformOrigin;
      clone.style.zIndex = "10";
      clone.style.pointerEvents = "none";

      clone.querySelectorAll("[contenteditable]").forEach(function (el) {
        el.removeAttribute("contenteditable");
      });

      stage.appendChild(clone);
    });

    await new Promise(function (resolve) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          resolve();
        });
      });
    });

    const canvas = await html2canvas(stage, {
      width: imageWidth,
      height: exportHeight,
      windowWidth: Math.max(window.innerWidth, imageWidth),
      windowHeight: Math.max(window.innerHeight, exportHeight),
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

    const link = document.createElement("a");
    const objectUrl = URL.createObjectURL(blob);
    link.download = "raptv-post.png";
    link.href = objectUrl;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(function () {
      URL.revokeObjectURL(objectUrl);
    }, 3000);
  } catch (error) {
    if (error && error.name !== "AbortError") {
      console.error("Could not save image:", error);
      alert("Could not save the image. Please try again.");
    }
  } finally {
    if (stage && stage.parentNode) {
      stage.parentNode.removeChild(stage);
    }
    button.disabled = false;
    button.textContent = "Save Image";
  }
});
