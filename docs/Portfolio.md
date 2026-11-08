---
icon: lucide/hd
---


# Portfolio



!!! disclaimer

    This is my personal portfolio. It is not affiliated with any of my current or previous employers. Tufin materials were taken from the publicly available Tufin Knowledge Center. All other third-party content is used with the owners’ permission.



<div class="cards" markdown>

## T-900/T-1300 Quick Start Guide

A quick start guide for setting up Tufin T-900 and T-1300 hardware appliances, from unboxing and rack installation through network configuration, OS updates, and TOS installation.

|  |  |
| --- | --- |
| **Technologies covered:**  | Tufin T-Series appliances, TufinOS, Tufin Orchestration Suite (TOS) Aurora, Dell iDRAC, NIC bonding (nmtui), NTP and DNS configuration, SSH, tmux |
| **Document type:**  | Quick start guide (hardware setup procedure) |
| **Created on:**  | October 20, 2026 |

[View live page](https://forum.tufin.com/support/kc/latest/Content/ST2/ManagingTOS/qsg_t900-t1300.htm)

[Download markdown file](https://raw.githubusercontent.com/Josh-Free/My-Portfolio/main/markdown/T-900-T-1300%20Quick%20Start%20Guide.md)


</div>
<div class="cards" markdown>

## Mount the ETCD Database to a Separate Disk

A set of procedures for moving the Kubernetes etcd database onto its own disk, giving TOS the dedicated disk resources it needs for performance, stability, and low latency. Required for all clusters.

|  |  |
| --- | --- |
| **Technologies covered:**  | Kubernetes etcd, TufinOS and open servers, AWS, Azure, GCP (in-place, new instance, and high availability scenarios) |
| **Document type:**  | Procedure set (landing page linking to environment-specific task topics) |
| **Created on:**  | October 20, 2026 |

[View live page](https://forum.tufin.com/support/kc/latest/Content/ST2/ManagingTOS/MiniTOC_etcd.htm)

Sample markdown files from this set:

- [Download markdown file](https://raw.githubusercontent.com/Josh-Free/My-Portfolio/main/markdown/Move%20etcd%20-%20In-place%20AWS%20Instance.md) — Move etcd: In-place AWS Instance
- [Download markdown file](https://raw.githubusercontent.com/Josh-Free/My-Portfolio/main/markdown/Move%20etcd%20-%20GCP%20High%20Availability.md) — Move etcd: GCP High Availability
- [Download markdown file](https://raw.githubusercontent.com/Josh-Free/My-Portfolio/main/markdown/Mount%20etcd%20-%20New%20TufinOS%20or%20Open%20Server.md) — Mount etcd: New TufinOS or Open Server

</div>
<div class="cards" markdown>

## Upgrade TufinOS

A set of procedures intended to help network administrators upgrade and update the TufinOS operating system on TOS nodes. Separate procedures for upgrading from TufinOS 3 to 4 (in-place and HA deployments on VMware ESXi) and for updating within TufinOS 4. 

|  |  |
| --- | --- |
| **Technologies covered:**  | TufinOS, TOS Aurora, Kubernetes (k3s), VMware ESXi/vSphere, TOS CLI, NTP (chrony), NetworkManager, high availability clusters, remote collectors |
| **Document type:**  | Procedure set (landing page linking to upgrade procedures) |
| **Created on:**  | October 20, 2026 |

[View live page](https://forum.tufin.com/support/kc/latest/Content/ST2/ManagingTOS/MiniTOC_upgradeTufinOS.htm)

Sample markdown files from this set:

- [Download markdown file](https://raw.githubusercontent.com/Josh-Free/My-Portfolio/main/markdown/Upgrade%20TufinOS%203%20to%204%20-%20HA%2C%20VMWare%20ESXi.md) — Upgrade TufinOS 3 to 4: HA, VMWare ESXi
- [Download markdown file](https://raw.githubusercontent.com/Josh-Free/My-Portfolio/main/markdown/Upgrade%20TufinOS%203%20to%204%20-%20In-place%2C%20VMWare%20ESXi%2C%20Central-Remote%20Collector%20Cluster%2C%20TOS%20Reinstall.md) — Upgrade TufinOS 3 to 4: In-place, VMWare ESXi, Central/Remote Collector Cluster, TOS Reinstall

</div>
<div class="cards" markdown>

## Remote Collectors

An overview of TOS remote collector clusters that helps administrators decide when a remote collector is needed. Includes procedures to connect, list, and disconnect remote collectors from a central cluster.

|  |  |
| --- | --- |
| **Technologies covered:**  | TOS, SecureTrack, Kubernetes clusters, TOS CLI (`tos cluster` commands), AWS, Azure, GCP, SSL certificates, JMS and HTTPS connectivity |
| **Document type:**  | Concept and task topic (overview, procedures, and CLI parameters) |
| **Created on:**  | October 20, 2026 |

[View live page](https://forum.tufin.com/support/kc/latest/Content/ST2/ManagingTOS/RemoteCollectors.htm)

[Download markdown file](https://raw.githubusercontent.com/Josh-Free/My-Portfolio/main/markdown/Remote%20Collectors.md)

</div>
<div class="cards" markdown>

## High Availability Architecture

An explanation of how TOS high availability works, covering the three-data-node design, leader election, site requirements, and failover behavior. Helps network administrators understand the architecture and its constraints before enabling high availability, and what to expect when a node fails.

|  |  |
| --- | --- |
| **Technologies covered:**  | TOS, Kubernetes cluster nodes, quorum-based leader election, GCP availability zones, remote collectors |
| **Document type:**  | Concept (architecture overview) |
| **Created on:**  | October 20, 2026 |

[View live page](https://forum.tufin.com/support/kc/latest/Content/ST2/GettingStarted/HAArchitecture.htm)

[Download markdown file](https://raw.githubusercontent.com/Josh-Free/My-Portfolio/main/markdown/High%20Availability%20Architecture.md)

</div>