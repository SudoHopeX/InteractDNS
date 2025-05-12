// Configuration
const CONFIG = {
   availableServers: ['oast.fun', 'oast.pro', 'oast.live', 'oast.site', 'oast.online', 'oast.me', 'interact.sh'],
   interactshServer: 'oast.fun', // Default server, can be changed to 'oast.me/oast.online/oast.fun/oast.pro/oast.live/oast.site/interact.sh' or custom domain
   pollingInterval: 5000, // Poll for interactions every 5 seconds
   maxLogs: 100, // Maximum number of logs to keep in memory
   localStorage: {
       domainKey: 'interactshDomain',
       correlationIdKey: 'interactshCorrelationId',
       tokenKey: 'interactshToken',
       logsKey: 'interactshLogs'
   }
};

interactshServer = 'https://interactdns-server.vercel.app'; 

// Global variables
let interactshDomain = '';
let correlationId = '';
let interactshToken = '';
let isPolling = true;
let pollingIntervalId = null;

// DOM Elements
const domainElement = document.getElementById('interactshDomain');
const copyDomainButton = document.getElementById('copyDomain');
const refreshDomainButton = document.getElementById('refreshDomain');
const clearLogsButton = document.getElementById('clearLogs');
const downloadLogsButton = document.getElementById('downloadLogs');
const pollingToggleButton = document.getElementById('pollingToggle');
const logsContainer = document.getElementById('logs');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');
const copyButtons = document.querySelectorAll('.copy-btn');

// Initialize the application
function init() {
   setupEventListeners();
   loadFromLocalStorage();
   generateNewDomain();
   updatePayloadExamples();
   startPolling();
}

// Set up event listeners
function setupEventListeners() {
   copyDomainButton.addEventListener('click', copyDomainToClipboard);
   refreshDomainButton.addEventListener('click', generateNewDomain);
   clearLogsButton.addEventListener('click', clearLogs);
   downloadLogsButton.addEventListener('click', downloadLogs);
   pollingToggleButton.addEventListener('click', togglePolling);

   // Tab functionality
   tabButtons.forEach(button => {
       button.addEventListener('click', () => {
           const tabId = button.getAttribute('data-tab');
           switchTab(tabId);
       });
   });

   // Copy buttons for payloads
   copyButtons.forEach(button => {
       button.addEventListener('click', () => {
           const targetId = button.getAttribute('data-target');
           const payload = document.getElementById(targetId).textContent;
           copyToClipboard(payload.replace('DOMAIN', interactshDomain));
           showNotification('Payload copied to clipboard');
       });
   });
}

// Load data from local storage
function loadFromLocalStorage() {
   const savedLogs = localStorage.getItem(CONFIG.localStorage.logsKey);
   
   if (savedLogs) {
       logsContainer.innerHTML = savedLogs;
   }
}


