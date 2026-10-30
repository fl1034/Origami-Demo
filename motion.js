'use strict';
// A bounded solve session, not a claim of physical convergence.
function createMotionController(engine, onState) {
  const initial = engine.model.getPositionsArray();
  let previous = null, quiet = 0, frames = 0, target = 0, disposed = false;
  let baseRadius = 1, active = false;
  function sample() {
    const a = engine.model.getPositionsArray();
    if (!a?.length || engine.gpuMath.isContextLost() || engine.threeView.renderer.getContext().isContextLost())
      throw Error('The graphics context was lost. Reset this model to recover.');
    const center = [0, 0, 0], n = a.length / 3;
    for (let i = 0; i < a.length; i++) {
      if (!Number.isFinite(a[i])) throw Error('The fold became unstable. Reset or try a lower target.');
      center[i % 3] += a[i] / n;
    }
    let radius = 0, displacement = 0;
    const centered = new Float32Array(a.length);
    for (let i = 0; i < a.length; i += 3) {
      for (let k = 0; k < 3; k++) centered[i + k] = a[i + k] - center[k];
      radius = Math.max(radius, Math.hypot(centered[i], centered[i+1], centered[i+2]));
      if (previous) displacement = Math.max(displacement, Math.hypot(centered[i]-previous[i], centered[i+1]-previous[i+1], centered[i+2]-previous[i+2]));
    }
    if (radius > baseRadius * 3 || Math.hypot(...center) > baseRadius * 5)
      throw Error('The fold became unstable. Reset or try a lower target.');
    // Keep the paper's center in view without altering the simulated geometry.
    engine.threeView.modelWrapper.position.set(-center[0], -center[1], -center[2]);
    engine.model.getGeometry().computeBoundingSphere();
    previous = centered;
    return { radius, displacement };
  }
  if (!initial?.length) throw Error('No paper geometry was loaded.');
  baseRadius = Math.max(0.1, sample().radius);
  function actual(value) { engine.setCreasePercent(value / 100); engine.shouldChangeCreasePercent = true; }
  function pause(message = 'Paused') {
    active = false;
    engine.model.pause();
    if (!disposed) onState(false, message, target);
  }
  function fail(error) {
    pause(error.message);
    if (!engine.gpuMath.isContextLost()) {
      engine.model.reset(); actual(0); target = 0; previous = null;
      try { sample(); } catch (_) {}
      onState(false, 'Fold reset to flat after instability. Try a lower target.', target);
    }
  }
  function moveTo(value) {
    target = Math.max(0, Math.min(100, Number(value)));
    if (!Number.isFinite(target) || disposed) return;
    frames = quiet = 0; previous = null; active = true;
    engine.model.resume(); onState(true, 'Folding…', target);
  }
  engine.beforeModelStep = () => {
    if (!active || disposed) return;
    try {
      sample();
      const now = engine.creasePercent * 100;
      actual(now + Math.max(-2.5, Math.min(2.5, target - now)));
    } catch (error) { fail(error); }
  };
  engine.afterModelStep = () => {
    if (!active || disposed) return;
    try {
      const { displacement } = sample(); frames++;
      quiet = displacement < baseRadius * 0.00015 ? quiet + 1 : 0;
      if (Math.abs(engine.creasePercent * 100 - target) < 0.001 && ((quiet >= 8 && frames >= 20) || frames >= 120))
        pause('Held at ' + target + '%');
    } catch (error) { fail(error); }
  };
  // beforeModelStep must not consume the preceding frame used by afterModelStep.
  const checkBefore = engine.beforeModelStep;
  engine.beforeModelStep = () => { const saved = previous; checkBefore(); previous = saved; };
  engine.onSimulationError = fail;
  const canvas = engine.threeView.renderer.domElement;
  const lost = () => { if (!disposed) pause('Graphics context lost. Reset this model to recover.'); };
  canvas.addEventListener('webglcontextlost', lost);
  return {
    moveTo, pause,
    async prepare(value, signal) {
      engine.model.pause(); engine.model.reset(); actual(0); previous = null;
      target = value;
      // Prepare the replacement offscreen from a flat, zero-velocity state.
      for (let i = 0; i < 30; i++) {
        if (signal.aborted) throw new DOMException('Superseded', 'AbortError');
        actual(value * Math.min(1, (i+1) / 10));
        engine.model.step(40); sample();
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      pause('Held at ' + value + '%');
    },
    dispose() { disposed = true; active = false; engine.model.pause(); engine.beforeModelStep = engine.afterModelStep = engine.onSimulationError = null; canvas.removeEventListener('webglcontextlost', lost); }
  };
}
