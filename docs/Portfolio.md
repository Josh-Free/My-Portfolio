# Portfolio

## T-900/T-1300 Quick Start Guide

A quick start guide for setting up Tufin T-900 and T-1300 hardware appliances, from unboxing and rack installation through network configuration, OS updates, and TOS installation.

- **Purpose:** Takes a new customer from a boxed appliance to a running TOS installation with remote access, network, and link redundancy configured correctly.
- **Technologies covered:** Tufin T-Series appliances, TufinOS, Tufin Orchestration Suite (TOS) Aurora, Dell iDRAC, NIC bonding (nmtui), NTP and DNS configuration, SSH, tmux
- **Document type:** Quick start guide (hardware setup procedure)

[View live page](https://forum.tufin.com/support/kc/latest/Content/ST2/ManagingTOS/qsg_t900-t1300.htm)

## Mount the ETCD Database to a Separate Disk

A set of procedures for moving the Kubernetes etcd database onto its own disk, with a separate topic for each deployment environment and scenario.

- **Purpose:** Gives TOS the dedicated disk resources it needs for performance, stability, and low latency. The procedure is required for all clusters.
- **Technologies covered:** Kubernetes etcd, TufinOS and open servers, AWS, Azure, GCP (in-place, new instance, and high availability scenarios)
- **Document type:** Procedure set (landing page linking to environment-specific task topics)

[View live page](https://forum.tufin.com/support/kc/latest/Content/ST2/ManagingTOS/MiniTOC_etcd.htm)

## Upgrade TufinOS

<!-- Description fields pending: the page content did not load when fetched. -->

[View live page](https://forum.tufin.com/support/kc/latest/Content/ST2/ManagingTOS/MiniTOC_upgradeTufinOS.htm)

## Remote Collectors

An overview of TOS remote collector clusters, with procedures to connect, list, and disconnect them from a central cluster.

- **Purpose:** Helps administrators decide when a remote collector is needed and set up distributed data collection correctly.
- **Technologies covered:** TOS, SecureTrack, Kubernetes clusters, TOS CLI (`tos cluster` commands), AWS, Azure, GCP, SSL certificates, JMS and HTTPS connectivity
- **Document type:** Concept and task topic (overview, procedures, and CLI parameters)

[View live page](https://forum.tufin.com/support/kc/latest/Content/ST2/ManagingTOS/RemoteCollectors.htm)

## High Availability Architecture

An explanation of how TOS high availability works, covering the three-data-node design, leader election, site requirements, and failover behavior.

- **Purpose:** Helps readers understand the architecture and its constraints before enabling high availability, and what to expect when a node fails.
- **Technologies covered:** TOS, Kubernetes cluster nodes, quorum-based leader election, GCP availability zones, remote collectors
- **Document type:** Concept (architecture overview)

[View live page](https://forum.tufin.com/support/kc/latest/Content/ST2/GettingStarted/HAArchitecture.htm)