// Modified generateNewDomain function to use Python backend
async function generateNewDomain() {
    domainElement.textContent = 'Generating domain...';
    
    try {
        // Use our Python backend instead of direct Interactsh API
        const response = await fetch(interactshServer+'/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                server: CONFIG.interactshServer,
                port: 443,
                scheme: true
            })
        });
        
        const data = await response.json();
        
        if (data && data.success && data.id && data.correlation_id && data.domain) {
            interactshDomain = data.domain;
            correlationId = data.correlation_id;
            interactshToken = data.id;
            
            domainElement.textContent = interactshDomain;
            updatePayloadExamples();
            
            localStorage.setItem(CONFIG.localStorage.domainKey, interactshDomain);
            localStorage.setItem(CONFIG.localStorage.correlationIdKey, correlationId);
            localStorage.setItem(CONFIG.localStorage.tokenKey, interactshToken);
            
            showNotification('New domain generated successfully');
        } else {
            throw new Error(data.error || 'Invalid response from server');
        }
    } catch (error) {
        console.error('Error generating domain:', error);

        // Define available servers if not already in CONFIG
        if (!CONFIG.availableServers) {
            CONFIG.availableServers = ['oast.fun', 'oast.pro', 'oast.live', 'oast.site', 'oast.online', 'oast.me', 'interact.sh'];
        }
        
        // Keep track of tried servers
        if (!CONFIG.triedServers) {
            CONFIG.triedServers = [CONFIG.interactshServer];
        } else if (!CONFIG.triedServers.includes(CONFIG.interactshServer)) {
            CONFIG.triedServers.push(CONFIG.interactshServer);
        }
        
        // Check if we've tried all servers
        if (CONFIG.triedServers.length >= CONFIG.availableServers.length) {
            domainElement.textContent = 'Failed to generate domain with all available servers. Please check your network connection or try again later.';
            showNotification('All Interactsh servers failed', true);
            // Reset tried servers for next attempt
            CONFIG.triedServers = [];
            return;
        }

        // Find next untried server
        const nextServer = CONFIG.availableServers.find(server => !CONFIG.triedServers.includes(server));
        
        if (nextServer) {
            console.log(`Trying next server: ${nextServer}`);
            domainElement.textContent = `Trying alternative server: ${nextServer}...`;
            
            // Update current server and try again
            CONFIG.interactshServer = nextServer;
            
            // Short delay before retrying
            setTimeout(() => {
                generateNewDomain();
            }, 1000);
        } else {
            if (error.message.includes('network')) {
                domainElement.textContent = 'Network error. Check your connection.';
            } else {
                domainElement.textContent = 'Error generating domain. Please try again.';
            }
            
            showNotification('Failed to generate domain', true);
        }
    }
}

// Update payload examples with the current domain
function updatePayloadExamples() {
   const payloadElements = [
       document.getElementById('oracle-payload'),
       document.getElementById('mssql-payload'),
       document.getElementById('mysql-payload'),
       document.getElementById('postgresql-payload')
   ];
   
   payloadElements.forEach(element => {
       if (element) {
           const originalPayload = element.textContent;
           element.textContent = originalPayload.replace('DOMAIN', interactshDomain);
       }
   });
}

// Start polling for interactions
function startPolling() {
   if (pollingIntervalId) {
       clearInterval(pollingIntervalId);
   }
   
   isPolling = true;
   pollingToggleButton.textContent = 'Stop Polling';
   
   // Perform initial poll
   pollForInteractions();
   
   // Set up interval for regular polling
   pollingIntervalId = setInterval(pollForInteractions, CONFIG.pollingInterval);
}

// Stop polling for interactions
function stopPolling() {
   if (pollingIntervalId) {
       clearInterval(pollingIntervalId);
       pollingIntervalId = null;
   }
   
   isPolling = false;
   pollingToggleButton.textContent = 'Start Polling';
}

// Toggle polling state
function togglePolling() {
   if (isPolling) {
       stopPolling();
   } else {
       startPolling();
   }
}

// Poll for new interactions
async function pollForInteractions() {
    if (!interactshToken || !correlationId) {
        return;
    }
    
    try {
        // Use our Python backend instead of direct Interactsh API
        const response = await fetch(`${interactshServer}/api/poll?id=${interactshToken}`, {
            method: 'GET'
        });
        
        const data = await response.json();
        
        if (data && data.success && data.data && data.data.length > 0) {
            processInteractions(data.data);
        }
    } catch (error) {
        console.error('Error polling for interactions:', error);
    }
}

// Process and display interactions
function processInteractions(interactions) {
   interactions.forEach(interaction => {
       const logEntry = document.createElement('div');
       logEntry.className = 'log-entry';
       
       const timestamp = new Date(interaction.timestamp * 1000).toLocaleString();
       const protocol = interaction.protocol.toUpperCase();
       const fullData = JSON.stringify(interaction, null, 2);
       
       let protocolClass = '';
       switch (protocol) {
           case 'DNS':
               protocolClass = 'protocol-dns';
               break;
           case 'HTTP':
               protocolClass = 'protocol-http';
               break;
           case 'SMTP':
               protocolClass = 'protocol-smtp';
               break;
           default:
               protocolClass = '';
       }
       
       logEntry.innerHTML = `
           <span class="timestamp">${timestamp}</span>
           <span class="protocol ${protocolClass}">${protocol}</span>
           <span>From: ${interaction.remote_address || 'Unknown'}</span>
           <pre>${fullData}</pre>
       `;
       
       logsContainer.insertBefore(logEntry, logsContainer.firstChild);
       
       // Function from user's original code
       addLogEntry(`Status Code: ${getRandomStatusCode()} | Timestamp: ${timestamp} | Sender IP: ${interaction.remote_address || 'Unknown'} | Referrer IP: ${getReferrerIP()}`);
   });
}

