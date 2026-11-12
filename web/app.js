import {createClient} from 'genlayer-js';
import {studionet} from 'genlayer-js/chains';

const client = createClient({chain: studionet});
const address = '0x751a83a77A0BF05a72F535d93Db8a176CDB60f2A';
const id = (name) => document.getElementById(name);
const status = (value) => { id('status').textContent = value; };
const hex = (bytes) => Array.from(bytes, byte => byte.toString(16).padStart(2,'0')).join('');
const methods = {
  open_case: [['tenant','Tenant account'],['currency','Currency','USD'],['items_json','Items JSON (minor units)','[{"name":"Fixture","cents":8500}]'],['evidence_seconds','Evidence seconds','3600'],['response_seconds','Response seconds','3600']],
  add_record: [['item_index','Item index (zero-based)','0'],['kind','inventory, move_in, move_out, invoice or response'],['excerpt','Redacted excerpt'],['source_digest','SHA-256 digest'],['responds_to','Opposing record ID (0 for evidence)','0']],
  endorse_inventory: [['record_id','Inventory record ID','1']],
  close_phase: [],
  review: [],
};
const numeric = new Set(['item_index','responds_to','record_id','evidence_seconds','response_seconds']);
function fields() {
  id('arguments').hidden = true;
  id('fields').replaceChildren();
  for (const [name, description, initial = ''] of methods[id('method').value]) {
    const label = document.createElement('label');
    label.textContent = description;
    const input = document.createElement(name === 'items_json' || name === 'excerpt' ? 'textarea' : 'input');
    input.name = name;
    input.value = initial;
    input.required = true;
    if (numeric.has(name)) { input.type = 'number'; input.min = '0'; }
    if (name === 'tenant') input.pattern = '0x[a-fA-F0-9]{40}';
    if (name === 'source_digest') input.pattern = '[a-f0-9]{64}';
    label.append(input);
    id('fields').append(label);
  }
  if (id('method').value === 'add_record') {
    const label = document.createElement('label');
    label.textContent = 'Compute SHA-256 locally from a file';
    const input = document.createElement('input');
    input.type = 'file';
    input.addEventListener('change', async () => {
      try {
        if (!input.files[0]) return;
        const digest = await crypto.subtle.digest('SHA-256', await input.files[0].arrayBuffer());
        id('actions').elements.source_digest.value = hex(new Uint8Array(digest));
      } catch (error) { status(error.message); }
    });
    label.append(input);
    id('fields').append(label);
  }
}
for (const method of Object.keys(methods)) id('method').append(new Option(method,method));
id('method').addEventListener('change', fields);
fields();
function caseId() {
  const value = id('case').value.trim();
  if (!/^[a-f0-9]{64}$/.test(value)) throw Error('Enter a 64-character lowercase hexadecimal case ID.');
  return value;
}
id('generate').onclick = () => { id('case').value = hex(crypto.getRandomValues(new Uint8Array(32))); };
id('actions').onsubmit = event => {
  event.preventDefault();
  try {
    const method = id('method').value;
    const args = {case_id:caseId()};
    for (const [name] of methods[method]) {
      const value = event.currentTarget.elements[name].value;
      args[name] = numeric.has(name) ? Number(value) : value;
    }
    id('arguments').textContent = JSON.stringify({method,args},null,2);
    id('arguments').hidden = false;
  } catch(error) { status(error.message); }
};
async function readCase() {
  const raw = await client.readContract({address,functionName:'get_case',args:[caseId()]});
  const data = JSON.parse(raw);
  const title = document.createElement('h3');
  title.textContent = 'Case phase · ' + data.phase;
  const body = document.createElement('pre');
  body.textContent = JSON.stringify(data,null,2);
  id('result').replaceChildren(title,body);
}
id('read').onclick = async event => {
  const button = event.currentTarget;
  button.disabled = true;
  try { status('Reading StudioNet…'); await readCase(); status('Case loaded.'); }
  catch(error) { id('result').replaceChildren(); status(error.message); }
  finally { button.disabled = false; }
};
id('tracking').onsubmit = async event => {
  event.preventDefault();
  const button = event.submitter;
  button.disabled = true;
  const hash = id('hash').value;
  const link = document.createElement('a');
  link.href = 'https://explorer-studio.genlayer.com/tx/' + hash;
  link.textContent = hash;
  try {
    for (let attempt = 0; attempt < 25; attempt++) {
      let receipt;
      try { receipt = await client.getTransaction({hash}); } catch { /* The transaction may not be indexed yet. */ }
      const state = receipt?.statusName ?? 'Awaiting StudioNet';
      status(state + ' · ');
      id('status').append(link);
      if (state === 'FINALIZED') {
        const leader = receipt.consensus_data?.leader_receipt;
        const studioExecution = (Array.isArray(leader) ? leader[0] : leader)?.execution_result;
        const execution = receipt.txExecutionResultName ?? receipt.txExecutionResult ?? studioExecution;
        status((execution === 'SUCCESS' || execution === 'FINISHED_WITH_RETURN' || execution === 1 ? 'Finalized successfully' : 'Finalized with execution result ' + (execution ?? 'unknown')) + ' · ');
        id('status').append(link);
        return;
      }
      if (['CANCELED','UNDETERMINED','VALIDATORS_TIMEOUT','LEADER_TIMEOUT'].includes(state)) return;
      await new Promise(resolve => setTimeout(resolve,3000));
    }
    status('Finalization unconfirmed. Track the same hash again · ');
    id('status').append(link);
  } finally { button.disabled = false; }
};
