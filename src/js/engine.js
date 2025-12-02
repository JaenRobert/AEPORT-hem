import { triggerNode } from "./ai_core";
const LOOP = ["Ω", "E", "S", "H", "C", "R"];
let i=0, active=false;
export function startLoop(){ if(active) return; active=true; console.log("🜂 ÆSI Loop startad"); loopStep(); }
function loopStep(){ const node=LOOP[i]; triggerNode(node); i=(i+1)%LOOP.length; setTimeout(loopStep,4000); }
