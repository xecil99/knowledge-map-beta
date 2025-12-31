// submit.js
export function initNodeSubmission({ supabase }) {
  const newLabelEl = document.getElementById("newLabel");
  const newDefinitionEl = document.getElementById("newDefinition");
  const submitStatusEl = document.getElementById("submitStatus");
  const submitBtn = document.getElementById("btnSubmitNode");

  if (!submitBtn) return;

  submitBtn.addEventListener("click", async () => {
    const label = newLabelEl.value.trim();
    const definition = newDefinitionEl.value.trim();

    if (!label) {
      submitStatusEl.textContent = "Label required.";
      return;
    }

    submitStatusEl.textContent = "Submitting…";

    const nodeId = label
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-_]/g, "");

    const { error } = await supabase.from("nodes").insert({
      node_id: nodeId,
      label,
      definition,
      strength: 0.5,
      x: null,
      y: null,
      z: null,
    });

    if (error) {
      console.error(error);
      submitStatusEl.textContent = "Error submitting.";
      return;
    }

    submitStatusEl.textContent = "Submitted!";
    newLabelEl.value = "";
    newDefinitionEl.value = "";
  });
}
