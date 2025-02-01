// Local state to update button text in the popup.
let isEditorActive = false;

document.getElementById("toggle").addEventListener("click", () => {
  // Query the active tab.
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0]) return;
    
    // Inject the toggleEditor function into the active tab.
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: toggleEditor
    }, () => {
      // Toggle local state to update the button text.
      isEditorActive = !isEditorActive;
      document.getElementById("toggle").textContent = isEditorActive 
        ? "Deactivate Editor" 
        : "Activate Editor";
    });
  });
});

/**
 * This function is injected into the active page.
 * It toggles the editor mode: if not active, it attaches an event listener on the document
 * that handles clicks on text and image elements. If already active, it removes the event listener.
 */
function toggleEditor() {
  // Check if editor mode is active on the page.
  if (window.__editorActive) {
    // Remove the click event listener.
    document.removeEventListener("click", window.__editorClickHandler, true);
    window.__editorActive = false;
    console.log("Editor mode deactivated.");
  } else {
    // Define the event handler that intercepts all clicks.
    window.__editorClickHandler = function(e) {
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
  }
  
  // --- Helper Functions ---
  
  // Makes a text element editable until it loses focus.
  function handleTextClick(element) {
    // Avoid reactivating if already editing.
    if (element.isContentEditable) return;
  
    element.contentEditable = "true";
    element.focus();
  
    const disableEditing = () => {
      element.contentEditable = "false";
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
      reader.onload = function(evt) {
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
