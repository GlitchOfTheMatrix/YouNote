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

// generateBtn.addEventListener("click", () => {
//   // Placeholder: In a real app, this would fetch notes from the YouTube link
//   alert("Generate notes from YouTube link (not implemented)");
// });
generateBtn.addEventListener("click", () => {
  const url = document.getElementById("youtube-link").value.trim();
  if (!url) return alert("Please paste a YouTube link");

  // fetch("https://younote-wfcg.onrender.com", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ url }),
  // })
  //   .then((res) => res.json())
  //   .then((data) => {
  //     if (data.error) return alert(data.error);
  //     notesContent.textContent = data.notes.join("\n\n");
  //   })
  //   .catch((err) => {
  //     console.error(err);
  //     alert("Network or server error");
  //   });
  fetch("https://younote.onrender.com/api/transcript", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  })
    .then(async (res) => {
      const text = await res.text(); // even if it's not JSON
      try {
        const json = JSON.parse(text);
        if (json.error) alert(json.error);
        else notesContent.textContent = json.notes.join("\n\n");
      } catch (err) {
        console.error("❌ Failed to parse JSON. Got:", text);
        alert("Something went wrong. Server may be down.");
      }
    })
    .catch((err) => {
      console.error("❌ Network error:", err);
      alert("Network error: Could not reach backend");
    });
});
