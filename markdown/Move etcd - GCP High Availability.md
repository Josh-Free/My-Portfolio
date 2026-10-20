---
title: "Move etcd - GCP High Availability"
source_url: https://forum.tufin.com/support/kc/latest/Content/ST2/ManagingTOS/etcd/etcdSplit_GCP_HA.htm
---

# Move etcd - GCP High Availability

## Overview

This procedure is required for all clusters, including remote collector clusters, and is run on data nodes only.

The Kubernetes etcd database must be on a separate disk to give it access to all the resources required for optimal TOS performance, stability and minimal latency. We recommend performing this procedure after you install the operating system and before you install TOS.

This procedure must be performed by an experienced Linux administrator with knowledge of network and storage configuration.

Only perform this procedure if you are mounting the etcd database on an in-place high availability deployment. If you are setting up a new high availability deployment, first follow the instructions in [Deploy High Availability](https://forum.tufin.com/support/kc/latest/Content/ST2/ManagingTOS/HighAvailability.htm), and then return to this procedure. With new high availability deployments, TOS should only be installed on one data node.

## Preliminary preparations

1. Run the following command:

   ```
   lsblk | grep "/var/lib/rancher/k3s/server/db"
   ```

   If the output contains `/var/lib/rancher/k3s/server/db`, etcd is already on a separate disk, and you do not need to perform this procedure.

2. <details>
   <summary>Backup your TOS data. This needs to be performed for all primary data nodes - the central cluster and remote collector clusters.</summary>

   If you are going to perform this procedure over multiple maintenance periods, create a new backup each time.

   1. Create the backup using `tos backup create`:

      ```
      [<ADMIN> ~]$ sudo tos backup create
      ```

      Example output:

      ```
      [<ADMIN> ~]$ sudo tos backup create
      [Aug 23 16:18:42]  INFO Running backup
      Backup status can be monitored with "tos backup status"
      ```

   2. You can check the backup creation status using `tos backup status`, which shows the status of backups in progress. Wait until completion before continuing.

      ```
      [<ADMIN> ~]$ sudo tos backup status
      ```

      Example output:

      ```
      [<ADMIN> ~]$ sudo tos backup status
      Found active backup "23-august-2021-16-18"
      ```

   3. Run the following command to display the list of backups saved on the node:

      ```
      [<ADMIN> ~]$ sudo tos backup list
      ```

      Example output:

      ```
      [<ADMIN> ~]$ sudo tos backup list
      ["23-august-2021-16-18"]
      Started: "2025-12-23 13:18:43 +0000 UTC"
      Completed: "N/A"
      Modules: "ST, SC"
      HA mode: "false"
      TOS release: "25.2 (PGA.0.0) Final"
      TOS build: "21.2.2100-210722164631509"
      Expiration Date: "2021-09-22 13:18:43 +0000 UTC"
      Status: "Completed"
      ```

   4. Check that your backup file appears in the list, and that the status is **"Completed"**.

   5. If your backup files are saved [locally](https://forum.tufin.com/support/kc/latest/Content/ST2/ManagingTOS/CLI.htm#tosbackupstorageset):

      1. Run [sudo tos backup export](https://forum.tufin.com/support/kc/latest/Content/ST2/ManagingTOS/CLI.htm#tosbackupexport) to save your backup file from a TOS backup directory as a single `.gzip` file. If there are other backups present, they will be included as well.

      2. Transfer the exported `.gzip` file to a safe, remote location.

         Make sure you have the location of your backups safely documented and accessible, including credentials needed to access them, for recovery when needed.

      After the backup is exported, we recommend verifying that the file contents can be viewed by running the following command:

      ```
      [Target location]$ tar tzvf <filename>
      ```

   </details>

3. Switch to the root user.

   ```
   [<ADMIN> ~]$ sudo su -
   ```

4. Install the `rsync` RPM.

   ```
   [<ADMIN> ~]$ dnf install rsync
   ```

5. Find the name of the last disk added to the VM instance.

   ```
   [<ADMIN> ~]# lsblk -ndl -o NAME
   ```

   The output returns the list of disks on the VM instance. The last letter of the disk name indicates in which it was added, for example: `sda`, `sdb`, `sdc`.

6. Save the name of the last disk in a separate location. You will need it later for verification purposes.

## Mount the etcd database to a separate disk

### Shut down TOS

1. Run the [tmux command.](https://forum.tufin.com/support/kc/latest/Content/ST2/ManagingTOS/tmuxCommand.htm)

   ```
   [<ADMIN> ~]$ tmux new-session -s etcd
   ```

2. Stop TOS

   ```
   [<ADMIN> ~]$sudo tos stop
   ```

3. Wait for the following message:

   ```
   Deployment has been stopped successfully
   ```

4. Stop the k3s service.

   ```
   [<ADMIN> ~]# systemctl stop k3s.service
   ```

5. Disable the k3s service.

   ```
   [<ADMIN> ~]# systemctl disable k3s.service
   ```

6. Verify that the k3s service is stopped and disabled.

   ```
   [<ADMIN> ~]# systemctl is-active k3s.service
   ```

   Output should return `inactive`.

   ```
   [<ADMIN> ~]# systemctl is-enabled k3s.service
   ```

   Output should return `disabled`.

### Mount the etcd database

Repeat steps these steps for each data node.

1. <details>
   <summary>Create a backup directory.</summary>

   1. Create an etcd backup directory with the timestamp on the `/opt` partition.

      ```
      [<ADMIN> ~]# mkdir /opt/etcd_data_backup_$(date "+%Y%m%d-%H%M%S") || echo "Fail"
      ```

   2. Identify the path of the etcd backup directory.

      ```
      [<ADMIN> ~]# ETCD_BACKUP_DIR="$(ls -1dt /opt/etcd_data_backup_* | head -n1)"
      ```

   3. Verify that the etcd backup directory is assigned to the variable `ETCD_BACKUP_DIR`.

      ```
      [<ADMIN> ~]# echo "$ETCD_BACKUP_DIR"
      ```

   </details>

2. <details>
   <summary>Locate the etcd database</summary>

   The purpose of this step is to identify whether the etcd database is located in the `k3s` directory, or whether due to older architecture the etcd database is located in the gravity directory.

   1. Check if there is a link to the etcd database.

      ```
      [<ADMIN> ~]# test -L /var/lib/rancher/k3s/server/db/etcd && echo "Etcd link exists."
      ```

      If the output is empty, no link exists. Proceed to step 2.

      If the output returns `Etcd link exists`, this indicates that the etcd database is in the `gravity` directory. Proceed to step 3.

   2. Check if the database is in the `k3s` directory.

      ```
      [<ADMIN> ~]# test -d /var/lib/rancher/k3s/server/db/etcd || echo "Etcd directory does not exist."
      ```

      If the output is empty, the etcd database is in the `k3s` directory. Do the following:

      1. Assign the path of the `k3s` directory to the ETCD_ROOT_DIR variable.

         ```
         [<ADMIN> ~]# ETCD_ROOT_DIR="/var/lib/rancher/k3s/server/db"
         ```

      2. Proceed to [back up the etcd database](https://forum.tufin.com/support/kc/latest/Content/ST2/ManagingTOS/etcd/etcdSplit_GCP_HA.htm#Backup).

      If the output returns `Etcd directory does not exist`, this indicates that the etcd database could not be found. Stop the procedure and contact customer support.

   3. Check if there is a link to the etcd database in the `gravity` directory.

      ```
      [<ADMIN> ~]# test -d /var/lib/gravity/planet/etcd || echo "Etcd directory does not exist."
      ```

      If the output is empty, this indicates that the etcd database is in the gravity directory. Do the following:

      1. Assign the path of the `gravity` directory to the ETCD_ROOT_DIR directory variable:

         ```
         [<ADMIN> ~]# ETCD_ROOT_DIR="/var/lib/gravity/planet"
         ```

      2. Proceed to [back up the etcd database](https://forum.tufin.com/support/kc/latest/Content/ST2/ManagingTOS/etcd/etcdSplit_GCP_HA.htm#Backup).

      If the output returns `Etcd directory does not exist`, this indicates that the etcd database could not be found. Stop the procedure and contact customer support.

   </details>

3. <details>
   <summary>Back up the etcd database</summary>

   1. Back up the etcd database to the backup directory.

      ```
      [<ADMIN> ~]# rsync -avP ${ETCD_ROOT_DIR}/ ${ETCD_BACKUP_DIR}/ && echo -e "\nOK\n" || echo -e "\nFail\n"
      ```

      Output should return `ok`.

   2. If it exists, remove the `etcd` symbolic link.

      ```
      [<ADMIN> ~]# ETCD_LINK_PATH="/var/lib/rancher/k3s/server/db/etcd"
      ```

      ```
      [<ADMIN> ~]# test -L ${ETCD_LINK_PATH} && rm -f ${ETCD_LINK_PATH}
      ```

   </details>

4. <details>
   <summary>Add a disk to the VM.</summary>

   1. In GCP, go to the VM instance, and on the **Details** page, click **Edit**.

   2. Under **Additional Disks**, click **Add new disk**.

   3. Configure the following settings:

      - **Name**:

      - **Source Type:** Blank

      - **Region:** Same as VM instance

      - **Location:** Same as VM instance

      - **Disk Type:** ssd persistent disk

      - **Storage**: At least 50 GB

   4. Click **Done** and then Save.

   </details>

5. <details>
   <summary>Mount the new disk.</summary>

   1. Log into the data node as the root user.

   2. Run the [tmux command.](https://forum.tufin.com/support/kc/latest/Content/ST2/ManagingTOS/tmuxCommand.htm)

      ```
      [<ADMIN> ~]$ tmux new-session -s etcd
      ```

   3. Verify that the new disk is recognized by the operating system.

      ```
      [<ADMIN> ~]# lsblk
      ```

      ```
      [<ADMIN> ~]# ls -l /dev/sd*
      ```

      Compare the output with the name of the disk you saved in the preliminary preparations, and verify that the disk name it returned ends with the next letter in the alphabet. For example, if the name you saved was `sdb` the output should return `sdc`. This indicates that the operating system recognizes the new disk.

   4. Create a variable with the block device path of the new disk.

      ```
      [<ADMIN> ~]# BLOCK_DEV="/dev/sd<>"
      ```

      where `<>` represents the letter of the new disk.

   5. Generate a UUID for the block device of the new disk.

      ```
      [<ADMIN> ~]# BLOCK_UUID="$(uuidgen)"
      ```

   6. Create a primary partition on the new disk.

      ```
      [<ADMIN> ~]# parted -s -a optimal ${BLOCK_DEV} mklabel msdos -- mkpart primary ext4 1MiB 100%
      ```

   7. Verify that the partition was created.

      ```
      [<ADMIN> ~]# parted -s ${BLOCK_DEV} print
      ```

   8. Format the partition as ext4.

      ```
      [<ADMIN> ~]# mkfs.ext4 -L ETCD -U ${BLOCK_UUID} ${BLOCK_DEV}1
      ```

   9. Verify that the partition has been formatted with the UUID and the etcd label (output should return the partition with `UUID` and an `ETCD` label).

      ```
      [<ADMIN> ~]# blkid | grep "$BLOCK_UUID"
      ```

   10. Create the mount point of the etcd database.

       ```
       [<ADMIN> ~]# mkdir -p /var/lib/rancher/k3s/server/db
       ```

   11. Set the partition to mount upon operating system startup.

       ```
       [<ADMIN> ~]# echo "UUID=${BLOCK_UUID} /var/lib/rancher/k3s/server/db ext4 defaults 0 0" >> /etc/fstab
       ```

   12. Load the changes to the filesystem.

       ```
       [<ADMIN> ~]# systemctl daemon-reload
       ```

   13. Mount the partition that was added to `/etc/fstab`.

       ```
       [<ADMIN> ~]# mount /var/lib/rancher/k3s/server/db
       ```

       If the output is not empty, stop the procedure. The etcd disk cannot be mounted. Review what was missed in the previous steps.

   14. Verify the partition has been mounted (the output should return the block device and mount point).

       ```
       [<ADMIN> ~]# mount | grep "/var/lib/rancher/k3s/server/db"
       ```

       If the output is empty, stop the procedure. The etcd disk is not mounted. Review what was missed in the previous steps.

   15. If the etcd disk was mounted successfully, reboot the machine.

   </details>

6. <details>
   <summary>Restore the etcd database.</summary>

   1. After the system reboot, reinitialize the ETCD_BACKUP_DIR variable:

      ```
      [<ADMIN> ~]# ETCD_BACKUP_DIR="$(ls -1dt /opt/etcd_data_backup_* | head -n1)"
      ```

   2. Set the etcd root directory variable:

      ```
      [<ADMIN> ~]# ETCD_ROOT_DIR="/var/lib/rancher/k3s/server/db"
      ```

   3. Restore the etcd data using rsync:

      ```
      [<ADMIN> ~]# rsync -avP ${ETCD_BACKUP_DIR}/ ${ETCD_ROOT_DIR}/ && echo -e "\nOK\n" || echo -e "\nFail\n"
      ```

   Ensure that the output confirms a successful operation with `OK`. If it returns `Fail`, verify that both ETCD_BACKUP_DIR and ETCD_ROOT_DIR are correctly set and that the backup directory exists.

   </details>

### Start TOS

1. Start the k3s service.

   ```
   [<ADMIN> ~]# systemctl start k3s.service
   ```

2. Verify that the k3s service started properly. There should be no errors in the command output and the service should be `active (running)`.

   ```
   [<ADMIN> ~]# systemctl status k3s.service
   ```

3. Enable the k3s service.

   ```
   [<ADMIN> ~]# systemctl enable k3s.service
   ```

4. Verify that the k3s service is enabled.

   ```
   [<ADMIN> ~]# systemctl is-enabled k3s.service
   ```

   The output should return `enabled`.

5. **Primary data node only.** Start TOS.

   ```
   [<ADMIN> ~]# tos start
   ```

6. You can now safely exit the tmux session:

   ```
   [<ADMIN> ~]# exit
   ```

### Check the cluster status

1. On the primary data node, check the TOS status.

   ```
   [<ADMIN> ~]$ sudo tos status
   ```

2. In the output, check if the `System Status` is `Ok` and all the items listed under `Components` appear as `ok`. If this is not the case, contact Tufin Support.

   Example output:

   ```
   [<ADMIN> ~]$ tos status
   [Mar 28 13:42:09]  INFO Checking cluster health status
   TOS Aurora
   Tos Version: 25.2 (PRC1.0.0)

   System Status: "Ok"

   Cluster Status:
      Status: "Ok"
      Mode: "High Availability"

   Nodes
     Nodes:
     - ["node1"]
       Type: "Primary"
       Status: "Ok"
       Disk usage:
       - ["/opt"]
         Status: "Ok"
         Usage: 32%
     - ["node3"]
       Type: "Ha Data Node"
       Status: "Ok"
       Disk usage:
       - ["/opt"]
         Status: "Ok"
         Usage: 11%
     - ["node2"]
       Type: "Ha Data Node"
       Status: "Ok"
       Disk usage:
       - ["/opt"]
         Status: "Ok"
         Usage: 11%

   registry
     Expiration ETA: 819 days
     Status: "Ok"

   Infra
   Databases:
   - ["cassandra"]
     Status: "Ok"
   - ["kafka"]
     Status: "Ok"
   - ["mongodb"]
     Status: "Ok"
   - ["mongodb_sc"]
     Status: "Ok"
   - ["ongDb"]
     Status: "Ok"
   - ["postgres"]
     Status: "Ok"
   - [postgres_sc"]
     Status: "Ok"

   Application
   Application Services Status OK
   Running services 54/54

     Backup Storage:
     Location: "Local
   s3:http://minio.default.svc:9000/velerok8s/restic/default "
     Status: "Ok"
     Latest Backup: 2024-03-23 05:00:34 +0000 UTC
   ```
