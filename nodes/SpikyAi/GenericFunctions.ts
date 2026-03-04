import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	IWebhookFunctions,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

type SpikyApiContext = IExecuteFunctions | IHookFunctions | IWebhookFunctions;

export async function spikyApiRequest(
	this: SpikyApiContext,
	method: IHttpRequestMethods,
	endpoint: string,
	baseUrlKey: 'corePlatform' | 'platform',
	body?: IDataObject,
	qs?: IDataObject,
): Promise<IDataObject | IDataObject[]> {
	const credentials = await this.getCredentials('spikyAiOAuth2Api');

	const fieldName = baseUrlKey === 'corePlatform' ? 'corePlatformBaseUrl' : 'platformBaseUrl';
	const baseUrl = (credentials[fieldName] as string).replace(/\/+$/, '');

	const oauthTokenData = credentials.oauthTokenData as IDataObject | undefined;
	const idToken = oauthTokenData?.id_token as string | undefined;
	if (!idToken) {
		throw new NodeOperationError(this.getNode(), 'No id_token found in OAuth credentials');
	}

	const url = `${baseUrl}${endpoint}`;

	const options: IHttpRequestOptions = {
		method,
		url,
		json: true,
		headers: {
			Authorization: `Bearer ${idToken}`,
		},
	};

	if (body && Object.keys(body).length > 0) {
		options.body = body;
	}

	if (qs && Object.keys(qs).length > 0) {
		options.qs = qs;
	}

	try {
		return (await this.helpers.httpRequest(options)) as IDataObject | IDataObject[];
	} catch (error) {
		const err = error as { message?: string; statusCode?: number };
		this.logger.error(`[SpikyAI] ${method} ${url} failed`, {
			statusCode: err.statusCode,
			message: err.message,
		});
		throw error;
	}
}
