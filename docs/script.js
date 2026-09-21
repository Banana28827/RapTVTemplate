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
  const overlayImage = document.getElementById("overlay-img");

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
     * Build the export from the same visual pieces the user sees.
     *
     * #display-image is the 432x540 artwork.
     * #overlay-img supplies the dark bottom fade.
     * #mydiv contains the draggable NEWS/headline/subheadline/divider.
     *
     * We position every piece using its CURRENT screen position relative
     * to the artwork. Therefore dragging #mydiv still works exactly as
     * before; the exporter simply records where the user left it.
     */
    const imageRect = image.getBoundingClientRect();
    const exportWidth = Math.round(imageRect.width);
    const exportHeight = Math.round(imageRect.height);

    if (!exportWidth || !exportHeight) {
      throw new Error("The image area is not available.");
    }

    const background = getComputedStyle(image).backgroundImage;
    const match = background.match(/^url\\(["']?(.*?)["']?\\)$/);

    if (!match) {
      throw new Error("No uploaded image is available to export.");
    }

    exportStage = document.createElement("div");
    exportStage.id = "raptv-export-stage";
    exportStage.style.position = "fixed";
    exportStage.style.left = "0px";
    exportStage.style.top = "0px";
    exportStage.style.width = exportWidth + "px";
    exportStage.style.height = exportHeight + "px";
    exportStage.style.overflow = "hidden";
    exportStage.style.background = "#000";
    exportStage.style.pointerEvents = "none";
    exportStage.style.zIndex = "2147483647";
    document.body.appendChild(exportStage);

    // Use a real image for the uploaded background. This avoids html2canvas
    // misplacing a CSS background when the page is cropped.
    const backgroundImage = document.createElement("img");
    backgroundImage.src = match[1];
    backgroundImage.style.position = "absolute";
    backgroundImage.style.left = "0";
    backgroundImage.style.top = "0";
    backgroundImage.style.width = exportWidth + "px";
    backgroundImage.style.height = exportHeight + "px";
    backgroundImage.style.objectFit = "cover";
    backgroundImage.style.objectPosition = getComputedStyle(image).backgroundPosition;
    backgroundImage.style.display = "block";
    exportStage.appendChild(backgroundImage);

    await new Promise(function (resolve, reject) {
      if (backgroundImage.complete && backgroundImage.naturalWidth > 0) {
        resolve();
      } else {
        backgroundImage.onload = resolve;
        backgroundImage.onerror = function () {
          reject(new Error("The uploaded image could not be loaded."));
        };
      }
    });

    /*
     * Reproduce the existing bottom fade/overlay exactly where it appears
     * inside #display-image, including its vertical flip and margin offset.
     */
    if (overlayImage) {
      const overlayRect = overlayImage.getBoundingClientRect();
      const overlayStyle = getComputedStyle(overlayImage);
      const overlayClone = overlayImage.cloneNode(true);

      overlayClone.style.position = "absolute";
      overlayClone.style.left = Math.round(overlayRect.left - imageRect.left) + "px";
      overlayClone.style.top = Math.round(overlayRect.top - imageRect.top) + "px";
      overlayClone.style.width = Math.round(overlayRect.width) + "px";
      overlayClone.style.height = Math.round(overlayRect.height) + "px";
      overlayClone.style.margin = "0";
      overlayClone.style.transform = overlayStyle.transform;
      overlayClone.style.transformOrigin = overlayStyle.transformOrigin;
      overlayClone.style.display = "block";
      overlayClone.style.zIndex = "2";

      exportStage.appendChild(overlayClone);

      await new Promise(function (resolve, reject) {
        if (overlayClone.complete && overlayClone.naturalWidth > 0) {
          resolve();
        } else {
          overlayClone.onload = resolve;
          overlayClone.onerror = function () {
            reject(new Error("The overlay image could not be loaded."));
          };
        }
      });
    }

    /*
     * Copy the four visible pieces of the draggable box separately.
     * This is important: cloning #mydiv itself causes its Bootstrap/container
     * layout to be recalculated and is what made the exported text become
     * detached from the user's actual positioning.
     */
    const pieces = [header, mainText, bottomText, bottomHr];

    pieces.forEach(function (source) {
      const sourceRect = source.getBoundingClientRect();
      const clone = source.cloneNode(true);

      clone.style.position = "absolute";
      clone.style.left = Math.round(sourceRect.left - imageRect.left) + "px";
      clone.style.top = Math.round(sourceRect.top - imageRect.top) + "px";
      clone.style.width = Math.round(sourceRect.width) + "px";
      clone.style.height = Math.round(sourceRect.height) + "px";
      clone.style.margin = "0";
      clone.style.boxSizing = "border-box";
      clone.style.transform = getComputedStyle(source).transform;
      clone.style.transformOrigin = getComputedStyle(source).transformOrigin;
      clone.style.zIndex = "10";
      clone.style.pointerEvents = "none";

      clone.querySelectorAll("[contenteditable]").forEach(function (el) {
        el.removeAttribute("contenteditable");
      });

      exportStage.appendChild(clone);
    });

    await new Promise(function (resolve) {
      requestAnimationFrame(function () {
        requestAnimationFrame(resolve);
      });
    });

    const canvas = await html2canvas(exportStage, {
      width: exportWidth,
      height: exportHeight,
      windowWidth: Math.max(window.innerWidth, exportWidth),
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
