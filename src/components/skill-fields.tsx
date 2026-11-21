import { useState } from "react";
import { fieldConflict, type SkillField } from "@/lib/skill-fields";

export function SkillFields({ prompt, fields, onChange }: {
  prompt: string;
  fields: SkillField[];
  onChange: (fields: SkillField[]) => void;
}) {
  const [name, setName] = useState("");
  const [phrase, setPhrase] = useState("");
  const field = { name: name.trim(), phrase: phrase.trim() };
  const missing = field.phrase && !prompt.includes(field.phrase);
  const conflict = field.name && field.phrase && fieldConflict(fields, field);
  const invalidName = /[\r\n\[\]]/.test(name);
  const valid = field.name && field.phrase && !invalidName && !missing && !conflict;
  function add() {
    if (!valid) return;
    onChange([...fields, field]);
    setName("");
    setPhrase("");
  }

  return <details className="skill-fields">
    <summary>Reusable fields</summary>
    <label>Phrase in this prompt<textarea rows={2} value={phrase} onChange={e => setPhrase(e.target.value)} /></label>
    <button type="button" onMouseDown={e => e.preventDefault()}
      onClick={() => setPhrase(window.getSelection()?.toString().trim() || phrase)}>Use selected words</button>
    <label>Field name<input value={name} onChange={e => setName(e.target.value)} placeholder="Source document" /></label>
    <button type="button" disabled={!valid} onClick={add}>Add to skill</button>
    {missing && <p>Choose words that appear in the current prompt.</p>}
    {conflict && <p>Use a distinct field name and a phrase separate from existing fields.</p>}
    {invalidName && <p>Use a field name without brackets.</p>}
    {fields.map(item => <p key={item.name}>
      {item.phrase} → {item.name} {!prompt.includes(item.phrase) && <small>Outside this prompt · omitted from skill</small>}
      <button type="button" aria-label={`Remove ${item.name} field`}
        onClick={() => onChange(fields.filter(f => f !== item))}>Remove</button>
    </p>)}
  </details>;
}
