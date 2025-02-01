// Listen for toggle state changes.
document.getElementById("editorToggle").addEventListener("change", function () {
  const isActive = this.checked;
  // Update the label accordingly.
  document.getElementById("toggleText").textContent = isActive ? "Deactivate Editor" : "Activate Editor";
  
  // Query the active tab.
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0]) return;
    
    // Inject our toggleEditor function into the active tab.
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: toggleEditor,
      args: [isActive]  // Pass the desired state to the function.
    });
  });
});

/**
 * This function is injected into the active page.
 * It either activates or deactivates editor mode.
 * @param {boolean} shouldActivate - true to activate, false to deactivate.
 */
function toggleEditor(shouldActivate) {
  // If shouldActivate is true, attach the click listener; if false, remove it.
  if (shouldActivate) {
    // If already activated, do nothing.
    if (window.__editorActive) return;
    
    // Define and store the click handler function.
    window.__editorClickHandler = function (e) {
      // Stop propagation so the page’s own click events aren’t triggered.
      e.stopPropagation();
      e.preventDefault();
  
      const target = e.target;
      const tag = target.tagName.toLowerCase();
  
      if (tag === "img") {
        handleImageClick(target);
      } else {
        handleTextClick(target);
      }
    };
  
    // Attach the event handler in the capture phase.
    document.addEventListener("click", window.__editorClickHandler, true);
    window.__editorActive = true;
    console.log("Editor mode activated.");
  } else {
    // Remove the event listener if it exists.
    if (window.__editorActive && window.__editorClickHandler) {
      document.removeEventListener("click", window.__editorClickHandler, true);
      window.__editorActive = false;
      console.log("Editor mode deactivated.");
    }
  }
  
  // --- Helper Functions ---
  
  // Makes a text element editable until it loses focus, while preserving its layout.
  function handleTextClick(element) {
    // Avoid reactivating if already editing.
    if (element.isContentEditable) return;
  
    // Fix the layout to avoid jumps:
    // Save the original display style.
    const originalDisplay = element.style.display;
    // Force the element to be inline-block.
    element.style.display = "inline-block";
    // Set a minimum width based on its current width.
    element.style.minWidth = element.offsetWidth + "px";
  
    element.contentEditable = "true";
    element.focus();
  
    const disableEditing = () => {
      element.contentEditable = "false";
      // Optionally restore the original display style.
      element.style.display = originalDisplay;
      // (You might also want to remove the minWidth style if desired.)
      element.removeEventListener("blur", disableEditing);
      console.log("Text edited to:", element.innerText);
    };
    element.addEventListener("blur", disableEditing);
  }
  
  // Opens a file dialog to choose an image and replaces the clicked image.
  function handleImageClick(imgElement) {
    // Create a hidden file input element.
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.style.display = "none";
  
    fileInput.addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (evt) {
        imgElement.src = evt.target.result;
        console.log("Image replaced.");
      };
      reader.readAsDataURL(file);
    });
  
    // Append the file input, trigger the file dialog, and remove the input.
    document.body.appendChild(fileInput);
    fileInput.click();
    setTimeout(() => document.body.removeChild(fileInput), 1000);
  }
}
