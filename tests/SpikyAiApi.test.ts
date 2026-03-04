import { SpikyAiApi } from '../credentials/SpikyAiApi.credentials';

describe('SpikyAiApi credential', () => {
	let credential: SpikyAiApi;

	beforeEach(() => {
		credential = new SpikyAiApi();
	});

	it('should not extend oAuth2Api', () => {
		expect((credential as unknown as Record<string, unknown>).extends).toBeUndefined();
	});

	it('should have email, password, and cognitoClientId fields', () => {
		const email = credential.properties.find((p) => p.name === 'email');
		const password = credential.properties.find((p) => p.name === 'password');
		const clientId = credential.properties.find((p) => p.name === 'cognitoClientId');

		expect(email?.type).toBe('string');
		expect(password?.type).toBe('string');
		expect(clientId?.type).toBe('string');
	});

	it('should have hidden expirable idToken field', () => {
		const idToken = credential.properties.find((p) => p.name === 'idToken');
		expect(idToken?.type).toBe('hidden');
		expect((idToken?.typeOptions as { expirable?: boolean })?.expirable).toBe(true);
	});

	it('should have hidden refreshToken field', () => {
		const refreshToken = credential.properties.find((p) => p.name === 'refreshToken');
		expect(refreshToken?.type).toBe('hidden');
	});

	it('should authenticate with idToken in Authorization header', () => {
		expect(credential.authenticate).toEqual({
			type: 'generic',
			properties: {
				headers: {
					Authorization: '=Bearer {{$credentials.idToken}}',
				},
			},
		});
	});

	it('should test against platform tags endpoint', () => {
		expect(credential.test).toEqual({
			request: {
				baseURL: '={{$credentials?.platformBaseUrl}}',
				url: '/platform/tags',
			},
		});
	});

	it('should have configurable base URL fields with production defaults', () => {
		const backend = credential.properties.find((p) => p.name === 'backendBaseUrl');
		const corePlatform = credential.properties.find((p) => p.name === 'corePlatformBaseUrl');
		const platform = credential.properties.find((p) => p.name === 'platformBaseUrl');

		expect(backend?.default).toBe('https://backend-api.spiky.ai');
		expect(corePlatform?.default).toBe(
			'https://n86lv9o68k.execute-api.us-east-2.amazonaws.com/prod',
		);
		expect(platform?.default).toBe(
			'https://btrh2q3utg.execute-api.us-east-2.amazonaws.com/prod',
		);
	});

	describe('preAuthentication', () => {
		const baseCredentials = {
			email: 'test@example.com',
			password: 'pass123',
			cognitoClientId: 'client-id',
			backendBaseUrl: 'https://backend-api.example.com',
			refreshToken: '',
		};

		function createMockHelper(httpRequest: jest.Mock) {
			return {
				helpers: { httpRequest },
			};
		}

		it('should login with email/password when no refresh token', async () => {
			const httpRequest = jest.fn().mockResolvedValueOnce({
				is_signed_in: true,
				tokens: {
					id_token: 'new-id-token',
					refresh_token: 'new-refresh-token',
				},
			});

			const helper = createMockHelper(httpRequest);
			const result = await credential.preAuthentication.call(
				helper as never,
				baseCredentials,
			);

			expect(httpRequest).toHaveBeenCalledWith({
				method: 'POST',
				url: 'https://backend-api.example.com/api/v1/auth/login',
				body: {
					email: 'test@example.com',
					password: 'pass123',
					cognito_client_id: 'client-id',
				},
				json: true,
			});
			expect(result).toEqual({
				idToken: 'new-id-token',
				refreshToken: 'new-refresh-token',
			});
		});

		it('should try refresh token first when available', async () => {
			const httpRequest = jest.fn().mockResolvedValueOnce({
				id_token: 'refreshed-id-token',
			});

			const helper = createMockHelper(httpRequest);
			const result = await credential.preAuthentication.call(helper as never, {
				...baseCredentials,
				refreshToken: 'existing-refresh-token',
			});

			expect(httpRequest).toHaveBeenCalledWith({
				method: 'POST',
				url: 'https://backend-api.example.com/api/v1/auth/refresh-token',
				body: {
					refresh_token: 'existing-refresh-token',
					cognito_client_id: 'client-id',
				},
				json: true,
			});
			expect(result).toEqual({ idToken: 'refreshed-id-token' });
		});

		it('should fall back to login when refresh fails', async () => {
			const httpRequest = jest
				.fn()
				// First call: refresh fails
				.mockRejectedValueOnce(new Error('Token expired'))
				// Second call: login succeeds
				.mockResolvedValueOnce({
					is_signed_in: true,
					tokens: {
						id_token: 'fresh-id-token',
						refresh_token: 'fresh-refresh-token',
					},
				});

			const helper = createMockHelper(httpRequest);
			const result = await credential.preAuthentication.call(helper as never, {
				...baseCredentials,
				refreshToken: 'expired-refresh-token',
			});

			expect(httpRequest).toHaveBeenCalledTimes(2);
			expect(result).toEqual({
				idToken: 'fresh-id-token',
				refreshToken: 'fresh-refresh-token',
			});
		});

		it('should throw on auth challenge', async () => {
			const httpRequest = jest.fn().mockResolvedValueOnce({
				is_signed_in: false,
				tokens: null,
				challenge: { challenge_name: 'NEW_PASSWORD_REQUIRED' },
			});

			const helper = createMockHelper(httpRequest);
			await expect(
				credential.preAuthentication.call(helper as never, baseCredentials),
			).rejects.toThrow('NEW_PASSWORD_REQUIRED');
		});
	});
});
