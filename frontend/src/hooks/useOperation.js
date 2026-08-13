import { useEffect, useRef, useState } from "react";
import { getOperation, streamOperation } from "../api.js";

export const EMPTY_OP = {
  status: "idle",
  agents: [],
  evidence: [],
  log: [],
  product: null,
  campaign: null,
  decision: null,
};

export function useOperation(opId, { autoStream = true } = {}) {
  const [op, setOp] = useState(EMPTY_OP);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(opId ? true : false);
  const esRef = useRef(null);

  const applySnapshot = (snap) => {
    setOp({
      status: snap.status || "running",
      agents: snap.agents || [],
      evidence: snap.evidence || [],
      log: snap.log || [],
      product: snap.product || null,
      campaign: snap.campaign || null,
      decision: snap.decision || null,
      error: snap.error || null,
      mission: snap.mission || "",
      id: snap.id || null,
    });
  };

  useEffect(() => {
    if (!opId) {
      setConnecting(false);
      setConnected(false);
      return;
    }
    setConnecting(true);
    getOperation(opId)
      .then(applySnapshot)
      .catch(() => {})
      .finally(() => setConnecting(false));
  }, [opId]);

  useEffect(() => {
    if (!opId || !autoStream) return;
    const es = streamOperation(opId, (event) => {
      if (event.type === "snapshot") {
        setConnected(true);
        applySnapshot(event.snapshot);
        return;
      }
      if (event.type === "agent_status") {
        setOp((prev) => ({
          ...prev,
          agents: (prev.agents || []).map((a) =>
            a.id === event.agent_id ? { ...a, status: event.status } : a
          ),
        }));
      } else if (event.type === "agent_output") {
        setOp((prev) => {
          const next = {
            ...prev,
            agents: (prev.agents || []).map((a) =>
              a.id === event.agent_id ? { ...a, output: event.output, status: "done" } : a
            ),
          };
          if (event.agent_id === "maker") next.product = event.output.product || event.output;
          if (event.agent_id === "communicator")
            next.campaign = event.output.campaign || event.output;
          if (event.agent_id === "manager")
            next.decision = event.output.decision || event.output;
          return next;
        });
      } else if (event.type === "evidence") {
        setOp((prev) => ({
          ...prev,
          evidence: [...prev.evidence, event.evidence],
        }));
      } else if (event.type === "log") {
        setOp((prev) => ({ ...prev, log: [...prev.log, event] }));
      } else if (event.type === "product") {
        setOp((prev) => ({ ...prev, product: event.product }));
      } else if (event.type === "campaign") {
        setOp((prev) => ({ ...prev, campaign: event.campaign }));
      } else if (event.type === "decision") {
        setOp((prev) => ({ ...prev, decision: event.decision }));
      } else if (event.type === "operation") {
        setOp((prev) => ({ ...prev, status: event.status, error: event.error || prev.error }));
        if (event.status === "complete" || event.status === "failed") {
          getOperation(opId).then(applySnapshot).catch(() => {});
        }
      }
    });
    esRef.current = es;
    return () => {
      es.close();
      esRef.current = null;
    };
  }, [opId, autoStream]);

  return { op, connected, connecting };
}
