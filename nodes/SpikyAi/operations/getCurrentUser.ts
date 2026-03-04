import type { IExecuteFunctions, IDataObject, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

export const description: INodeProperties[] = [];

export async function execute(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject> {
	void itemIndex;
	const credentials = await context.getCredentials('spikyAiApi');
	const idToken = credentials.idToken as string | undefined;

	if (!idToken) {
		throw new NodeOperationError(context.getNode(), 'No id_token found in credentials');
	}

	// Decode JWT payload (base64url-encoded, no verification needed — server validates)
	const parts = idToken.split('.');
	if (parts.length !== 3) {
		throw new NodeOperationError(context.getNode(), 'Invalid id_token format');
	}

	const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString()) as IDataObject;

	return {
		sub: payload.sub,
		email: payload.email,
		username: payload['cognito:username'] ?? payload.sub,
		name: payload.name ?? payload.given_name,
		family_name: payload.family_name,
	} as IDataObject;
}
