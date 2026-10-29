import json
import os
import shutil
from PIL import Image

ROOT = r"c:\Users\Zaira Torres\OneDrive - PUNTO CONNECT SOLUCIONES TECNOLOGICAS\Documentos\Proyectos\ccna-prep-hub"
QUESTIONS_JS = os.path.join(ROOT, "data", "questions.js")
IMG_DIR = os.path.join(ROOT, "data", "images")
BACKUP_DIR = os.path.join(ROOT, "data", "backup_pre_clean")

# 1. Create backup
os.makedirs(BACKUP_DIR, exist_ok=True)
shutil.copy2(QUESTIONS_JS, os.path.join(BACKUP_DIR, "questions.js.bak"))
print("Backed up questions.js")

# 2. Define crop cutoffs (in OCR coordinates, where image y0 = 48)
# We crop from y_png=0 (or trimmed header) to (cutoff_y - 48)
# If a top header needs trimming, we can also crop top.
EXHIBIT_CROPS = {
    # PDF questions with exhibits
    "pdf_0003.png": (0, 150 - 48, 1432, 530 - 48),  # Area 0 Router A, B, C diagram
    "pdf_0007.png": (0, 95 - 48, 1432, 388 - 48),   # R1 show ip route
    "pdf_0015.png": (0, 110 - 48, 1432, 205 - 48),  # JSON snippet
    "pdf_0017.png": (0, 60 - 48, 1432, 400 - 48),   # R1/R2 topology + R1 config
    "pdf_0018.png": (0, 95 - 48, 1432, 505 - 48),   # WLC GUI Layer 2 Security
    "pdf_0019.png": (0, 160 - 48, 1432, 535 - 48),  # R1-R4 topology + routing commands
    "pdf_0021.png": (0, 115 - 48, 1432, 335 - 48),  # show ip route routing table
    "pdf_0022.png": (0, 110 - 48, 1432, 490 - 48),  # R1 show ip route
    "pdf_0023.png": (0, 110 - 48, 1432, 335 - 48),  # R1 show ip route begin gateway
    "pdf_0026.png": (0, 100 - 48, 1432, 175 - 48),  # Cat9300 show cdp
    "pdf_0027.png": (0, 110 - 48, 1432, 325 - 48),  # R1/R2 OSPF config
    "pdf_0029.png": (0, 55 - 48, 1432, 515 - 48),   # WLC GUI 802.11r FT settings
    "pdf_0031.png": (0, 115 - 48, 1432, 270 - 48),  # CPE show ip route
    # Repo questions with exhibits
    "pdf_0004.png": (0, 55 - 48, 1432, 265 - 48),   # r533 Switch2 LLDP config
    "pdf_0038.png": (0, 55 - 48, 1432, 325 - 48),   # r552 R1-R2 OSPF link
    "pdf_0034.png": (0, 55 - 48, 1432, 490 - 48),   # r558 R1-R3 OSPF DR election
    "pdf_0009.png": (0, 55 - 48, 1432, 575 - 48),   # r598 PC1, PC2 topology
    "pdf_0008.png": (0, 55 - 48, 1432, 205 - 48),   # r611 BGP routing table
    "pdf_0028.png": (0, 55 - 48, 1432, 665 - 48),   # r623 WLC GUI 802.11r config
}

# Process image crops
for img_name, (x1, y1, x2, y2) in EXHIBIT_CROPS.items():
    img_path = os.path.join(IMG_DIR, img_name)
    if os.path.exists(img_path):
        # Backup original image if not already backed up
        bak_path = os.path.join(BACKUP_DIR, img_name)
        if not os.path.exists(bak_path):
            shutil.copy2(img_path, bak_path)
        
        im = Image.open(bak_path)
        w, h = im.size
        
        # Ensure within bounds
        box = (max(0, x1), max(0, y1), min(w, x2), min(h, y2))
        cropped = im.crop(box)
        cropped.save(img_path)
        print(f"Cropped {img_name} from {im.size} to {cropped.size} (box: {box})")

