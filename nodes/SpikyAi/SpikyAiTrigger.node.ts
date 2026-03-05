import type {
	IDataObject,
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import { spikyApiRequest } from './GenericFunctions';
import { SPIKY_ICON } from './icons';

export class SpikyAiTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Spiky AI Trigger',
		name: 'spikyAiTrigger',
		icon: SPIKY_ICON,
		group: ['trigger'],
		version: [1],
		description: 'Triggers when a meeting analysis is ready in Spiky AI',
		defaults: {
			name: 'Spiky AI Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'spikyAiApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				// The Spiky backend stores webhook URLs in a DynamoDB Set.
				// There is no "list subscriptions" endpoint, so we cannot
				// verify. Return false to always re-register on activation
				// (idempotent — the Set ignores duplicates).
				return false;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				if (!webhookUrl) {
					return false;
				}

				await spikyApiRequest.call(this, 'POST', '/n8n/subscription', 'corePlatform', {
					hookUrl: webhookUrl,
				});

				const staticData = this.getWorkflowStaticData('node');
				staticData.hookUrl = webhookUrl;

				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node');
				const hookUrl = staticData.hookUrl as string | undefined;

				if (!hookUrl) {
					return true;
				}

				try {
					await spikyApiRequest.call(
						this,
						'DELETE',
						'/n8n/subscription',
						'corePlatform',
						{ hookUrl },
					);
				} catch {
					// Best-effort cleanup. If the backend is unreachable
					// or the hook was already removed, don't block
					// deactivation.
				}

				delete staticData.hookUrl;
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const body = this.getBodyData() as IDataObject;

		return {
			workflowData: [[{ json: body }]],
		};
	}
}
