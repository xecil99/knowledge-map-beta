// submit.js
function makeIdFromLabel(label) {
  return label
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");
}

export function initNodeSubmission({ supabase }) {
  const newLabelEl = document.getElementById("newLabel");
  const newDefinitionEl = document.getElementById("newDefinition");
  const submitStatusEl = document.getElementById("submitStatus");
  const submitBtn = document.getElementById("btnSubmitNode");

  if (!submitBtn) return;

  function setEnabled(isSignedIn) {
    submitBtn.disabled = !isSignedIn;
    if (!isSignedIn) {
      submitStatusEl.textContent = "Sign in to submit.";
    } else {
      submitStatusEl.textContent = "";
    }
  }

  // initial + updates
  supabase.auth.getUser().then(({ data }) => setEnabled(!!data?.user));
  supabase.auth.onAuthStateChange((_event, session) =>
    setEnabled(!!session?.user)
  );

  submitBtn.addEventListener("click", async () => {
    const { data } = await supabase.auth.getUser();
    const user = data?.user;

    if (!user) {
      submitStatusEl.textContent = "Sign in to submit.";
      return;
    }

    const label = newLabelEl.value.trim();
    const definition = newDefinitionEl.value.trim();

    if (!label) {
      submitStatusEl.textContent = "Label required.";
      return;
    }

    const nodeId = makeIdFromLabel(label);
    if (!nodeId) {
      submitStatusEl.textContent = "Invalid label.";
      return;
    }

    submitStatusEl.textContent = "Submitting…";

    const { error } = await supabase.from("nodes").insert({
      node_id: nodeId,
      label,
      definition,
      strength: 0.5,
      x: null,
      y: null,
      z: null,
      owner_user_id: user.id, // will be ignored if column doesn't exist (next step will add it)
    });

    if (error) {
      console.error(error);
      submitStatusEl.textContent = "Error submitting.";
      return;
    }

    submitStatusEl.textContent = "Submitted!";
    newLabelEl.value = "";
    newDefinitionEl.value = "";
    location.reload();
  });
}
