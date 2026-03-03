import type { IExecuteFunctions, IDataObject, INodeProperties } from 'n8n-workflow';

export const description: INodeProperties[] = [];

export async function execute(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject> {
	void itemIndex;
	const response = await context.helpers.httpRequestWithAuthentication.call(
		context,
		'spikyAiOAuth2Api',
		{
			method: 'GET',
			url: 'https://prod-spiky-app.auth.us-east-2.amazoncognito.com/oauth2/userInfo',
			json: true,
		},
	);
	return response as IDataObject;
}
