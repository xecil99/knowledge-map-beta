// interaction.js
// Handles pointer input for selecting nodes without interfering with OrbitControls.

export function installSelectionPicking({
  domElement,
  camera,
  raycaster,
  mouse,
  nodeMeshes,
  selectNode,
}) {
  let downX = 0;
  let downY = 0;
  let down = false;

  domElement.addEventListener("pointerdown", (e) => {
    down = true;
    downX = e.clientX;
    downY = e.clientY;
  });

  domElement.addEventListener("pointerup", (e) => {
    if (!down) return;
    down = false;

    const dx = e.clientX - downX;
    const dy = e.clientY - downY;
    if (Math.hypot(dx, dy) > 4) return; // treat as drag

    const rect = domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(nodeMeshes);
    if (!hits.length) return;

    selectNode(hits[0].object.userData.id, false);
  });
}
