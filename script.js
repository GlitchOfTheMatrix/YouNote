// Copy notes to clipboard
const copyBtn = document.getElementById("copy-btn");
const exportBtn = document.getElementById("export-btn");
const clearBtn = document.getElementById("clear-btn");
const askBtn = document.getElementById("ask-btn");
const notesContent = document.getElementById("notes-content");
const askInput = document.getElementById("ask-input");
const generateBtn = document.getElementById("generate-btn");

copyBtn.addEventListener("click", () => {
  const text = notesContent.textContent;
  navigator.clipboard.writeText(text);
});

exportBtn.addEventListener("click", () => {
  const text = notesContent.textContent;
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "notes.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

clearBtn.addEventListener("click", () => {
  notesContent.textContent = "";
});

askBtn.addEventListener("click", () => {
  const question = askInput.value.trim();
  if (question) {
    notesContent.textContent +=
      (notesContent.textContent ? "\n" : "") + "Q: " + question;
    askInput.value = "";
  }
});

generateBtn.addEventListener("click", () => {
  // Placeholder: In a real app, this would fetch notes from the YouTube link
  alert("Generate notes from YouTube link (not implemented)");
});
