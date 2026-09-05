import { useEffect, useState } from 'react';
import { AlertTriangle, Check, FileCode2, Minus, MonitorSmartphone, Plus, QrCode, Send, ShieldCheck, Square, Terminal, X, Zap } from 'lucide-react';
import DiffViewer from './components/DiffViewer';
import QRCodeModal from './components/QRCodeModal';

const demoPayload = {
  type: 'STACK_TRACE',
  filePath: 'C:/workspace/demo/app.js',
  lineNumber: 4,
  originalCode: '  console.log(numbers[5]);',
  suggestedFix: '  console.log(numbers[2]);',
  explanation: 'The array contains three items, so index 5 resolves to undefined.',
};

const makeAlert = (payload, status = 'Pending') => ({ ...payload, id: `${payload.type}-${Date.now()}`, receivedAt: new Date(), status });

function App() {
  const [platform, setPlatform] = useState('windows');
  const [alerts, setAlerts] = useState(() => [makeAlert(demoPayload)]);
  const [selectedAlert, setSelectedAlert] = useState(() => makeAlert(demoPayload));
  const [connection, setConnection] = useState({ status: 'starting', port: 8080 });
  const [notice, setNotice] = useState('Waiting for mobile app');
  const [applied, setApplied] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const onAlert = (payload) => {
      const nextAlert = makeAlert(payload, 'Incoming');
      setAlerts((current) => [nextAlert, ...current]);
      setSelectedAlert(nextAlert);
      setApplied(false);
      setNotice('New mobile alert received');
    };
    const onStatus = (payload) => {
      if (!mounted || !payload) return;
      if (payload.type === 'WS_STARTED') {
        setConnection({ status: 'connected', port: payload.port });
        setNotice('Connected to local mobile bridge');
      } else if (payload.type === 'APPLIED_SUCCESS') {
        setApplied(true);
        setNotice('Patch applied to workspace');
      } else if (payload.type === 'WS_ERROR') {
        setConnection({ status: 'error', port: payload.port || 8080 });
        setNotice(payload.message || 'WebSocket unavailable');
      }
    };

    const ready = window.electronAPI?.ready?.();
    ready?.then((info) => {
      if (mounted) setPlatform(info?.platform === 'darwin' ? 'macos' : 'windows');
    });
    const removeAlertListener = window.electronAPI?.onWebSocketAlert?.(onAlert);
    const removeStatusListener = window.electronAPI?.onWebSocketStatus?.(onStatus);
    return () => {
      mounted = false;
      removeAlertListener?.();
      removeStatusListener?.();
    };
  }, []);

  const applyPatch = async () => {
    if (!selectedAlert) return;
    const response = await window.electronAPI?.applyPatch?.({
      filePath: selectedAlert.filePath,
      originalCode: selectedAlert.originalCode,
      suggestedFix: selectedAlert.suggestedFix,
    });
    if (response?.ok) {
      setApplied(true);
      setNotice('Patch applied to workspace');
      setAlerts((current) => current.map((alert) => alert.id === selectedAlert.id ? { ...alert, status: 'Applied' } : alert));
    } else {
      setNotice(response?.error || 'Patch could not be applied');
    }
  };

  const simulateAlert = () => {
    const nextAlert = makeAlert(demoPayload, 'Incoming');
    setAlerts((current) => [nextAlert, ...current]);
    setSelectedAlert(nextAlert);
    setApplied(false);
    setNotice('Simulated mobile alert received');
  };

  const isMac = platform === 'macos';
  const isConnected = connection.status === 'connected';
  const typeLabel = selectedAlert?.type === 'VISUAL_BUG' ? 'Visual bug' : 'Stack trace';

  return (
    <div className={`app-shell ${isMac ? 'app-mac' : 'app-windows'}`}>
      <header className="titlebar">
        {isMac ? (
          <div className="traffic-lights" aria-label="Window controls">
            <button className="light red" onClick={() => window.electronAPI?.windowControls.close()} aria-label="Close" />
            <button className="light yellow" onClick={() => window.electronAPI?.windowControls.minimize()} aria-label="Minimize" />
            <button className="light green" onClick={() => window.electronAPI?.windowControls.maximize()} aria-label="Maximize" />
          </div>
        ) : (
          <div className="window-controls">
            <button onClick={() => window.electronAPI?.windowControls.minimize()} aria-label="Minimize"><Minus size={14} /></button>
            <button onClick={() => window.electronAPI?.windowControls.maximize()} aria-label="Maximize"><Square size={12} /></button>
            <button onClick={() => window.electronAPI?.windowControls.close()} aria-label="Close"><X size={14} /></button>
          </div>
        )}
        <div className="window-title"><Zap size={14} /> Zero Latency <span>/ Desktop Bridge</span></div>
      </header>

      <main className="workspace">
        <aside className="sidebar">
          <div className="brand-row"><div className="icon-badge"><MonitorSmartphone size={17} /></div><div><div className="eyebrow">Mobile companion</div><div className="sidebar-title">Alert stream</div></div></div>
          <div className={`connection-card ${isConnected ? 'connected' : ''}`}><span className="pulse" /><div><strong>{isConnected ? 'Connected' : 'Waiting for mobile app'}</strong><small>ws://localhost:{connection.port}</small></div></div>
          <button className="secondary-button pairing-button" onClick={() => setIsQrOpen(true)}><QrCode size={14} /> Show pairing QR</button>
          <div className="feed-heading"><span>Recent alerts</span><span>{alerts.length}</span></div>
          <div className="alert-list">
            {alerts.map((alert) => (
              <button key={alert.id} className={`alert-item ${selectedAlert?.id === alert.id ? 'active' : ''}`} onClick={() => { setSelectedAlert(alert); setApplied(alert.status === 'Applied'); }}>
                <div className="alert-row"><span className="alert-badge">{alert.type === 'VISUAL_BUG' ? 'Visual' : 'Trace'}</span><span className="alert-status">{alert.status}</span></div>
                <div className="alert-file">{alert.filePath}</div><div className="alert-meta">Line {alert.lineNumber} <span>•</span> {alert.receivedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </button>
            ))}
          </div>
          <button className="secondary-button" onClick={simulateAlert}><Send size={14} /> Simulate incoming alert</button>
        </aside>

        <section className="content-panel">
          <div className="topbar"><div className="file-heading"><div className="topbar-icon"><FileCode2 size={17} /></div><div><div className="eyebrow">Reviewing {typeLabel}</div><div className="file-path">{selectedAlert?.filePath}</div></div></div><div className="status-pill"><span className={`status-dot ${isConnected ? 'online' : ''}`} />{notice}</div></div>
          <div className="section-heading"><div><div className="eyebrow">Patch review</div><h1>Inspect the change before it ships.</h1></div><div className="line-chip">Line {selectedAlert?.lineNumber}</div></div>
          <div className="diff-card"><div className="diff-card-header"><span><Terminal size={14} /> Code comparison</span><div><span className="legend removed"><Minus size={12} /> Current</span><span className="legend added"><Plus size={12} /> Suggested</span></div></div><DiffViewer originalCode={selectedAlert?.originalCode} suggestedFix={selectedAlert?.suggestedFix} /></div>
          <div className="detail-grid"><div className="detail-panel"><div className="section-label"><AlertTriangle size={14} /> Context</div><p>{selectedAlert?.explanation || 'No additional context was provided.'}</p></div><div className="detail-panel action-panel"><div><div className="section-label"><ShieldCheck size={14} /> Ready to apply</div><p>Replace the matching code in the workspace file.</p></div><button className="apply-button" onClick={applyPatch} disabled={applied}><Zap size={15} /> {applied ? 'Patch applied' : 'Apply patch'}</button></div></div>
          {applied && <div className="success-banner"><Check size={16} /> Patch applied to disk and mobile client notified.</div>}
        </section>
      </main>
      <QRCodeModal isOpen={isQrOpen} onClose={() => setIsQrOpen(false)} port={connection.port || 8080} />
    </div>
  );
}

export default App;
