import type { IExecuteFunctions, IDataObject, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { spikyApiRequest } from '../GenericFunctions';

export const description: INodeProperties[] = [
	{
		displayName: 'Recording URL',
		name: 'recordingUrl',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://example.com/recording.mp4',
		description: 'Public URL of the call recording to analyze',
		displayOptions: {
			show: {
				operation: ['uploadRecording'],
			},
		},
	},
	{
		displayName: 'Meeting Name',
		name: 'meetingName',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Weekly Standup',
		description: 'Name for the meeting',
		displayOptions: {
			show: {
				operation: ['uploadRecording'],
			},
		},
	},
	{
		displayName: 'Meeting Date',
		name: 'meetingDate',
		type: 'dateTime',
		default: '',
		description: 'Date and time of the meeting. Defaults to now if not provided.',
		displayOptions: {
			show: {
				operation: ['uploadRecording'],
			},
		},
	},
	{
		displayName: 'Tags',
		name: 'tags',
		type: 'string',
		default: '',
		placeholder: 'sales, demo, follow-up',
		description:
			'Comma-separated tag names (max 3). Existing tags are matched by name; new tags are created automatically.',
		displayOptions: {
			show: {
				operation: ['uploadRecording'],
			},
		},
	},
];

export async function execute(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject> {
	const recordingUrl = context.getNodeParameter('recordingUrl', itemIndex) as string;
	const meetingName = context.getNodeParameter('meetingName', itemIndex) as string;
	const meetingDateRaw = context.getNodeParameter('meetingDate', itemIndex) as string;
	const tagsRaw = context.getNodeParameter('tags', itemIndex) as string;

	const meetingDate = meetingDateRaw
		? new Date(meetingDateRaw).toISOString()
		: new Date().toISOString();

	// Step 1: Calculate call chunks (HEAD request to get file size → part count)
	let chunkResponse: IDataObject;
	try {
		chunkResponse = (await spikyApiRequest.call(
			context,
			'POST',
			'/zapier/calculate_call_chunks',
			'corePlatform',
			{ body: { record_url: recordingUrl } } as IDataObject,
		)) as IDataObject;
	} catch (error) {
		throw new NodeOperationError(
			context.getNode(),
			`Step 1/4 failed: calculate_call_chunks — ${(error as Error).message}`,
			{ itemIndex },
		);
	}

	const parts = chunkResponse.parts as number;

	// Step 2: Resolve tags (match existing by name, create missing ones)
	let tagIds: string[];
	try {
		tagIds = await resolveTags(context, tagsRaw);
	} catch (error) {
		throw new NodeOperationError(
			context.getNode(),
			`Step 2/4 failed: resolve tags — ${(error as Error).message}`,
			{ itemIndex },
		);
	}

	// Step 3: Create meeting report (returns pre-signed S3 upload URLs)
	const meetingBody: IDataObject = {
		meetingName,
		meetingDate,
		uploadPartCount: parts,
		integrationName: 'N8N',
	};

	if (tagIds.length > 0) {
		meetingBody.tags = tagIds;
	}

	let meetingResponse: IDataObject;
	try {
		meetingResponse = (await spikyApiRequest.call(
			context,
			'POST',
			'/platform/meeting-reports',
			'platform',
			meetingBody,
		)) as IDataObject;
	} catch (error) {
		throw new NodeOperationError(
			context.getNode(),
			`Step 3/4 failed: create meeting report — ${(error as Error).message}`,
			{ itemIndex },
		);
	}

	const meetingAnalysis = meetingResponse.meetingAnalysis as IDataObject;
	const s3UploadURL = meetingResponse.s3UploadURL;

	// Step 4: Upload call recording (Lambda downloads from URL and uploads to S3)
	try {
		await spikyApiRequest.call(
			context,
			'POST',
			'/zapier/upload_call_recording',
			'corePlatform',
			{
				body: {
					record_url: recordingUrl,
					meeting: { s3UploadURL },
				},
			} as IDataObject,
		);
	} catch (error) {
		throw new NodeOperationError(
			context.getNode(),
			`Step 4/4 failed: upload call recording — ${(error as Error).message}`,
			{ itemIndex },
		);
	}

	return {
		meeting_id: meetingAnalysis.id,
		meeting_name: meetingAnalysis.meetingName,
		meeting_date: meetingAnalysis.meetingDate,
		status: 'upload_in_progress',
	};
}

async function resolveTags(
	context: IExecuteFunctions,
	tagsRaw: string,
): Promise<string[]> {
	if (!tagsRaw.trim()) {
		return [];
	}

	const tagNames = tagsRaw
		.split(',')
		.map((t) => t.trim())
		.filter((t) => t.length > 0)
		.slice(0, 3);

	if (tagNames.length === 0) {
		return [];
	}

	// Fetch existing company tags
	const existingTags = (await spikyApiRequest.call(
		context,
		'GET',
		'/platform/tags',
		'platform',
	)) as IDataObject[];

	const tagIds: string[] = [];

	for (const name of tagNames) {
		const existing = existingTags.find(
			(t) => (t.tagName as string).toLowerCase() === name.toLowerCase(),
		);

		if (existing) {
			tagIds.push(existing.id as string);
		} else {
			// Create the tag
			const created = (await spikyApiRequest.call(
				context,
				'POST',
				'/platform/tags',
				'platform',
				{ tagName: name } as IDataObject,
			)) as IDataObject;
			tagIds.push(created.id as string);
		}
	}

	return tagIds;
}
