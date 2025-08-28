import React from "react";
import { useEffect } from "react";
import { useRef } from "react";
import { useState } from "react";

const API_BASE = process.env.REACT_APP_API_BASE;

export default function AgentSelectionModal({open, listingId, onClose, triggerRef}) {
    const [agents, setAgents] = useState([])
    const [selectedAgent, setSelectedAgents] = useState(null);
    const dialogRef = useRef(null);

    useEffect(() => {
        if (!open) return;

        // lock scroll (optional)
        const prevOverflow = document.body.style.overflow;
        const scrollY = window.scrollY;
        document.body.style.overflow = 'hidden';

        // capture the element NOW to use in cleanup later
        const restoreFocusEl = triggerRef && triggerRef.current ? triggerRef.current : null;

        // focus modal after mount (optional)
        // setTimeout(() => dialogRef.current?.focus?.(), 0);

        return () => {
            // restore scroll (optional)
            document.body.style.overflow = prevOverflow;
            window.scrollTo(0, scrollY);

            // ✅ explicit function call avoids no-unused-expressions
            if (restoreFocusEl && typeof restoreFocusEl.focus === 'function') {
            restoreFocusEl.focus();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]); // don't depend on triggerRef; we captured .current above

    // esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    async function fetchAgents() {
        try{
            if(listingId){
                const response = await fetch(`${API_BASE}/api/listings/${listingId}`);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)
                const data = await response.json();
                    // Fetch Multiple Agents if present
                if(Array.isArray(data.agentIds) && data.agentIds.length){
                    const ids = data.agentIds.join(',');
                    const agentsRes =  await fetch(`${API_BASE}/api/agents?ids=${ids}`);
                    if(agentsRes.ok){
                    const agentsData = await agentsRes.json();
                    setAgents(agentsData)
                    }
                }
            }
        } catch(e){

        }
    }
    fetchAgents()
  },[listingId])
  if (!open) return null;
  const changeSelectedAgent = (e) => {
    const selectedId = (e.target.value)
    const selectedAgent = agents.find(a => a._id === selectedId) || null;
    setSelectedAgents(selectedAgent);
  }
  
  const onConfirm = async (e) => {
    if(selectedAgent){
        const payload = selectedAgent?._id 
            ? {listingId: listingId, agentId: selectedAgent._id}
            : {listingId: listingId, email: selectedAgent.email}
        try {
        const res = await fetch(`${API_BASE}/api/preview/send`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
         },
        credentials: 'include', // IMPORTANT: send admin cookie/session
        body: JSON.stringify(payload),
        });
        if (!res.ok) {
        const msg = await res.text().catch(() => '');
        throw new Error(msg || `Failed with ${res.status}`);
        }
        // success UI (toast/snackbar)
        return true;
    } finally {
        // setEmailSending(false);
  }
    }
  }
  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="agent-modal-title"
    >
      {/* backdrop */}
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
      />
      {/* panel */}
      <div className="selected-agent-margin-top relative mx-auto mt-[10vh] w-[92vw] max-w-xl rounded-2xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10">
        <div
          ref={dialogRef}
          tabIndex={-1}
          className="max-h-[70vh] overflow-auto p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 id="agent-modal-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Select Agent
            </h2>
            <button
              className="btn-icon"
              onClick={onClose}
              aria-label="Close"
              title="Close"
            >
              <i className="fas fa-times" />
            </button>
          </div>

          {/* list */}
          <ul className="space-y-2">
            {agents.map(agent => {
              const agentPhoto = agent.images?.find(img => img.altText === 'agent-photo')?.url;
              const initials = (agent?.name || '')
                .split(' ')
                .filter(Boolean)
                .map(p => p[0])
                .slice(0, 2)
                .join('');
              return (
                <li key={agent._id}>
                  <label className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700">
                    <input
                      type="radio"
                      name="agent"
                      className="mt-0.5"
                      value={agent._id}
                      onChange={changeSelectedAgent}
                    />
                    <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-sm font-semibold text-gray-700 dark:text-gray-100">
                      {agentPhoto ? (
                        <img src={agentPhoto} alt="" className="w-full h-full object-cover" />
                      ) : initials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium selected-agent-text-color">{agent.name || '—'}</p>
                      <p className="truncate text-sm selected-agent-text-color">{agent.email || '—'} • {agent.phone || ''}</p>
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>

          {/* actions */}
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              className="px-3 py-2 rounded-lg bg-gray-200 text-gray-900 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-3 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60"
              disabled={!selectedAgent}
              onClick={onConfirm}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}