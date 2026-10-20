---
title: "Move etcd - In-place AWS Instance"
source_url: https://forum.tufin.com/support/kc/latest/Content/ST2/ManagingTOS/etcd/etcdSplit_AWS_InPlace.htm
---

# Move etcd - In-place AWS Instance

## Overview

This procedure is required for all clusters, including remote collector clusters, and is run on data nodes only.

The Kubernetes etcd database must be on a separate volume to give it access to all the resources required for optimal TOS performance, stability and minimal latency.

This procedure must be performed by an experienced Linux administrator with knowledge of network and storage configuration.

## Preliminary preparations

1. Run the following command:

   ```
   lsblk | grep "/var/lib/rancher/k3s/server/db"
   ```

   If the output contains `/var/lib/rancher/k3s/server/db`, etcd is already on a separate volume, and you do not need to perform this procedure.

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

## Mount the etcd database to a separate volume

1. <details>
   <summary>Shut down TOS.</summary>

   1. Stop TOS

      ```
      [<ADMIN> ~]$sudo tos stop
      ```

   2. Wait for the following message:

      ```
      Deployment has been stopped successfully
      ```

   3. Stop the k3s service.

      ```
      [<ADMIN> ~]# systemctl stop k3s.service
      ```

   4. Disable the k3s service.

      ```
      [<ADMIN> ~]# systemctl disable k3s.service
      ```

   5. Verify that the k3s service is stopped and disabled.

      ```
      [<ADMIN> ~]# systemctl is-active k3s.service
      ```

      Output should return `inactive`.

      ```
      [<ADMIN> ~]# systemctl is-enabled k3s.service
      ```

      Output should return `disabled`.

   </details>

2. <details>
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

