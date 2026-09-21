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

    /*
     * Export exactly what the editor shows:
     *
     * - The export frame is the actual 432x540 #display-image.
     * - A clone of #display-image keeps its background image and the
     *   dark bottom fade (#overlay-img) together.
     * - A clone of #mydiv is placed using its CURRENT screen coordinates
     *   relative to the image.
     *
     * Nothing in the live editor is moved, so the user can still drag the
     * entire text box normally.
     */
    const imageRect = image.getBoundingClientRect();
    const mydivRect = mydiv.getBoundingClientRect();

    const width = Math.round(imageRect.width);
    const height = Math.round(imageRect.height);

    if (!width || !height) {
      throw new Error("The image area is not available.");
    }

    stage = document.createElement("div");
    stage.style.position = "fixed";
    stage.style.left = "0px";
    stage.style.top = "0px";
    stage.style.width = width + "px";
    stage.style.height = height + "px";
    stage.style.overflow = "hidden";
    stage.style.background = "#000";
    stage.style.margin = "0";
    stage.style.padding = "0";
    stage.style.border = "0";
    stage.style.pointerEvents = "none";
    stage.style.zIndex = "2147483647";

    document.body.appendChild(stage);

    // Clone the complete image container. This preserves its CSS background,
    // background-size/position, and the dark fade overlay inside it.
    const imageClone = image.cloneNode(true);
    imageClone.removeAttribute("id");
    imageClone.style.position = "absolute";
    imageClone.style.left = "0px";
    imageClone.style.top = "0px";
    imageClone.style.width = width + "px";
    imageClone.style.height = height + "px";
    imageClone.style.margin = "0";
    imageClone.style.border = "0";
    imageClone.style.transform = "none";
    imageClone.style.boxSizing = "border-box";
    imageClone.style.backgroundSize = getComputedStyle(image).backgroundSize;
    imageClone.style.backgroundPosition = getComputedStyle(image).backgroundPosition;
    imageClone.style.backgroundRepeat = getComputedStyle(image).backgroundRepeat;
    imageClone.style.overflow = "hidden";

    stage.appendChild(imageClone);

    /*
     * Clone the WHOLE draggable box rather than rebuilding its children.
     * That preserves the exact relationship between NEWS, headline,
     * subheadline, and divider that the user sees on screen.
     */
    const textClone = mydiv.cloneNode(true);
    textClone.removeAttribute("id");
    textClone.style.position = "absolute";
    textClone.style.left = Math.round(mydivRect.left - imageRect.left) + "px";
    textClone.style.top = Math.round(mydivRect.top - imageRect.top) + "px";
    textClone.style.width = getComputedStyle(mydiv).width;
    textClone.style.height = getComputedStyle(mydiv).height;
    textClone.style.margin = "0";
    textClone.style.padding = getComputedStyle(mydiv).padding;
    textClone.style.border = "0";
    textClone.style.background = "transparent";
    textClone.style.zIndex = "20";
    textClone.style.pointerEvents = "none";

    textClone.querySelectorAll("[contenteditable]").forEach(function (el) {
      el.removeAttribute("contenteditable");
    });

    stage.appendChild(textClone);

    await new Promise(function (resolve) {
      requestAnimationFrame(function () {
        requestAnimationFrame(resolve);
      });
    });

    const canvas = await html2canvas(stage, {
      width: width,
      height: height,
      windowWidth: width,
      windowHeight: height,
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
