import { SpikyAiOAuth2Api } from '../credentials/SpikyAiOAuth2Api.credentials';

describe('SpikyAiOAuth2Api credential', () => {
	let credential: SpikyAiOAuth2Api;

	beforeEach(() => {
		credential = new SpikyAiOAuth2Api();
	});

	it('should extend oAuth2Api', () => {
		expect(credential.extends).toEqual(['oAuth2Api']);
	});

	it('should use Cognito authorization endpoint', () => {
		const authUrl = credential.properties.find((p) => p.name === 'authUrl');
		expect(authUrl?.default).toBe(
			'https://prod-spiky-app.auth.us-east-2.amazoncognito.com/oauth2/authorize',
		);
	});

	it('should use Cognito token endpoint', () => {
		const tokenUrl = credential.properties.find((p) => p.name === 'accessTokenUrl');
		expect(tokenUrl?.default).toBe(
			'https://prod-spiky-app.auth.us-east-2.amazoncognito.com/oauth2/token',
		);
	});

	it('should request openid profile email scopes', () => {
		const scope = credential.properties.find((p) => p.name === 'scope');
		expect(scope?.default).toBe('openid profile email');
	});

	it('should use authorization code grant type', () => {
		const grantType = credential.properties.find((p) => p.name === 'grantType');
		expect(grantType?.default).toBe('authorizationCode');
	});

	it('should authenticate with id_token (not access_token)', () => {
		expect(credential.authenticate).toEqual({
			type: 'generic',
			properties: {
				headers: {
					Authorization: '=Bearer {{$credentials.oauthTokenData.id_token}}',
				},
			},
		});
	});

	it('should test against Cognito userInfo endpoint', () => {
		expect(credential.test).toEqual({
			request: {
				url: 'https://prod-spiky-app.auth.us-east-2.amazoncognito.com/oauth2/userInfo',
			},
		});
	});

	it('should have configurable base URL fields with production defaults', () => {
		const corePlatform = credential.properties.find((p) => p.name === 'corePlatformBaseUrl');
		const platform = credential.properties.find((p) => p.name === 'platformBaseUrl');

		expect(corePlatform?.type).toBe('string');
		expect(corePlatform?.default).toBe(
			'https://n86lv9o68k.execute-api.us-east-2.amazonaws.com/prod',
		);

		expect(platform?.type).toBe('string');
		expect(platform?.default).toBe(
			'https://btrh2q3utg.execute-api.us-east-2.amazonaws.com/prod',
		);
	});
});
