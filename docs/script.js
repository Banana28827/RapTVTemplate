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
  const overlay = document.getElementById("overlay-img");

  if (typeof html2canvas === "undefined") {
    alert("The image exporter could not be loaded. Please refresh the page and try again.");
    return;
  }

  button.disabled = true;
  button.textContent = "Saving...";

  let textStage = null;

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

    const imageRect = image.getBoundingClientRect();
    const mydivRect = mydiv.getBoundingClientRect();

    const width = Math.round(imageRect.width);
    const height = Math.round(imageRect.height);

    if (!width || !height) {
      throw new Error("The image area is not available.");
    }

    /*
     * Draw the uploaded background directly onto a canvas.
     * This avoids html2canvas trying to reproduce a CSS background and
     * turning it into the narrow strip seen in the previous exports.
     */
    const backgroundCss = getComputedStyle(image).backgroundImage;
    const match = backgroundCss.match(/^url\(["']?(.*?)["']?\)$/);

    if (!match) {
      throw new Error("No uploaded image is available.");
    }

    const backgroundImage = new Image();
    backgroundImage.src = match[1];

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

    const canvas = document.createElement("canvas");
    canvas.width = width * 2;
    canvas.height = height * 2;

    const ctx = canvas.getContext("2d");
    ctx.scale(2, 2);

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);

    // Reproduce background-size: cover and background-position: center.
    const sourceRatio = backgroundImage.naturalWidth / backgroundImage.naturalHeight;
    const targetRatio = width / height;

    let sx = 0;
    let sy = 0;
    let sw = backgroundImage.naturalWidth;
    let sh = backgroundImage.naturalHeight;

    if (sourceRatio > targetRatio) {
      sw = backgroundImage.naturalHeight * targetRatio;
      sx = (backgroundImage.naturalWidth - sw) / 2;
    } else if (sourceRatio < targetRatio) {
      sh = backgroundImage.naturalWidth / targetRatio;
      sy = (backgroundImage.naturalHeight - sh) / 2;
    }

    ctx.drawImage(
      backgroundImage,
      sx, sy, sw, sh,
      0, 0, width, height
    );

    /*
     * Draw the existing dark fade directly from overlay.png.
     * The live CSS places this image 150px down and flips it vertically.
     */
    if (overlay && overlay.src) {
      const overlayImage = new Image();
      overlayImage.src = overlay.src;

      await new Promise(function (resolve, reject) {
        if (overlayImage.complete && overlayImage.naturalWidth > 0) {
          resolve();
        } else {
          overlayImage.onload = resolve;
          overlayImage.onerror = function () {
            reject(new Error("The overlay image could not be loaded."));
          };
        }
      });

      const overlayStyle = getComputedStyle(overlay);
      const overlayWidth = overlay.getBoundingClientRect().width || width;
      const overlayHeight = overlay.getBoundingClientRect().height || overlayImage.naturalHeight;
      const overlayTop = overlay.offsetTop + parseFloat(overlayStyle.marginTop || "0");

      ctx.save();
      ctx.translate(0, overlayTop + overlayHeight);
      ctx.scale(1, -1);
      ctx.drawImage(overlayImage, 0, 0, overlayWidth, overlayHeight);
      ctx.restore();
    }

    /*
     * Render only the draggable text box with html2canvas.
     * Its position is calculated from the user's CURRENT dragged position,
     * so the editor's drag behavior is untouched.
     */
    textStage = document.createElement("div");
    textStage.style.position = "fixed";
    textStage.style.left = "0px";
    textStage.style.top = "0px";
    textStage.style.width = width + "px";
    textStage.style.height = height + "px";
    textStage.style.overflow = "hidden";
    textStage.style.background = "transparent";
    textStage.style.pointerEvents = "none";
    textStage.style.zIndex = "2147483647";
    document.body.appendChild(textStage);

    const textClone = mydiv.cloneNode(true);
    textClone.removeAttribute("id");
    textClone.style.position = "absolute";
    textClone.style.left = Math.round(mydivRect.left - imageRect.left) + "px";
    textClone.style.top = Math.round(mydivRect.top - imageRect.top) + "px";
    textClone.style.margin = "0";
    textClone.style.zIndex = "10";
    textClone.style.pointerEvents = "none";

    textClone.querySelectorAll("[contenteditable]").forEach(function (el) {
      el.removeAttribute("contenteditable");
    });

    textStage.appendChild(textClone);

    await new Promise(function (resolve) {
      requestAnimationFrame(function () {
        requestAnimationFrame(resolve);
      });
    });

    const textCanvas = await html2canvas(textStage, {
      width: width,
      height: height,
      windowWidth: width,
      windowHeight: height,
      scrollX: 0,
      scrollY: 0,
      scale: 2,
      backgroundColor: null,
      useCORS: true,
      logging: false
    });

    ctx.drawImage(textCanvas, 0, 0);

    const blob = await new Promise(function (resolve, reject) {
      canvas.toBlob(function (result) {
        if (result) {
          resolve(result);
        } else {
          reject(new Error("Could not create the PNG file."));
        }
      }, "image/png");
    });

    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
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
    console.error("Could not save image:", error);
    alert("Could not save the image. Please try again.");
  } finally {
    if (textStage && textStage.parentNode) {
      textStage.parentNode.removeChild(textStage);
    }

    button.disabled = false;
    button.textContent = "Save Image";
  }
});
