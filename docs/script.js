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
  const imageElement = document.getElementById("display-image");
  const mydiv = document.getElementById("mydiv");

  if (typeof html2canvas === "undefined") {
    alert("The image exporter could not be loaded. Please refresh the page and try again.");
    return;
  }

  button.disabled = true;
  button.textContent = "Saving...";

  let overlayStage = null;

  try {
    if (document.fonts) {
      await document.fonts.load('50px "Steelfishy"');
      await document.fonts.ready;
    }

    const width = 432;
    const height = 540;

    // Read the uploaded image from the editor, but NEVER ask html2canvas to
    // render the CSS background. Draw it directly with a native canvas.
    const background = getComputedStyle(imageElement).backgroundImage;
    const match = background.match(/^url\\(["']?(.*?)["']?\\)$/);
    if (!match) throw new Error("No uploaded image is available to export.");

    const uploadedImage = new Image();
    uploadedImage.src = match[1];

    await new Promise(function (resolve, reject) {
      if (uploadedImage.complete && uploadedImage.naturalWidth > 0) {
        resolve();
        return;
      }
      uploadedImage.onload = resolve;
      uploadedImage.onerror = function () {
        reject(new Error("The uploaded image could not be loaded."));
      };
    });

    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = width * 2;
    finalCanvas.height = height * 2;
    const ctx = finalCanvas.getContext("2d");
    ctx.scale(2, 2);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);

    // Reproduce background-size: cover / background-position: center.
    const sourceRatio = uploadedImage.naturalWidth / uploadedImage.naturalHeight;
    const targetRatio = width / height;
    let sx = 0, sy = 0;
    let sw = uploadedImage.naturalWidth, sh = uploadedImage.naturalHeight;

    if (sourceRatio > targetRatio) {
      sw = uploadedImage.naturalHeight * targetRatio;
      sx = (uploadedImage.naturalWidth - sw) / 2;
    } else if (sourceRatio < targetRatio) {
      sh = uploadedImage.naturalWidth / targetRatio;
      sy = (uploadedImage.naturalHeight - sh) / 2;
    }

    ctx.drawImage(uploadedImage, sx, sy, sw, sh, 0, 0, width, height);

    // Render only the draggable overlay with html2canvas.
    overlayStage = document.createElement("div");
    overlayStage.style.position = "fixed";
    overlayStage.style.left = "0px";
    overlayStage.style.top = "0px";
    overlayStage.style.width = width + "px";
    overlayStage.style.height = height + "px";
    overlayStage.style.overflow = "hidden";
    overlayStage.style.background = "transparent";
    overlayStage.style.zIndex = "2147483647";
    overlayStage.style.pointerEvents = "none";
    document.body.appendChild(overlayStage);

    const header = document.getElementById("mydivheader");
    const mainText = document.getElementById("maintext");
    const bottomText = document.getElementById("bottomtext");
    const bottomHr = document.getElementById("bottomhr");

    const rects = [
      header.getBoundingClientRect(),
      mainText.getBoundingClientRect(),
      bottomText.getBoundingClientRect(),
      bottomHr.getBoundingClientRect()
    ];

    const overlayTop = Math.min.apply(null, rects.map(function (r) { return r.top; }));
    const overlayBottom = Math.max.apply(null, rects.map(function (r) { return r.bottom; }));
    const overlayHeight = Math.ceil(overlayBottom - overlayTop + 8);

    const clone = mydiv.cloneNode(true);
    clone.style.position = "absolute";
    clone.style.left = "0px";
    clone.style.top = Math.max(0, height - overlayHeight) + "px";
    clone.style.width = width + "px";
    clone.style.height = overlayHeight + "px";
    clone.style.margin = "0";
    clone.style.padding = "0";
    clone.style.background = "transparent";
    clone.style.border = "0";
    clone.style.pointerEvents = "none";

    clone.querySelectorAll("[contenteditable]").forEach(function (el) {
      el.removeAttribute("contenteditable");
    });

    overlayStage.appendChild(clone);

    await new Promise(function (resolve) {
      requestAnimationFrame(function () {
        requestAnimationFrame(resolve);
      });
    });

    const overlayCanvas = await html2canvas(overlayStage, {
      width: width,
      height: height,
      windowWidth: Math.max(window.innerWidth, width),
      windowHeight: Math.max(window.innerHeight, height),
      scrollX: 0,
      scrollY: 0,
      scale: 2,
      backgroundColor: null,
      useCORS: true,
      logging: false
    });

    ctx.drawImage(overlayCanvas, 0, 0);

    const blob = await new Promise(function (resolve, reject) {
      finalCanvas.toBlob(function (result) {
        if (result) resolve(result);
        else reject(new Error("Could not create the PNG file."));
      }, "image/png");
    });

    const file = new File([blob], "raptv-post.png", { type: "image/png" });

    if ("showSaveFilePicker" in window) {
      const handle = await window.showSaveFilePicker({
        suggestedName: "raptv-post.png",
        types: [{ description: "PNG image", accept: { "image/png": [".png"] } }]
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
      setTimeout(function () { URL.revokeObjectURL(link.href); }, 1000);
    }
  } catch (error) {
    if (error && error.name !== "AbortError") {
      console.error("Could not save image:", error);
      alert("Could not save the image. Please try again.");
    }
  } finally {
    if (overlayStage && overlayStage.parentNode) {
      overlayStage.parentNode.removeChild(overlayStage);
    }
    button.disabled = false;
    button.textContent = "Save Image";
  }
});