// Function to add a log entry (from user's original code)
function addLogEntry(log) {
   const logsContainer = document.getElementById('logs');
   const logEntry = document.createElement('p');
   logEntry.textContent = log;
   logsContainer.insertBefore(logEntry, logsContainer.firstChild);

   // Limit to maximum logs
   if (logsContainer.children.length > CONFIG.maxLogs) {
       logsContainer.lastChild.remove();
   }

   saveLogsToLocalStorage();
}

// Function to clear logs (from user's original code)
function clearLogs() {
   const logsContainer = document.getElementById('logs');
   logsContainer.innerHTML = '';
   saveLogsToLocalStorage();
   showNotification('Logs cleared');
}

// Function to download logs as a text file (from user's original code)
function downloadLogs() {
   const logsContainer = document.getElementById('logs');
   const logsText = logsContainer.innerText;
   const blob = new Blob([logsText], { type: 'text/plain' });

   // Create a temporary anchor element
   const downloadLink = document.createElement('a');
   downloadLink.href = URL.createObjectURL(blob);
   downloadLink.download = 'interactsh_logs.txt';
   downloadLink.click();
   
   showNotification('Logs downloaded');
}

// Function to save logs to local storage (from user's original code)
function saveLogsToLocalStorage() {
   const logsContainer = document.getElementById('logs');
   const logsText = logsContainer.innerHTML;
   localStorage.setItem(CONFIG.localStorage.logsKey, logsText);
}

// Function to get the referring IP address (from user's original code)
function getReferrerIP() {
   // Replace this with your actual method of retrieving the referring IP address
   return '192.168.0.1';
}

// Function to generate a random status code for demonstration purposes (from user's original code)
function getRandomStatusCode() {
   const statusCodes = [200, 301, 404, 500];
   const randomIndex = Math.floor(Math.random() * statusCodes.length);
   return statusCodes[randomIndex];
}

// Switch between tabs
function switchTab(tabId) {
   tabButtons.forEach(button => {
       button.classList.remove('active');
       if (button.getAttribute('data-tab') === tabId) {
           button.classList.add('active');
       }
   });
   
   tabPanes.forEach(pane => {
       pane.classList.remove('active');
       if (pane.id === tabId) {
           pane.classList.add('active');
       }
   });
}

// Copy domain to clipboard
function copyDomainToClipboard() {
   copyToClipboard(interactshDomain);
   showNotification('Domain copied to clipboard');
}

// Helper function to copy text to clipboard
function copyToClipboard(text) {
   navigator.clipboard.writeText(text).catch(err => {
       console.error('Failed to copy text: ', err);
   });
}

// Show notification
function showNotification(message, isError = false) {
   // Remove any existing notifications
   const existingNotification = document.querySelector('.notification');
   if (existingNotification) {
       document.body.removeChild(existingNotification);
   }
   
   // Create new notification
   const notification = document.createElement('div');
   notification.className = 'notification';
   notification.textContent = message;
   
   if (isError) {
       notification.style.backgroundColor = 'var(--accent-color)';
   }
   
   document.body.appendChild(notification);
   
   // Show notification
   setTimeout(() => {
       notification.classList.add('show');
   }, 10);
   
   // Hide notification after 3 seconds
   setTimeout(() => {
       notification.classList.remove('show');
       setTimeout(() => {
           if (notification.parentNode) {
               document.body.removeChild(notification);
           }
       }, 300);
   }, 3000);
}

// Initialize the application
document.addEventListener('DOMContentLoaded', init);
