import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import * as getCurrentUser from './operations/getCurrentUser';
import * as uploadRecording from './operations/uploadRecording';
import { SPIKY_ICON } from './icons';

export class SpikyAi implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Spiky AI',
		name: 'spikyAi',
		icon: SPIKY_ICON,
		group: ['input'],
		version: [1],
		description: 'Interact with Spiky AI meeting intelligence platform',
		defaults: {
			name: 'Spiky AI',
		},
		subtitle: '={{$parameter["operation"]}}',
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'spikyAiApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Get Current User',
						value: 'getCurrentUser',
						description: 'Get the currently authenticated user info',
						action: 'Get the currently authenticated user info',
					},
					{
						name: 'Upload Recording',
						value: 'uploadRecording',
						description: 'Submit a call recording URL for analysis',
						action: 'Submit a call recording URL for analysis',
					},
				],
				default: 'getCurrentUser',
			},
			...getCurrentUser.description,
			...uploadRecording.description,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;

		const operations: Record<
			string,
			(ctx: IExecuteFunctions, i: number) => Promise<INodeExecutionData['json']>
		> = {
			getCurrentUser: getCurrentUser.execute,
			uploadRecording: uploadRecording.execute,
		};

		const handler = operations[operation];

		for (let i = 0; i < items.length; i++) {
			try {
				const result = await handler(this, i);
				returnData.push({ json: result });
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message }, pairedItem: i });
				} else {
					throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
				}
			}
		}

		return [returnData];
	}
}
