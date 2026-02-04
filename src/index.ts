import { toGraph } from './utils';
import { AnaNode } from './types';
import { Walker } from './interpreter';

const test = {"Channel":{"tag":"Sum","variants":{"email":{"name":"emailData","tag":"Tag","value":{"fields":{"address":{"fields":{"String":{"tag":"All"}},"tag":"Record"},"verified":{"fields":{"String":{"contents":["false","true"],"tag":"OneOf"}},"tag":"Record"}},"tag":"Record"}},"sms":{"name":"smsData","tag":"Tag","value":{"fields":{"phone":{"fields":{"Int":{"tag":"All"}},"tag":"Record"}},"tag":"Record"}}}},"Notification":{"name":"notification","tag":"Tag","value":{"fields":{"channel":{"tag":"Sum","variants":{"email":{"name":"emailData","tag":"Tag","value":{"fields":{"address":{"fields":{"String":{"tag":"All"}},"tag":"Record"},"verified":{"fields":{"String":{"contents":["false","true"],"tag":"OneOf"}},"tag":"Record"}},"tag":"Record"}},"sms":{"name":"smsData","tag":"Tag","value":{"fields":{"phone":{"fields":{"Int":{"tag":"All"}},"tag":"Record"}},"tag":"Record"}}}},"content":{"fields":{"Int":{"tag":"All"}},"tag":"Record"},"priority":{"fields":{"Int":{"contents":[1,2,3],"tag":"OneOf"}},"tag":"Record"},"sender":{"name":"user","tag":"Tag","value":{"fields":{"id":{"fields":{"Int":{"tag":"All"}},"tag":"Record"},"name":{"fields":{"String":{"tag":"All"}},"tag":"Record"},"role":{"fields":{"String":{"contents":["admin","guest","user"],"tag":"OneOf"}},"tag":"Record"}},"tag":"Record"}}},"tag":"Record"}},"Priority":{"fields":{"Int":{"contents":[1,2,3],"tag":"OneOf"}},"tag":"Record"},"Role":{"fields":{"String":{"contents":["admin","guest","user"],"tag":"OneOf"}},"tag":"Record"},"User":{"name":"user","tag":"Tag","value":{"fields":{"id":{"fields":{"Int":{"tag":"All"}},"tag":"Record"},"name":{"fields":{"String":{"tag":"All"}},"tag":"Record"},"role":{"fields":{"String":{"contents":["admin","guest","user"],"tag":"OneOf"}},"tag":"Record"}},"tag":"Record"}}}
const graph = toGraph(test)

const inputEl = document.createElement('input');
inputEl.placeholder = "Input...";
inputEl.style.width = "400px";
document.body.appendChild(inputEl);

const node: AnaNode = graph["Notification"]

const walker = new Walker(node);

inputEl.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;

  const rawVal = inputEl.value;

  const result = walker.step(rawVal);

  if (typeof result === 'string') {
    console.error(result);
  } else {
    inputEl.value = '';
  }
});
