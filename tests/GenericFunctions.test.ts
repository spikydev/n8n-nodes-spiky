import { spikyApiRequest } from '../nodes/SpikyAi/GenericFunctions';

describe('spikyApiRequest', () => {
	const mockHttpRequest = jest.fn();
	const mockLogger = { error: jest.fn(), debug: jest.fn() };

	function createContext(overrides: {
		corePlatformBaseUrl?: string;
		platformBaseUrl?: string;
		idToken?: string | undefined;
	} = {}) {
		const {
			corePlatformBaseUrl = 'https://core.example.com/prod',
			platformBaseUrl = 'https://platform.example.com/prod',
			idToken = 'test-id-token',
		} = overrides;

		return {
			getCredentials: jest.fn().mockResolvedValue({
				corePlatformBaseUrl,
				platformBaseUrl,
				idToken,
			}),
			getNode: jest.fn().mockReturnValue({ name: 'TestNode' }),
			helpers: { httpRequest: mockHttpRequest },
			logger: mockLogger,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} as any;
	}

	beforeEach(() => {
		mockHttpRequest.mockReset();
		mockLogger.error.mockReset();
	});

	describe('URL construction', () => {
		it('should use corePlatformBaseUrl for corePlatform baseUrlKey', async () => {
			const ctx = createContext({ corePlatformBaseUrl: 'https://core-api.example.com/prod' });
			mockHttpRequest.mockResolvedValue({});

			await spikyApiRequest.call(ctx, 'POST', '/n8n/subscription', 'corePlatform');

			expect(mockHttpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					url: 'https://core-api.example.com/prod/n8n/subscription',
				}),
			);
		});

		it('should use platformBaseUrl for platform baseUrlKey', async () => {
			const ctx = createContext({ platformBaseUrl: 'https://platform-api.example.com/prod' });
			mockHttpRequest.mockResolvedValue([]);

			await spikyApiRequest.call(ctx, 'GET', '/platform/n8n/meeting-report', 'platform');

			expect(mockHttpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					url: 'https://platform-api.example.com/prod/platform/n8n/meeting-report',
				}),
			);
		});

		it('should strip trailing slashes from base URL', async () => {
			const ctx = createContext({ corePlatformBaseUrl: 'https://api.example.com/prod///' });
			mockHttpRequest.mockResolvedValue({});

			await spikyApiRequest.call(ctx, 'POST', '/n8n/subscription', 'corePlatform');

			expect(mockHttpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					url: 'https://api.example.com/prod/n8n/subscription',
				}),
			);
		});
	});

	describe('authentication', () => {
		it('should set Authorization header with id_token', async () => {
			const ctx = createContext({ idToken: 'my-cognito-id-token' });
			mockHttpRequest.mockResolvedValue({});

			await spikyApiRequest.call(ctx, 'POST', '/n8n/subscription', 'corePlatform');

			expect(mockHttpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					headers: { Authorization: 'Bearer my-cognito-id-token' },
				}),
			);
		});

		it('should throw when idToken is missing', async () => {
			const ctx = {
				getCredentials: jest.fn().mockResolvedValue({
					corePlatformBaseUrl: 'https://core.example.com/prod',
					platformBaseUrl: 'https://platform.example.com/prod',
				}),
				getNode: jest.fn().mockReturnValue({ name: 'TestNode' }),
				helpers: { httpRequest: mockHttpRequest },
				logger: mockLogger,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} as any;

			await expect(
				spikyApiRequest.call(ctx, 'POST', '/n8n/subscription', 'corePlatform'),
			).rejects.toThrow('No id_token found in credentials');
		});
	});

	describe('request options', () => {
		it('should include body when provided', async () => {
			const ctx = createContext();
			mockHttpRequest.mockResolvedValue({});
			const body = { hookUrl: 'https://n8n.example.com/webhook' };

			await spikyApiRequest.call(ctx, 'POST', '/n8n/subscription', 'corePlatform', body);

			expect(mockHttpRequest).toHaveBeenCalledWith(
				expect.objectContaining({ body }),
			);
		});

		it('should not include body when empty', async () => {
			const ctx = createContext();
			mockHttpRequest.mockResolvedValue({});

			await spikyApiRequest.call(ctx, 'GET', '/test', 'corePlatform', {});

			const callArgs = mockHttpRequest.mock.calls[0][0];
			expect(callArgs.body).toBeUndefined();
		});

		it('should include query string when provided', async () => {
			const ctx = createContext();
			mockHttpRequest.mockResolvedValue([]);
			const qs = { limit: '10' };

			await spikyApiRequest.call(ctx, 'GET', '/test', 'platform', undefined, qs);

			expect(mockHttpRequest).toHaveBeenCalledWith(
				expect.objectContaining({ qs }),
			);
		});

		it('should set json: true', async () => {
			const ctx = createContext();
			mockHttpRequest.mockResolvedValue({});

			await spikyApiRequest.call(ctx, 'GET', '/test', 'corePlatform');

			expect(mockHttpRequest).toHaveBeenCalledWith(
				expect.objectContaining({ json: true }),
			);
		});
	});

	describe('error handling', () => {
		it('should log and rethrow on HTTP failure', async () => {
			const ctx = createContext();
			const error = Object.assign(new Error('Unauthorized'), { statusCode: 401 });
			mockHttpRequest.mockRejectedValue(error);

			await expect(
				spikyApiRequest.call(ctx, 'POST', '/n8n/subscription', 'corePlatform'),
			).rejects.toThrow('Unauthorized');

			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.stringContaining('POST'),
				expect.objectContaining({ statusCode: 401 }),
			);
		});
	});
});
