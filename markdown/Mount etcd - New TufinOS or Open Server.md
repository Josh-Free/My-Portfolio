---
title: "Mount etcd - New TufinOS or Open Server"
source_url: https://forum.tufin.com/support/kc/latest/Content/ST2/ManagingTOS/etcd/etcdSplit_VM_New.htm
---

# Mount etcd - New TufinOS or Open Server

This procedure is required for all clusters, including remote collector clusters, and is run on data nodes only.

The Kubernetes etcd database must be on a separate disk to give it access to all the resources required for optimal TOS performance, stability and minimal latency.

This procedure must be performed by an experienced Linux administrator with knowledge of network and storage configuration.

This procedure is for a stand-alone environment with a single data node. If you have a high availability deployment, see [Move etcd - HA TufinOS or Open Server](https://forum.tufin.com/support/kc/latest/Content/ST2/ManagingTOS/etcd/etcdSplit_VM_HA.htm).

## Preliminary preparations

1. Switch to the root user.

   ```
   [<ADMIN> ~]$ sudo su -
   ```

2. Install the `rsync` RPM.

   ```
   [<ADMIN> ~]$ dnf install rsync
   ```

3. Find the name of the last disk added to the VM.

   ```
   [<ADMIN> ~]# lsblk -ndl -o NAME
   ```

   The output returns the list of disks on the VM. The last letter of the disk name indicates in which it was added, for example: `sda`, `sdb`, `sdc`.

4. Save the name of the last disk in a separate location. You will need it later for verification purposes.

## Mount the etcd database to a separate disk

1. <details>
   <summary>Add a disk to the VMWare ESXI machine.</summary>

   1. Add a new disk that meets the following requirements

      - **Storage**: 50 GB

      - **Performance:** High-performance storage

      - **SSD:** at least 7,500 IOPS and 250 MB/s throughput or higher

      - **Disk Provisioning:** Thin Provisioning

      - **Sharing:** No Sharing

      - **Limit - IOPs:** Unlimited

      - **Disk Mode:** Independent - Persistent

   </details>

2. <details>
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

   16. You can now safely exit the tmux session:

       ```
       [<ADMIN> ~]# exit
       ```

   </details>

3. <details>
   <summary>Install TOS.</summary>

   See [Prepare a VMware ESXi Machine](https://forum.tufin.com/support/kc/latest/Content/ST2/ManagingTOS/Prepare-TufinOS4.htm)

   Or

   [Prepare an Open Server](https://forum.tufin.com/support/kc/latest/Content/ST2/ManagingTOS/Prepare-OpenServer.htm)

   </details>

4. <details>
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
