#!/usr/bin/env bun

/**
 * Batch 1: Questions 1-15
 * Topics: Disk Drives, HDD, SSD, Tracks, Sectors, 4K Sectors, LBA, Disk Performance
 */

import { appendQuestions } from "./append-questions";

const batch1 = [
	{
		question:
			"A forensic investigator is analyzing a 1TB hard disk drive. The drive has 500GB of data stored on the outer tracks and 300GB on the inner tracks. Which performance characteristic explains why accessing outer track data is faster?",
		options: [
			{
				value: "Outer tracks have higher linear velocity and can store more data per rotation",
				isCorrect: true,
			},
			{
				value: "Inner tracks have lower rotational latency",
				isCorrect: false,
			},
			{
				value: "Outer tracks use smaller sector sizes",
				isCorrect: false,
			},
			{
				value: "Inner tracks have higher areal density",
				isCorrect: false,
			},
		],
	},
	{
		question:
			"During a forensic examination, you discover a disk with LBA address 2048. If each sector is 512 bytes, what is the byte offset of this sector from the beginning of the disk?",
		options: [
			{ value: "1,048,576 bytes", isCorrect: true },
			{ value: "2,048 bytes", isCorrect: false },
			{ value: "524,288 bytes", isCorrect: false },
			{ value: "4,096 bytes", isCorrect: false },
		],
	},
	{
		question:
			"Which disk measurement represents the number of tracks per inch (TPI) multiplied by the number of bits per inch (BPI)?",
		options: [
			{ value: "Areal density", isCorrect: true },
			{ value: "Track density", isCorrect: false },
			{ value: "Bit density", isCorrect: false },
			{ value: "Sector density", isCorrect: false },
		],
	},
	{
		question:
			"An investigator needs to image an enterprise-grade server using a high-performance interface that supports up to 12 Gbps transfer speeds and uses point-to-point connections. Which interface should be used?",
		options: [
			{ value: "Serial Attached SCSI (SAS)", isCorrect: true },
			{ value: "SATA III", isCorrect: false },
			{ value: "IDE/PATA", isCorrect: false },
			{ value: "USB 3.0", isCorrect: false },
		],
	},
	{
		question:
			"A suspect's computer has an NVMe SSD installed. Which interface does NVMe primarily use to achieve superior performance compared to SATA SSDs?",
		options: [
			{ value: "PCIe (PCI Express)", isCorrect: true },
			{ value: "AHCI protocol over SATA", isCorrect: false },
			{ value: "SCSI protocol", isCorrect: false },
			{ value: "USB 4.0", isCorrect: false },
		],
	},
	{
		question:
			"You are examining a modern hard disk that uses 4K sectors (Advanced Format). What is the primary advantage of 4K sectors over traditional 512-byte sectors?",
		options: [
			{
				value: "Reduced overhead from fewer ECC bytes and sector headers, improving storage efficiency",
				isCorrect: true,
			},
			{ value: "Faster rotational speed", isCorrect: false },
			{
				value: "Compatibility with all legacy BIOS systems",
				isCorrect: false,
			},
			{ value: "Lower manufacturing cost", isCorrect: false },
		],
	},
	{
		question:
			"During disk analysis, you encounter log entries showing IOPS values. What does IOPS measure in disk performance?",
		options: [
			{ value: "Input/Output Operations Per Second", isCorrect: true },
			{ value: "Integrated Operating Process Speed", isCorrect: false },
			{ value: "Internal Output Processing System", isCorrect: false },
			{ value: "Indexed Operation Protocol Standard", isCorrect: false },
		],
	},
	{
		question:
			"An investigator is imaging a suspect's laptop with an SSD. Compared to traditional HDDs, what characteristic of SSDs makes data recovery of deleted files significantly more challenging?",
		options: [
			{
				value: "TRIM command that immediately marks deleted blocks for garbage collection",
				isCorrect: true,
			},
			{ value: "Faster read speeds", isCorrect: false },
			{ value: "Lack of magnetic platters", isCorrect: false },
			{ value: "Use of NAND flash memory", isCorrect: false },
		],
	},
	{
		question:
			"You discover a disk in a RAID array with the following specifications: 7200 RPM, 64MB cache, 6 Gbps interface. The interface speed is most likely which standard?",
		options: [
			{ value: "SATA III", isCorrect: true },
			{ value: "SATA II", isCorrect: false },
			{ value: "SCSI Ultra320", isCorrect: false },
			{ value: "IDE/ATA-6", isCorrect: false },
		],
	},
	{
		question:
			"A forensic examiner calculates disk capacity using LBA. If a disk has 976,773,168 sectors and each sector is 512 bytes, what is the approximate capacity?",
		options: [
			{ value: "500 GB", isCorrect: true },
			{ value: "1 TB", isCorrect: false },
			{ value: "250 GB", isCorrect: false },
			{ value: "2 TB", isCorrect: false },
		],
	},
	{
		question:
			"During incident response, you need to acquire data from a high-performance NVMe drive. Which tool command would properly identify the NVMe namespace?",
		options: [
			{ value: "nvme list", isCorrect: true },
			{ value: "lsblk --nvme", isCorrect: false },
			{ value: "fdisk -l /dev/nvme", isCorrect: false },
			{ value: "hdparm -I /dev/nvme0", isCorrect: false },
		],
	},
	{
		question:
			"In a forensic lab, you are comparing SSD and HDD performance metrics. Which metric would be significantly better for SSDs?",
		options: [
			{ value: "Random read/write access time", isCorrect: true },
			{ value: "Sequential write endurance over time", isCorrect: false },
			{ value: "Data retention without power", isCorrect: false },
			{ value: "Cost per gigabyte", isCorrect: false },
		],
	},
	{
		question:
			"A suspect's system uses AHCI (Advanced Host Controller Interface). Which disk interface does AHCI primarily support?",
		options: [
			{ value: "SATA", isCorrect: true },
			{ value: "NVMe", isCorrect: false },
			{ value: "SCSI", isCorrect: false },
			{ value: "IDE", isCorrect: false },
		],
	},
	{
		question:
			"You are analyzing a disk's geometry and find the following: 16,383 cylinders, 16 heads, and 63 sectors per track. This geometry limitation indicates which addressing method?",
		options: [
			{
				value: "CHS (Cylinder-Head-Sector) addressing with BIOS limitations",
				isCorrect: true,
			},
			{ value: "Pure LBA addressing", isCorrect: false },
			{ value: "GPT addressing", isCorrect: false },
			{ value: "UEFI-based addressing", isCorrect: false },
		],
	},
	{
		question:
			"An examiner encounters a wear-leveling log on an SSD during forensic analysis. What is the primary purpose of wear leveling in SSDs?",
		options: [
			{
				value: "To distribute write and erase cycles evenly across memory cells to extend drive lifespan",
				isCorrect: true,
			},
			{
				value: "To improve sequential read performance",
				isCorrect: false,
			},
			{ value: "To encrypt data at rest", isCorrect: false },
			{
				value: "To compress data for better storage efficiency",
				isCorrect: false,
			},
		],
	},
];

appendQuestions(batch1);
console.log("✅ Batch 1 complete: Questions 1-15 added");
