import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	IWebhookFunctions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

type SpikyApiContext = IExecuteFunctions | IHookFunctions | IWebhookFunctions;

export async function spikyApiRequest(
	this: SpikyApiContext,
	method: IHttpRequestMethods,
	endpoint: string,
	baseUrlKey: 'corePlatform' | 'platform',
	body?: IDataObject,
	qs?: IDataObject,
): Promise<IDataObject | IDataObject[]> {
	const credentials = await this.getCredentials('spikyAiApi');

	const fieldName = baseUrlKey === 'corePlatform' ? 'corePlatformBaseUrl' : 'platformBaseUrl';
	const baseUrl = (credentials[fieldName] as string).replace(/\/+$/, '');

	const url = `${baseUrl}${endpoint}`;

	const options: IHttpRequestOptions = {
		method,
		url,
		json: true,
	};

	if (body && Object.keys(body).length > 0) {
		options.body = body;
	}

	if (qs && Object.keys(qs).length > 0) {
		options.qs = qs;
	}

	try {
		return (await this.helpers.httpRequestWithAuthentication.call(
			this,
			'spikyAiApi',
			options,
		)) as IDataObject | IDataObject[];
	} catch (error) {
		const err = error as {
			message?: string;
			statusCode?: number;
			cause?: { response?: { data?: unknown } };
			response?: { data?: unknown };
		};
		const responseBody = err.cause?.response?.data ?? err.response?.data;
		this.logger.error(`[SpikyAI] ${method} ${url} failed`, {
			statusCode: err.statusCode,
			message: err.message,
			responseBody: responseBody ? JSON.stringify(responseBody) : undefined,
		});
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}
