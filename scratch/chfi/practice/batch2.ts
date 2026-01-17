#!/usr/bin/env bun

/**
 * Batch 2: Questions 16-30
 * Topics: Logical Structure, Clusters, Lost Clusters, Slack Space, MBR, Partitions, BPB, GPT
 */

import { appendQuestions } from "./append-questions";

const batch2 = [
	{
		question:
			"During forensic analysis, you find a file that occupies 5,500 bytes on an NTFS volume with 4KB clusters. How much slack space exists for this file?",
		options: [
			{ value: "2,596 bytes", isCorrect: true },
			{ value: "4,096 bytes", isCorrect: false },
			{ value: "500 bytes", isCorrect: false },
			{ value: "1,500 bytes", isCorrect: false },
		],
	},
	{
		question:
			"An investigator discovers clusters marked as used in the FAT but not associated with any file. What are these called?",
		options: [
			{ value: "Lost clusters", isCorrect: true },
			{ value: "Bad sectors", isCorrect: false },
			{ value: "Slack clusters", isCorrect: false },
			{ value: "Orphaned inodes", isCorrect: false },
		],
	},
	{
		question:
			"You are examining a disk and need to locate the Master Boot Record. At which sector is the MBR always located?",
		options: [
			{ value: "Sector 0 (LBA 0)", isCorrect: true },
			{ value: "Sector 1 (LBA 1)", isCorrect: false },
			{ value: "Sector 63", isCorrect: false },
			{ value: "Sector 2048", isCorrect: false },
		],
	},
	{
		question:
			"What is the maximum number of primary partitions that can be defined in a traditional MBR partition table?",
		options: [
			{ value: "4", isCorrect: true },
			{ value: "8", isCorrect: false },
			{ value: "16", isCorrect: false },
			{ value: "128", isCorrect: false },
		],
	},
	{
		question:
			"A forensic analyst is examining a GPT disk and needs to find the backup GPT header. Where is it typically located?",
		options: [
			{ value: "Last sector of the disk", isCorrect: true },
			{ value: "Sector 1", isCorrect: false },
			{ value: "Sector 34", isCorrect: false },
			{ value: "Middle of the disk", isCorrect: false },
		],
	},
	{
		question:
			"In an MBR structure, what is the size of the boot code section that contains the bootstrap loader?",
		options: [
			{ value: "446 bytes", isCorrect: true },
			{ value: "512 bytes", isCorrect: false },
			{ value: "64 bytes", isCorrect: false },
			{ value: "2 bytes", isCorrect: false },
		],
	},
	{
		question:
			"You discover a GPT partition table during analysis. How many partition entries can GPT support by default?",
		options: [
			{ value: "128", isCorrect: true },
			{ value: "4", isCorrect: false },
			{ value: "64", isCorrect: false },
			{ value: "256", isCorrect: false },
		],
	},
	{
		question:
			"During forensic examination of a FAT32 volume, where would you find the BIOS Parameter Block (BPB)?",
		options: [
			{
				value: "First sector of the partition (Volume Boot Record)",
				isCorrect: true,
			},
			{ value: "Master Boot Record", isCorrect: false },
			{ value: "Root directory", isCorrect: false },
			{ value: "File Allocation Table", isCorrect: false },
		],
	},
	{
		question:
			"An examiner is analyzing a GPT-formatted disk. What is the purpose of the protective MBR in GPT?",
		options: [
			{
				value: "To prevent GPT-unaware tools from treating the disk as unpartitioned and potentially damaging it",
				isCorrect: true,
			},
			{ value: "To store the primary GPT header", isCorrect: false },
			{ value: "To encrypt the partition table", isCorrect: false },
			{
				value: "To provide backward compatibility with BIOS booting",
				isCorrect: false,
			},
		],
	},
	{
		question:
			"You find evidence of data hiding in slack space. A file of 1,000 bytes is stored on a volume with 4,096-byte clusters. What is the maximum amount of data that could be hidden in the slack space?",
		options: [
			{ value: "3,096 bytes", isCorrect: true },
			{ value: "4,096 bytes", isCorrect: false },
			{ value: "1,000 bytes", isCorrect: false },
			{ value: "5,096 bytes", isCorrect: false },
		],
	},
	{
		question:
			"In the MBR partition table, what is the signature value at offset 0x1FE that indicates a valid boot sector?",
		options: [
			{ value: "0x55AA", isCorrect: true },
			{ value: "0xAA55", isCorrect: false },
			{ value: "0x00FF", isCorrect: false },
			{ value: "0xFFFF", isCorrect: false },
		],
	},
	{
		question:
			"An investigator analyzes a GPT disk and finds each partition entry is 128 bytes. How is each partition uniquely identified in GPT?",
		options: [
			{
				value: "Using a 128-bit GUID (Globally Unique Identifier)",
				isCorrect: true,
			},
			{ value: "Using a partition number from 1-128", isCorrect: false },
			{ value: "Using the starting LBA address", isCorrect: false },
			{ value: "Using a 32-bit partition ID", isCorrect: false },
		],
	},
	{
		question:
			"During analysis, you encounter RAM slack and file slack. Which statement correctly describes RAM slack?",
		options: [
			{
				value: "Data from RAM that fills the space between the end of the file and the end of the sector",
				isCorrect: true,
			},
			{ value: "Unused clusters at the end of a file", isCorrect: false },
			{ value: "Deleted file fragments", isCorrect: false },
			{ value: "Temporary swap space on disk", isCorrect: false },
		],
	},
	{
		question:
			"You need to manually parse an MBR partition table entry. Each partition entry in the MBR is how many bytes?",
		options: [
			{ value: "16 bytes", isCorrect: true },
			{ value: "32 bytes", isCorrect: false },
			{ value: "64 bytes", isCorrect: false },
			{ value: "128 bytes", isCorrect: false },
		],
	},
	{
		question:
			"An examiner is investigating a case where anti-forensic techniques were used. The suspect created multiple hidden partitions. Which tool could help identify all partitions including hidden ones on an MBR disk?",
		options: [
			{ value: "mmls from The Sleuth Kit", isCorrect: true },
			{ value: "fsstat", isCorrect: false },
			{ value: "istat", isCorrect: false },
			{ value: "strings", isCorrect: false },
		],
	},
];

appendQuestions(batch2);
console.log("✅ Batch 2 complete: Questions 16-30 added");
