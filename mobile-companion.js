const urlInput = document.querySelector('#ws-url');
const connectButton = document.querySelector('#connect-button');
const connectionStatus = document.querySelector('#connection-status');
const connectionDot = document.querySelector('#connection-dot');
const reportForm = document.querySelector('#report-form');
const sendStatus = document.querySelector('#send-status');
const reportType = document.querySelector('#report-type');
const fieldValues = {
  filePath: document.querySelector('#file-path'),
  lineNumber: document.querySelector('#line-number'),
  originalCode: document.querySelector('#original-code'),
  suggestedFix: document.querySelector('#suggested-fix'),
  explanation: document.querySelector('#explanation'),
};
let socket;

const visualBugDemo = {
  filePath: 'demo-file.js',
  lineNumber: 4,
  originalCode: '  console.log(numbers[5]);',
  suggestedFix: '  console.log(numbers[2]);',
  explanation: 'The visual debug demo highlights the invalid array access and replaces it with a valid item.',
};

const params = new URLSearchParams(window.location.search);
urlInput.value = params.get('ws') || localStorage.getItem('zero-latency-ws-url') || '';

function loadVisualBugDemo() {
  Object.entries(visualBugDemo).forEach(([field, value]) => {
    fieldValues[field].value = value;
  });
}

reportType.addEventListener('change', () => {
  if (reportType.value === 'VISUAL_BUG') loadVisualBugDemo();
});

function setConnectionState(connected, message) {
  connectionStatus.textContent = message;
  connectionDot.classList.toggle('connected', connected);
  connectButton.textContent = connected ? 'Disconnect' : 'Connect';
}

function connect() {
  const url = urlInput.value.trim();
  if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
    setConnectionState(false, 'Enter a valid ws:// or wss:// URL.');
    return;
  }

  localStorage.setItem('zero-latency-ws-url', url);
  socket = new WebSocket(url);
  setConnectionState(false, 'Connecting...');
  socket.addEventListener('open', () => setConnectionState(true, 'Connected to desktop'));
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.type === 'CONNECTED') setConnectionState(true, message.message);
    if (message.type === 'ALERT_RECEIVED') sendStatus.textContent = 'Desktop received the report.';
    if (message.type === 'PATCH_APPLIED') sendStatus.textContent = 'Desktop applied the patch.';
    if (message.type === 'ERROR') sendStatus.textContent = message.message;
  });
  socket.addEventListener('close', () => setConnectionState(false, 'Disconnected from desktop'));
  socket.addEventListener('error', () => setConnectionState(false, 'Connection failed. Check Wi-Fi and the URL.'));
}

connectButton.addEventListener('click', () => {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.close();
    return;
  }
  connect();
});

reportForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    sendStatus.textContent = 'Connect to the desktop before sending a report.';
    return;
  }

  const payload = {
    type: document.querySelector('#report-type').value,
    filePath: document.querySelector('#file-path').value.trim(),
    lineNumber: Number(document.querySelector('#line-number').value),
    originalCode: document.querySelector('#original-code').value,
    suggestedFix: document.querySelector('#suggested-fix').value,
    explanation: document.querySelector('#explanation').value.trim(),
  };

  socket.send(JSON.stringify(payload));
  sendStatus.textContent = 'Report sent. Waiting for desktop acknowledgement...';
});