# 3. Clean up question definitions in questions.js
CLEAN_PDF_DATA = {
    "pdf_0001": {
        "question": "What is a function performed by a web server?",
        "options": {
            "A": "authenticate and authorize a user's identity",
            "B": "provide application data that is transmitted over HTTP",
            "C": "securely store files for FTP access",
            "D": "send and retrieve email from client devices"
        },
        "answer": ["B"],
        "explanation": "A web server's primary function is to serve web content and application data (HTML, media, APIs) requested by web clients over HTTP/HTTPS.",
        "needsExhibit": False,
        "image": None
    },
    "pdf_0002": {
        "question": "Which access point mode relies on a centralized controller for management, roaming, and SSID configuration?",
        "options": {
            "A": "Bridge mode",
            "B": "Repeater mode",
            "C": "Autonomous mode",
            "D": "Lightweight mode"
        },
        "answer": ["D"],
        "explanation": "Lightweight Access Points (LAP) rely on a centralized Wireless LAN Controller (WLC) via the CAPWAP protocol to manage RF, security policies, roaming, and SSID configurations.",
        "needsExhibit": False,
        "image": None
    },
    "pdf_0003": {
        "question": "Refer to the exhibit. Which action must be taken to ensure that router A is selected as the DR for OSPF area 0?",
        "options": {
            "A": "Configure router A with a fixed OSPF router ID.",
            "B": "Configure the router A interfaces with the highest OSPF priority value within the area.",
            "C": "Configure the OSPF priority on router A with the lowest value between the three routers.",
            "D": "Configure router B and router C as OSPF neighbors of router A."
        },
        "answer": ["B"],
        "explanation": "In an OSPF broadcast multiaccess network, the router with the highest interface priority (default is 1, range 0-255) is elected as the Designated Router (DR). Setting a higher priority on router A ensures its election.",
        "needsExhibit": True,
        "image": "data/images/pdf_0003.png"
    },
    "pdf_0006": {
        "question": "Which command sequence must the engineer configure to secure console and vty access with privilege level 15?",
        "options": {
            "A": "enable secret privilege 15 priv4t3p4ss\nline con 0\n password p4ssword1\n login\nline vty 0 15\n password s3cr3t2\n login",
            "B": "enable secret priv4t3p4ss\nline con 0\n password login p4sswdid1\nline vty 0 15\n password login s3cr3t2\n login",
            "C": "enable secret priv4t3p4ss\nline con 1\n password p4ssword1\nline vty 0 15\n password s3cr3t2",
            "D": "enable secret priv4t3p4ss\nline con 0\n password p4ssword1\n login\nline vty 0 15\n password s3cr3t2\n login"
        },
        "answer": ["D"],
        "explanation": "To secure access on Cisco IOS: 'enable secret <pass>' protects privileged EXEC mode. Console line 0 and VTY lines 0-15 each require 'password <pass>' and the 'login' command to enforce authentication upon connection.",
        "needsExhibit": False,
        "image": None
    },
    "pdf_0007": {
        "question": "Refer to the exhibit. Traffic sourced from the loopback0 interface is trying to connect via SSH to the host at 10.0.1.15. What is the next hop to the destination address?",
        "options": {
            "A": "192.168.0.4",
            "B": "192.168.0.35",
            "C": "192.168.0.7",
            "D": "192.168.0.40"
        },
        "answer": ["C"],
        "explanation": "Longest prefix match rule: Destination 10.0.1.15 matches 10.0.0.0/8, 10.0.1.0/24 (via 192.168.0.4), and 10.0.1.0/28 (via 192.168.0.7). Since /28 has the longest subnet mask (prefix length 28), route 10.0.1.0/28 via 192.168.0.7 is selected.",
        "needsExhibit": True,
        "image": "data/images/pdf_0007.png"
    },
    "pdf_0013": {
        "question": "An engineer is configuring remote access to a router from IP subnet 10.139.58.0/28. The domain name, crypto keys, and SSH have been configured. Which configuration enables the traffic on the destination router?",
        "options": {
            "A": "interface FastEthernet0/0\n ip address 10.122.49.1 255.255.255.252\n ip access-group 110 in\n!\nip access-list standard 110\n permit tcp 10.139.58.0 0.0.0.15 eq 22 host 10.122.49.1",
            "B": "line vty 0 15\n access-group 120 in\n!\nip access-list extended 120\n permit tcp 10.139.58.0 0.0.0.15 any eq 22",
            "C": "interface FastEthernet0/0\n ip address 10.122.49.1 255.255.255.252\n ip access-group 10 in\n!\nip access-list standard 10\n permit udp 10.139.58.0 0.0.0.7 host 10.122.49.1 eq 22",
            "D": "line vty 0 15\n access-class 120 in\n!\nip access-list extended 120\n permit tcp 10.139.58.0 0.0.0.15 any eq 22"
        },
        "answer": ["D"],
        "explanation": "Under VTY lines, the command to apply an access list is 'access-class <number> in' (not 'access-group', which is used on interfaces). A /28 mask has a wildcard mask of 0.0.0.15.",
        "needsExhibit": False,
        "image": None
    },
    "pdf_0014": {
        "question": "A network engineer is installing an IPv6-only capable device. The client has requested that the device IP address be reachable only from the internal network. Which IPv6 address type must be used?",
        "options": {
            "A": "aggregatable global address",
            "B": "IPv4-compatible IPv6 address",
            "C": "link-local address",
            "D": "unique local address"
        },
        "answer": ["D"],
        "explanation": "IPv6 Unique Local Addresses (ULA, prefix FC00::/7) are designed for local communication within an enterprise and are not routable on the public Internet, matching the requirement of being reachable across internal subnets only.",
        "needsExhibit": False,
        "image": None
    },
    "pdf_0015": {
        "question": "Refer to the exhibit. What is identified by the word \"switch\" within line 2 of the JSON Schema?",
        "options": {
            "A": "Value",
            "B": "Object",
            "C": "Key",
            "D": "Array"
        },
        "answer": ["C"],
        "explanation": "In JSON key-value pairs (e.g. {\"switch\": \"3750\", \"port\": \"e2\"}), 'switch' is the key/name, and '3750' is the value.",
        "needsExhibit": True,
        "image": "data/images/pdf_0015.png"
    },
    "pdf_0017": {
        "question": "Refer to the exhibit. An engineer must configure router R2 so it is elected as the DR on the WAN subnet. Which command sequence must be configured?",
        "options": {
            "A": "interface GigabitEthernet0/0\n ip address 10.0.0.34 255.255.255.248\n ip ospf priority 0",
            "B": "interface GigabitEthernet0/0\n ip address 10.0.0.34 255.255.255.224\n ip ospf priority 100",
            "C": "interface GigabitEthernet0/0\n ip address 10.0.1.1 255.255.255.224\n ip ospf priority 98",
            "D": "interface GigabitEthernet0/0\n ip address 10.0.1.1 255.255.255.0\n ip ospf priority 255"
        },
        "answer": ["B"],
        "explanation": "To make R2 the DR on subnet 10.0.0.32/27, the interface IP must be in the 10.0.0.32/27 subnet (mask 255.255.255.224) and the 'ip ospf priority' must be higher than R1 (which is priority 1). Setting priority to 100 wins DR election.",
        "needsExhibit": True,
        "image": "data/images/pdf_0017.png"
    },
    "pdf_0018": {
        "question": "Refer to the exhibit. What are the two steps an engineer must take to provide the highest encryption and authentication using domain credentials from LDAP? (Choose two)",
        "options": {
            "A": "Select WPA+WPA2 on Layer 2 Security.",
            "B": "Select 802.1X under Authentication Key Management.",
            "C": "Select Static WEP+802.1X on Layer 2 Security.",
            "D": "Select PSK under Authentication Key Management.",
            "E": "Select WPA Policy with TKIP Encryption."
        },
        "answer": ["A", "B"],
        "explanation": "Enterprise authentication using centralized credentials (LDAP/RADIUS) requires 802.1X under Authentication Key Management (AKM) combined with WPA/WPA2-Enterprise with AES encryption for the highest security.",
        "needsExhibit": True,
        "image": "data/images/pdf_0018.png"
    },
    "pdf_0019": {
        "question": "Refer to the exhibit. R1 has just received a packet from host A that is destined to host B. Which route in the routing table is used by R1 to reach host B?",
        "options": {
            "A": "10.10.13.0/25 [1/0] via 10.10.10.2",
            "B": "10.10.13.0/25 [108/0] via 10.10.10.10",
            "C": "10.10.13.0/25 [110/2] via 10.10.10.2",
            "D": "10.10.13.0/25 [110/2] via 10.10.10.6"
        },
        "answer": ["B"],
        "explanation": "Destination 10.10.13.10/25 matches the static routes and OSPF routes. Among routes with the same prefix length (/25), the router compares Administrative Distance (AD). The static route via 10.10.10.10 has an administrative distance of 108, which is lower (more preferred) than OSPF (AD 110) and the other floating static routes (AD 111, 112).",
        "needsExhibit": True,
        "image": "data/images/pdf_0019.png"
    },
    "pdf_0021": {
        "question": "Refer to the exhibit. A packet sourced from 10.10.10.32 is destined for the Internet. What is the administrative distance for the destination route?",
        "options": {
            "A": "110",
            "B": "32",
            "C": "1",
            "D": "90"
        },
        "answer": ["C"],
        "explanation": "Traffic destined for the Internet uses the default route 'S* 0.0.0.0/0 [1/0] via 172.16.2.2'. In Cisco routing table notation [AD/Metric], the first number is the Administrative Distance, which is 1 for a static route.",
        "needsExhibit": True,
        "image": "data/images/pdf_0021.png"
    },
    "pdf_0022": {
        "question": "Refer to the exhibit. What is the next hop for traffic entering R1 with a destination of 10.1.2.126?",
        "options": {
            "A": "10.165.20.166",
            "B": "10.165.20.226",
            "C": "10.165.20.146",
            "D": "10.165.20.126"
        },
        "answer": ["A"],
        "explanation": "Destination 10.1.2.126 matches 10.1.2.0/24 and 10.1.2.0/25 (range 10.1.2.0 - 10.1.2.127). The route 10.1.2.0/25 has the longest prefix match (/25 vs /24), so R1 forwards traffic via next-hop 10.165.20.166.",
        "needsExhibit": True,
        "image": "data/images/pdf_0022.png"
    },
    "pdf_0023": {
        "question": "Refer to the exhibit. Which prefix did router R1 learn from internal EIGRP?",
        "options": {
            "A": "172.16.1.0/24",
            "B": "192.168.2.0/24",
            "C": "192.168.3.0/24",
            "D": "192.168.1.0/24"
        },
        "answer": ["B"],
        "explanation": "In Cisco routing tables, internal EIGRP routes are indicated by code 'D' with an Administrative Distance of 90 (e.g. D 192.168.2.0/24 [90/...]). External EIGRP routes use 'D EX' with AD 170.",
        "needsExhibit": True,
        "image": "data/images/pdf_0023.png"
    },
    "pdf_0024": {
        "question": "Which encryption method is used by WPA3?",
        "options": {
            "A": "TKIP",
            "B": "SAE",
            "C": "PSK",
            "D": "AES"
        },
        "answer": ["D"],
        "explanation": "WPA3 uses AES encryption (specifically AES-CCMP-128 in Personal mode and AES-GCMP-256 in Enterprise mode). Simultaneous Authentication of Equals (SAE) is the authentication protocol, while AES is the encryption cipher.",
        "needsExhibit": False,
        "image": None
    },
    "pdf_0026": {
        "question": "Refer to the exhibit. Which action must be taken so that neighboring devices rapidly discover switch Cat9300?",
        "options": {
            "A": "Configure the cdp timer 10 command on switch Cat9300",
            "B": "Configure the cdp holdtime 10 command on switch Cat9300",
            "C": "Configure the cdp timer 10 command on the neighbors of switch Cat9300",
            "D": "Enable portfast on the ports that connect to neighboring devices"
        },
        "answer": ["A"],
        "explanation": "The 'cdp timer <seconds>' command controls how often the local device sends CDP advertisements to its neighbors. Lowering the timer to 10 seconds causes Cat9300 to advertise itself much more frequently, allowing neighbors to discover it rapidly.",
        "needsExhibit": True,
        "image": "data/images/pdf_0026.png"
    },
    "pdf_0027": {
        "question": "Refer to the exhibit. A network engineer started to configure two directly-connected routers as shown. Which command sequence must the engineer configure on R2 so that the two routers become OSPF neighbors?",
        "options": {
            "A": "interface GigabitEthernet0/1\n ip ospf 1 area 0",
            "B": "router ospf 1\n network 192.168.12.1 0.0.0.0 area 1",
            "C": "router ospf 1\n network 192.168.12.0 0.0.0.127 area 0",
            "D": "interface GigabitEthernet0/1\n ip ospf 1 area 1"
        },
        "answer": ["D"],
        "explanation": "For two OSPF routers to form an adjacency, their connecting interfaces must be in the same OSPF area and subnet. Router R1's Gi0/1 is in Area 1 ('network 192.168.12.1 0.0.0.0 area 1'). Therefore, on R2, GigabitEthernet0/1 must also be placed into Area 1 with 'ip ospf 1 area 1'.",
        "needsExhibit": True,
        "image": "data/images/pdf_0027.png"
    },
    "pdf_0029": {
        "question": "Refer to the exhibit. Clients on the WLAN are required to use 802.11r. What action must be taken to meet the requirement?",
        "options": {
            "A": "Enable CCKM under Authentication Key Management.",
            "B": "Set the Fast Transition option to Enable and enable FT 802.1X under Authentication Key Management.",
            "C": "Under Protected Management Frames, set the PMF option to Required.",
            "D": "Set the Fast Transition option and the WPA gtk-randomize State to disable."
        },
        "answer": ["B"],
        "explanation": "IEEE 802.11r is Fast BSS Transition (FT). To enable 802.11r on Cisco WLC, Fast Transition must be set to 'Enable' (or Adaptive), and the FT key management method (such as FT 802.1X or FT PSK) must be checked under Authentication Key Management.",
        "needsExhibit": True,
        "image": "data/images/pdf_0029.png"
    },
    "pdf_0030": {
        "question": "What differentiates device management enabled by Cisco DNA Center from traditional campus device management?",
        "options": {
            "A": "centralized",
            "B": "CLI-oriented device",
            "C": "device-by-device hands-on",
            "D": "per-device"
        },
        "answer": ["A"],
        "explanation": "Cisco DNA Center provides centralized management through an intent-based SDN controller, abstracting network policy from individual hardware configurations across the campus fabric.",
        "needsExhibit": False,
        "image": None
    },
    "pdf_0031": {
        "question": "Refer to the exhibit. All traffic enters the CPE router from interface Serial0/3 with an IP address of 192.168.5.0/24. Web traffic from the WAN is destined for a LAN network where servers are load-balanced. An IP packet with a destination address of the HTTP virtual IP of 192.168.1.250 must be forwarded. Which routing table entry does the router use?",
        "options": {
            "A": "192.168.1.192/26 via 192.168.14.4",
            "B": "192.168.1.224/27 via 192.168.15.5",
            "C": "192.168.1.0/24 via 192.168.12.2",
            "D": "192.168.1.128/25 via 192.168.13.3"
        },
        "answer": ["B"],
        "explanation": "Destination 192.168.1.250 falls in the range 192.168.1.224 to 192.168.1.255 (/27 subnet). Since /27 is the longest prefix match among the routing table entries matching the address, route 192.168.1.224/27 via 192.168.15.5 is selected.",
        "needsExhibit": True,
        "image": "data/images/pdf_0031.png"
    },
    "pdf_0033": {
        "question": "What is the function of a northbound API in software-defined networking (SDN)?",
        "options": {
            "A": "It supports distributed processing for configuration",
            "B": "It enables communication between applications and SDN controllers",
            "C": "It upgrades software and restores files",
            "D": "It provides a path between an SDN controller and network applications"
        },
        "answer": ["D"],
        "explanation": "In SDN architectures, Northbound APIs (e.g. RESTful APIs) enable communication between the SDN controller and higher-layer network applications or management consoles.",
        "needsExhibit": False,
        "image": None
    },
    "pdf_0037": {
        "question": "Which command implies the use of SNMPv3?",
        "options": {
            "A": "snmp-server user",
            "B": "snmp-server enable traps",
            "C": "snmp-server host",
            "D": "snmp-server community"
        },
        "answer": ["A"],
        "explanation": "SNMPv3 introduces the User-based Security Model (USM) providing authentication and encryption. The 'snmp-server user' and 'snmp-server group' commands are specific to SNMPv3 configuration.",
        "needsExhibit": False,
        "image": None
    }
}

# 4. Load questions.js and update
with open(QUESTIONS_JS, "r", encoding="utf-8") as f:
    raw = f.read()

json_str = raw[raw.find("{"):raw.rfind("}") + 1]
db = json.loads(json_str)

updated_count = 0
for q in db["questions"]:
    qid = q["id"]
    if qid in CLEAN_PDF_DATA:
        info = CLEAN_PDF_DATA[qid]
        q["type"] = "multiple-choice"
        q["question"] = info["question"]
        q["options"] = info["options"]
        q["answer"] = info["answer"]
        q["explanation"] = info["explanation"]
        q["needsExhibit"] = info["needsExhibit"]
        q["image"] = info["image"]
        if "letters" in q:
            del q["letters"]
        updated_count += 1

print(f"Updated {updated_count} PDF questions to clean multiple-choice format.")

# Save updated questions.js
with open(QUESTIONS_JS, "w", encoding="utf-8") as f:
    f.write("window.CCNA_DATA = ")
    json.dump(db, f, indent=2, ensure_ascii=False)
    f.write(";\n")

print(f"Successfully wrote clean {QUESTIONS_JS}")

