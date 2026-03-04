import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class SpikyAiOAuth2Api implements ICredentialType {
	name = 'spikyAiOAuth2Api';
	displayName = 'Spiky AI OAuth2 API';
	icon = { light: 'file:spikyAi.svg', dark: 'file:spikyAi.dark.svg' } as const;
	extends = ['oAuth2Api'];
	documentationUrl = 'https://spiky.ai';

	properties: INodeProperties[] = [
		{
			displayName: 'Core Platform API Base URL',
			name: 'corePlatformBaseUrl',
			type: 'string',
			default: 'https://n86lv9o68k.execute-api.us-east-2.amazonaws.com/prod',
			description:
				'Base URL for the Spiky Core Platform API (webhook subscriptions). Only change this for non-production environments.',
		},
		{
			displayName: 'Platform API Base URL',
			name: 'platformBaseUrl',
			type: 'string',
			default: 'https://btrh2q3utg.execute-api.us-east-2.amazonaws.com/prod',
			description:
				'Base URL for the Spiky Platform API (meeting reports). Only change this for non-production environments.',
		},
		{
			displayName: 'Grant Type',
			name: 'grantType',
			type: 'hidden',
			default: 'authorizationCode',
		},
		{
			displayName: 'Authorization URL',
			name: 'authUrl',
			type: 'hidden',
			default:
				'https://prod-spiky-app.auth.us-east-2.amazoncognito.com/oauth2/authorize',
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'hidden',
			default:
				'https://prod-spiky-app.auth.us-east-2.amazoncognito.com/oauth2/token',
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'hidden',
			default: 'openid profile email',
		},
		{
			displayName: 'Auth URI Query Parameters',
			name: 'authQueryParameters',
			type: 'hidden',
			default: '',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden',
			default: 'body',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.oauthTokenData.id_token}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			url: 'https://prod-spiky-app.auth.us-east-2.amazoncognito.com/oauth2/userInfo',
		},
	};
}
