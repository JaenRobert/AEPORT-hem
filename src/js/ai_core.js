import { askPulse } from "./pulse_api";
export function triggerNode(node){
  console.log("→ Puls:", node);
  askPulse("Puls från nod " + node).then(reply => console.log("← Svar:", reply));
}