import type {
	IAuthenticateGeneric,
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IHttpRequestHelper,
	INodeProperties,
} from 'n8n-workflow';

import { SPIKY_ICON } from '../nodes/SpikyAi/icons';

export class SpikyAiApi implements ICredentialType {
	name = 'spikyAiApi';
	displayName = 'Spiky AI API';
	icon = SPIKY_ICON;
	documentationUrl = 'https://spiky.ai';

	properties: INodeProperties[] = [
		{
			displayName: 'Email',
			name: 'email',
			type: 'string',
			placeholder: 'name@example.com',
			default: '',
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: { password: true },
			default: '',
		},
		{
			displayName: 'Cognito Client ID',
			name: 'cognitoClientId',
			type: 'string',
			default: '215131dkhgebjfevrn9k5ql61r',
			description:
				'The Cognito App Client ID configured for n8n integration. Only change for non-production environments.',
		},
		{
			displayName: 'ID Token',
			name: 'idToken',
			type: 'hidden',
			typeOptions: {
				expirable: true,
			},
			default: '',
		},
		{
			displayName: 'Refresh Token',
			name: 'refreshToken',
			type: 'hidden',
			typeOptions: {
				password: true,
			},
			default: '',
		},
		{
			displayName: 'Backend API Base URL',
			name: 'backendBaseUrl',
			type: 'string',
			default: 'https://backend-api.spiky.ai',
			description:
				'Base URL for the Spiky Backend API (authentication). Only change for non-production environments.',
		},
		{
			displayName: 'Core Platform API Base URL',
			name: 'corePlatformBaseUrl',
			type: 'string',
			default: 'https://n86lv9o68k.execute-api.us-east-2.amazonaws.com/prod',
			description:
				'Base URL for the Spiky Core Platform API (webhook subscriptions). Only change for non-production environments.',
		},
		{
			displayName: 'Platform API Base URL',
			name: 'platformBaseUrl',
			type: 'string',
			default: 'https://btrh2q3utg.execute-api.us-east-2.amazonaws.com/prod',
			description:
				'Base URL for the Spiky Platform API (meeting reports). Only change for non-production environments.',
		},
	];

	async preAuthentication(
		this: IHttpRequestHelper,
		credentials: ICredentialDataDecryptedObject,
	): Promise<ICredentialDataDecryptedObject> {
		const backendUrl = (credentials.backendBaseUrl as string).replace(/\/+$/, '');
		const cognitoClientId = credentials.cognitoClientId as string;
		const refreshToken = credentials.refreshToken as string | undefined;

		// Try refresh first if we have a refresh token
		if (refreshToken) {
			try {
				const refreshResponse = (await this.helpers.httpRequest({
					method: 'POST',
					url: `${backendUrl}/api/v1/auth/refresh-token`,
					body: {
						refresh_token: refreshToken,
						cognito_client_id: cognitoClientId,
					},
					json: true,
				})) as { id_token: string };

				return { idToken: refreshResponse.id_token };
			} catch {
				// Refresh failed (token expired or revoked), fall through to full login
			}
		}

		// Full login
		const loginResponse = (await this.helpers.httpRequest({
			method: 'POST',
			url: `${backendUrl}/api/v1/auth/login`,
			body: {
				email: credentials.email,
				password: credentials.password,
				cognito_client_id: cognitoClientId,
			},
			json: true,
		})) as {
			is_signed_in: boolean;
			tokens: {
				id_token: string;
				refresh_token: string;
			} | null;
			challenge: { challenge_name: string } | null;
		};

		if (!loginResponse.is_signed_in || !loginResponse.tokens) {
			const challengeName = loginResponse.challenge?.challenge_name ?? 'unknown';
			throw new Error(
				`Login failed: authentication challenge required (${challengeName}). Please complete the challenge in the Spiky web app first.`,
			);
		}

		return {
			idToken: loginResponse.tokens.id_token,
			refreshToken: loginResponse.tokens.refresh_token,
		};
	}

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.idToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials?.platformBaseUrl}}',
			url: '/platform/tags',
			qs: {
				populateMeetingData: 'false',
			},
		},
	};
}