3. <details>
   <summary>Locate the etcd database.</summary>

   The purpose of this step is to identify whether the etcd database is located in the `k3s` directory, or whether due to older architecture the etcd database is located in the `gravity` directory.

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

      2. Proceed to [back up the etcd database](https://forum.tufin.com/support/kc/latest/Content/ST2/ManagingTOS/etcd/etcdSplit_AWS_InPlace.htm#Backup).

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

      2. Proceed to [back up the etcd database](https://forum.tufin.com/support/kc/latest/Content/ST2/ManagingTOS/etcd/etcdSplit_AWS_InPlace.htm#Backup).

      If the output returns `Etcd directory does not exist`, this indicates that the etcd database could not be found. Stop the procedure and contact customer support.

   </details>

4. <details>
   <summary>Back up the etcd database.</summary>

   1. Back up the etcd database to the backup directory you created.

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

5. <details>
   <summary>Add a volume to the AWS instance.</summary>

   1. In the AWS instance navigation pane, go to **Volumes** pane, and click **Create Volume**.

   2. Configure the following settings:

      - **Volume type**: SSD gp3

      - **Size:** Allocate a disk size of at least 50 GB

      - **IOPS:** 7500

      - **Availability Zone**: Same availability zone as instance

      - **Throughput:** 250 MBps

      - **Snapshot ID:** Keep the default value

      - **Encryption**: If the volume is encrypted, it can only be attached to an instance type that supports Amazon EBS encryption.

   3. Click **Create Volume**.

   4. In the navigation pane, go to **Volumes** pane, and click **Actions &gt; Attach Volume**.

   5. In **Instance**, enter the ID of the instance or select the instance from the list of options.

   6. In **Device name**, select an available device name from the **Recommended for data volumes** section of the list.

      The device name is used by Amazon EC2. The block device driver for the instance might assign a different device name when mounting the volume.

   7. Connect to the instance and proceed to the next step.

   </details>

6. <details>
   <summary>Mount the new volume.</summary>

   1. 1. Log into the data node as the root user.

      2. Run the [tmux command.](https://forum.tufin.com/support/kc/latest/Content/ST2/ManagingTOS/tmuxCommand.htm)

         ```
         [<ADMIN> ~]$ tmux new-session -s etcd
         ```

      3. Verify that the new volume s recognized by the the OS.

         ```
         [<ADMIN> ~]# lsblk
         ```

         ```
         [<ADMIN> ~]# ls -l /dev/nvme*
         ```

         Compare the output with the name of the volume you created in the previous step, and verify that the index number in the volume name is the latest number. In most cases this will be 1. For example, if this is the only volume the output will be `nvme1n1`. If an older volume was previously created, the index number will be `nvme2n1`.

      4. Create a variable with the block device path of the new volume.

         ```
         [<ADMIN> ~]# BLOCK_DEV="/dev/nvme<>"
         ```

         where `<>` represents the index number of the new volume.

      5. Generate a UUID for the block device of the new volume.

         ```
         [<ADMIN> ~]# BLOCK_UUID="$(uuidgen)"
         ```

      6. Create a primary partition on the new volume.

         ```
         [<ADMIN> ~]# parted -s -a optimal ${BLOCK_DEV} mklabel msdos -- mkpart primary ext4 1MiB 100%
         ```

      7. Verify that the partition was created.

         ```
         [<ADMIN> ~]# parted -s ${BLOCK_DEV} print
         ```

      8. Format the partition as ext4.

         ```
         [<ADMIN> ~]# mkfs.ext4 -L ETCD -U ${BLOCK_UUID} ${BLOCK_DEV}p1
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

          If the output is not empty, stop the procedure. The etcd volume cannot be mounted. Review what was missed in the previous steps.

      14. Verify the partition has been mounted (the output should return the block device and mount point).

          ```
          [<ADMIN> ~]# mount | grep "/var/lib/rancher/k3s/server/db"
          ```

          If the output is empty, stop the procedure. The etcd volume is not mounted. Review what was missed in the previous steps.

   </details>

7. <details>
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

8. <details>
   <summary>Start TOS</summary>

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

   5. Start TOS.

      ```
      [<ADMIN> ~]# tos start
      ```

   6. You can now safely exit the tmux session:

      ```
      [<ADMIN> ~]# exit
      ```

   </details>

9. <details>
   <summary>Check the cluster status.</summary>

   1. On the primary data node, check the TOS status.

      ```
      [<ADMIN> ~]$ sudo tos status
      ```

   2. In the output, check if the `System Status` is `Ok` and all the items listed under `Components` appear as `Ok`. If this is not the case, contact Tufin Support.

      Example output for a central cluster data node:

      ```
      [<ADMIN> ~]$ tos status
      [Mar 28 13:42:09]  INFO Checking cluster health status
      TOS Aurora
      Tos Version: 25.2 (PRC1.0.0)

      System Status: "Ok"

      Cluster Status:
         Status: "Ok"
         Mode: "Multi Node"

      Nodes
        Nodes:
        - ["node1"]
          Type: "Primary"
          Status: "Ok"
          Disk usage:
          - ["/opt"]
            Status: "Ok"
            Usage: 19%
        - ["node3"]
          Type: "Worker Node"
          Status: "Ok"
          Disk usage:
          - ["/opt"]
            Status: "Ok"
            Usage: 4%

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
      - ["postgres_sc"]
        Status: "Ok"

      Application
      Application Services Status OK
      Running services 50/50

      Remote Clusters
      Number Of Remote Clusters: 2
        - ["RC"]
           Connectivity Status:: "OK:"
        - ["RC2"]
           Connectivity Status:: "OK"

        Backup Storage:
        Location: "Local
      s3:http://minio.default.svc:9000/velerok8s/restic/default "
        Status: "Ok"
        Latest Backup: 2024-03-23 05:00:34 +0000 UTC
      ```

      Example output for a remote collector cluster data node:

      ```
      [<ADMIN> ~]$ tos status
      [Mar 28 13:42:09]  INFO Checking cluster health status
      TOS Aurora
      Tos Version: 25.2 (PRC1.0.0)

      System Status: "Ok"

      Cluster Status:
         Status: "Ok"
         Mode: "Single Node"

      Nodes
        Nodes:
        - ["node2"]
          Type: "Primary"
          Status: "Ok"
          Disk usage:
          - ["/opt"]
            Status: "Ok"
            Usage: 19%

      registry
        Expiration ETA: 819 days
        Status: "Ok"

      Infra
      Databases:
      - ["mongodb"]
        Status: "Ok"
      - ["postgres"]
        Status: "Ok"

      Application
      Application Services Status OK
      Running services 16/16

        Backup Storage:
        Location: "Local
      s3:http://minio.default.svc:9000/velerok8s/restic/default "
        Status: "Ok"
        Latest Backup: 2024-03-23 05:00:34 +0000 UTC
      ```

   </details>
