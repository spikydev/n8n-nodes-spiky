import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

export class SpikyAi implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Spiky AI',
		name: 'spikyAi',
		icon: { light: 'file:spikyAi.svg', dark: 'file:spikyAi.dark.svg' },
		group: ['input'],
		version: [1],
		description: 'Interact with Spiky AI meeting intelligence platform',
		defaults: {
			name: 'Spiky AI',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'spikyAiOAuth2Api',
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
				],
				default: 'getCurrentUser',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				if (operation === 'getCurrentUser') {
					const response = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'spikyAiOAuth2Api',
						{
							method: 'GET',
							url: 'https://prod-spiky-app.auth.us-east-2.amazoncognito.com/oauth2/userInfo',
							json: true,
						},
					);
					returnData.push({ json: response as INodeExecutionData['json'] });
				}
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
